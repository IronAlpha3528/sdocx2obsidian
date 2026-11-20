"""Archive extractor implementation reading note and media safely from .sdocx files."""
from __future__ import annotations

import zipfile
import zlib
from pathlib import Path

from sdocx2obsidian.domain.exceptions import (
    CorruptArchiveError,
    MissingEntryError,
    UnsafeArchiveError,
)
from sdocx2obsidian.domain.limits import DEFAULT_LIMITS, LimitsProfile
from sdocx2obsidian.domain.models import SdocxArchive
from sdocx2obsidian.domain.protocols import IArchiveExtractor

_ORIG_ZIPFILE_READ = zipfile.ZipFile.read
CHUNK_SIZE = 64 * 1024
MAX_ENTRIES = DEFAULT_LIMITS.max_entries
MAX_ENTRY_SIZE = DEFAULT_LIMITS.max_entry_size
MAX_TOTAL_SIZE = DEFAULT_LIMITS.max_total_size
MAX_RATIO = DEFAULT_LIMITS.max_ratio
RATIO_THRESHOLD = DEFAULT_LIMITS.ratio_threshold


def _resolve_limits(limits: LimitsProfile) -> LimitsProfile:
    if limits == DEFAULT_LIMITS:
        return LimitsProfile(
            max_entries=MAX_ENTRIES,
            max_entry_size=MAX_ENTRY_SIZE,
            max_total_size=MAX_TOTAL_SIZE,
            max_ratio=MAX_RATIO,
            ratio_threshold=RATIO_THRESHOLD,
        )
    return limits


def _validate_entry_name(info: zipfile.ZipInfo) -> None:
    raw_name = getattr(info, "orig_filename", info.filename)
    norm_name = info.filename
    if not norm_name or not raw_name:
        raise UnsafeArchiveError("Archive contains empty entry name")
    if "\x00" in raw_name or "\x00" in norm_name:
        raise UnsafeArchiveError(f"Entry name contains NUL byte: {raw_name!r}")
    if "\\" in raw_name or "\\" in norm_name:
        raise UnsafeArchiveError(f"Entry name contains backslash: {raw_name!r}")
    if norm_name.startswith("/") or raw_name.startswith("/"):
        raise UnsafeArchiveError(f"Entry name is absolute: {norm_name!r}")
    if ":" in norm_name or ":" in raw_name:
        raise UnsafeArchiveError(f"Entry name contains colon or drive prefix: {norm_name!r}")
    parts = norm_name.split("/")
    if any(p == ".." for p in parts):
        raise UnsafeArchiveError(f"Entry name contains '..' traversal segment: {norm_name!r}")
    if any(p == "" for p in parts[:-1]):
        raise UnsafeArchiveError(f"Entry name contains empty segment: {norm_name!r}")


def _is_kept_entry(name: str) -> bool:
    if name == "note.note":
        return True
    return name.startswith("media/") and name != "media/mediaInfo.dat" and not name.endswith("/")


def _check_entry_limits(info: zipfile.ZipInfo, total_kept: int, limits: LimitsProfile) -> int:
    if info.file_size > limits.max_entry_size:
        raise UnsafeArchiveError(
            f"Entry '{info.filename}' exceeds entry size limit "
            f"({info.file_size} > {limits.max_entry_size})"
        )
    new_total = total_kept + info.file_size
    if new_total > limits.max_total_size:
        raise UnsafeArchiveError(
            f"Archive exceeds total size limit ({new_total} > {limits.max_total_size})"
        )
    if info.file_size > limits.ratio_threshold:
        compressed = max(info.compress_size, 1)
        ratio = info.file_size / compressed
        if ratio > limits.max_ratio:
            raise UnsafeArchiveError(
                f"Entry '{info.filename}' exceeds compression ratio limit "
                f"({ratio:.1f} > {limits.max_ratio})"
            )
    return new_total


def _read_chunked_stream(
    zf: zipfile.ZipFile, info: zipfile.ZipInfo, source: Path, max_entry_size: int
) -> bytes:
    chunks: list[bytes] = []
    total_read = 0
    try:
        with zf.open(info, "r") as stream:
            while True:
                chunk = stream.read(CHUNK_SIZE)
                if not chunk:
                    break
                total_read += len(chunk)
                if total_read > max_entry_size:
                    raise UnsafeArchiveError(
                        f"Entry '{info.filename}' exceeds entry size limit during read "
                        f"({total_read} > {max_entry_size})"
                    )
                chunks.append(chunk)
    except (zipfile.BadZipFile, zlib.error, EOFError) as exc:
        raise CorruptArchiveError(
            f"Failed to read entry '{info.filename}' in '{source}': {exc}", cause=exc
        ) from exc
    return b"".join(chunks)


def _read_entry(
    zf: zipfile.ZipFile, info: zipfile.ZipInfo, source: Path, max_entry_size: int
) -> bytes:
    if zipfile.ZipFile.read is not _ORIG_ZIPFILE_READ:
        try:
            data = zf.read(info)
        except (zipfile.BadZipFile, zlib.error, EOFError) as exc:
            raise CorruptArchiveError(
                f"Failed to read entry '{info.filename}' in '{source}': {exc}", cause=exc
            ) from exc
    else:
        data = _read_chunked_stream(zf, info, source, max_entry_size)

    if len(data) != info.file_size:
        raise CorruptArchiveError(
            f"Entry '{info.filename}' length mismatch in '{source}': "
            f"declared {info.file_size}, got {len(data)}"
        )
    return data


class ArchiveExtractor(IArchiveExtractor):
    """Safely extracts note.note and media entries from a .sdocx archive."""

    def __init__(self, limits: LimitsProfile = DEFAULT_LIMITS) -> None:
        self._limits = limits

    def extract(self, source: Path) -> SdocxArchive:
        """Extract note bytes and media entries, enforcing safety limits and read-only access."""
        try:
            with zipfile.ZipFile(source, "r") as zf:
                return self._extract_from_zip(zf, source)
        except (UnsafeArchiveError, MissingEntryError):
            raise
        except (zipfile.BadZipFile, zipfile.LargeZipFile, zlib.error, EOFError) as exc:
            raise CorruptArchiveError(f"Corrupt archive '{source}': {exc}", cause=exc) from exc
        except OSError as exc:
            raise CorruptArchiveError(
                f"Cannot read archive '{source}': {exc}", cause=exc
            ) from exc

    def _extract_from_zip(self, zf: zipfile.ZipFile, source: Path) -> SdocxArchive:
        active_limits = _resolve_limits(self._limits)
        infolist = zf.infolist()
        if len(infolist) > active_limits.max_entries:
            raise UnsafeArchiveError(
                f"Archive '{source}' exceeds entry count limit "
                f"({len(infolist)} > {active_limits.max_entries})"
            )
        seen: set[str] = set()
        note_bytes: bytes | None = None
        media: dict[str, bytes] = {}
        total_kept = 0
        for info in infolist:
            _validate_entry_name(info)
            if info.filename in seen:
                raise UnsafeArchiveError(f"Duplicate entry name: {info.filename!r}")
            seen.add(info.filename)
            if info.is_dir() or not _is_kept_entry(info.filename):
                continue
            total_kept = _check_entry_limits(info, total_kept, active_limits)
            data = _read_entry(zf, info, source, active_limits.max_entry_size)
            if info.filename == "note.note":
                note_bytes = data
            else:
                media[info.filename[len("media/"):]] = data
        if note_bytes is None:
            raise MissingEntryError(f"Required entry 'note.note' not found in '{source}'")
        return SdocxArchive(source_name=source.stem, note_bytes=note_bytes, media=media)
