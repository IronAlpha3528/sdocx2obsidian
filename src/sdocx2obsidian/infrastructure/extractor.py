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
from sdocx2obsidian.domain.models import SdocxArchive
from sdocx2obsidian.domain.protocols import IArchiveExtractor

MAX_ENTRIES = 5000
MAX_ENTRY_SIZE = 512 * 1024 * 1024
MAX_TOTAL_SIZE = 1024 * 1024 * 1024
MAX_RATIO = 200.0
RATIO_THRESHOLD = 1024 * 1024


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


def _check_entry_limits(info: zipfile.ZipInfo, total_kept: int) -> int:
    if info.file_size > MAX_ENTRY_SIZE:
        raise UnsafeArchiveError(
            f"Entry '{info.filename}' exceeds entry size limit "
            f"({info.file_size} > {MAX_ENTRY_SIZE})"
        )
    new_total = total_kept + info.file_size
    if new_total > MAX_TOTAL_SIZE:
        raise UnsafeArchiveError(
            f"Archive exceeds total size limit ({new_total} > {MAX_TOTAL_SIZE})"
        )
    if info.file_size > RATIO_THRESHOLD:
        compressed = max(info.compress_size, 1)
        ratio = info.file_size / compressed
        if ratio > MAX_RATIO:
            raise UnsafeArchiveError(
                f"Entry '{info.filename}' exceeds compression ratio limit "
                f"({ratio:.1f} > {MAX_RATIO})"
            )
    return new_total


def _read_entry(zf: zipfile.ZipFile, info: zipfile.ZipInfo, source: Path) -> bytes:
    try:
        data = zf.read(info)
    except (zipfile.BadZipFile, zlib.error, EOFError) as exc:
        raise CorruptArchiveError(
            f"Failed to read entry '{info.filename}' in '{source}': {exc}", cause=exc
        ) from exc
    if len(data) != info.file_size:
        raise CorruptArchiveError(
            f"Entry '{info.filename}' length mismatch in '{source}': "
            f"declared {info.file_size}, got {len(data)}"
        )
    return data


class ArchiveExtractor(IArchiveExtractor):
    """Safely extracts note.note and media entries from a .sdocx archive."""

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
        infolist = zf.infolist()
        if len(infolist) > MAX_ENTRIES:
            raise UnsafeArchiveError(
                f"Archive '{source}' exceeds entry count limit ({len(infolist)} > {MAX_ENTRIES})"
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
            total_kept = _check_entry_limits(info, total_kept)
            data = _read_entry(zf, info, source)
            if info.filename == "note.note":
                note_bytes = data
            else:
                media[info.filename[len("media/"):]] = data
        if note_bytes is None:
            raise MissingEntryError(f"Required entry 'note.note' not found in '{source}'")
        return SdocxArchive(source_name=source.stem, note_bytes=note_bytes, media=media)
