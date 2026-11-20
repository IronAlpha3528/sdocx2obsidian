"""Web composition root and in-memory conversion session adapter."""
from __future__ import annotations

import io
import shutil
import tempfile
import uuid
import zipfile
from dataclasses import dataclass
from pathlib import Path

from sdocx2obsidian.core.parser import NoteParser
from sdocx2obsidian.core.renderer import MarkdownRenderer
from sdocx2obsidian.domain.exceptions import (
    CorruptArchiveError,
    MalformedNoteError,
    MissingEntryError,
    RenderError,
    Sdocx2ObsidianError,
    UnsafeArchiveError,
)
from sdocx2obsidian.domain.limits import WEB_LIMITS, LimitsProfile
from sdocx2obsidian.infrastructure.extractor import ArchiveExtractor
from sdocx2obsidian.infrastructure.storage import StorageRepository

_ERROR_MAP: tuple[tuple[type[Sdocx2ObsidianError], str, str], ...] = (
    (
        CorruptArchiveError,
        "CORRUPT_ARCHIVE",
        "This file is not a valid or complete Samsung Notes .sdocx archive.",
    ),
    (
        UnsafeArchiveError,
        "UNSAFE_ARCHIVE",
        "This file exceeds the safety limits of this tool or contains invalid paths.",
    ),
    (
        MissingEntryError,
        "MISSING_ENTRY",
        "This does not look like a supported modern Samsung Notes file.",
    ),
    (
        MalformedNoteError,
        "MALFORMED_NOTE",
        "The note could not be read. It may come from an unsupported Samsung Notes version.",
    ),
    (
        RenderError,
        "RENDER_ERROR",
        "Could not create valid links for this note.",
    ),
)


def map_exception_to_error(exc: Exception) -> tuple[str, str]:
    """Map internal domain exception to stable error code and safe visitor message."""
    for exc_cls, code, msg in _ERROR_MAP:
        if isinstance(exc, exc_cls):
            return code, msg
    return "UNEXPECTED_ERROR", "Something unexpected went wrong with this note."


@dataclass(frozen=True, slots=True)
class NoteResult:
    """Outcome of converting a single note in the browser session."""

    status: str
    filename: str
    conversion_id: str
    markdown_name: str | None = None
    markdown_text: str | None = None
    asset_count: int = 0
    warnings: tuple[str, ...] = ()
    error_code: str | None = None
    message: str | None = None


@dataclass(frozen=True, slots=True)
class SessionOutcome:
    """Summary of all note conversions processed in a session."""

    total: int
    succeeded: int
    failed: int
    results: tuple[NoteResult, ...]


def _is_media_entry(rel_path: Path) -> bool:
    return rel_path.suffix.lower() not in {".md", ".txt"}


def _add_zip_entry(zf: zipfile.ZipFile, base_dir: Path, rel_path: Path) -> None:
    full_path = base_dir / rel_path
    if not full_path.is_file():
        return
    posix_name = rel_path.as_posix()
    compress_type = zipfile.ZIP_STORED if _is_media_entry(rel_path) else zipfile.ZIP_DEFLATED
    info = zipfile.ZipInfo(filename=posix_name, date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = compress_type
    info.flag_bits |= 0x800
    zf.writestr(info, full_path.read_bytes())


def package_directory_to_zip(source_dir: Path) -> bytes:
    """Create deterministic ZIP bytes from directory contents."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        paths = [p.relative_to(source_dir) for p in source_dir.rglob("*") if p.is_file()]
        paths.sort(key=lambda p: p.as_posix())
        for rel_path in paths:
            _add_zip_entry(zf, source_dir, rel_path)
    return buffer.getvalue()


class ConversionSession:
    """In-memory conversion session maintaining lifecycle and collision resolution."""

    def __init__(
        self,
        limits: LimitsProfile = WEB_LIMITS,
        work_dir: Path | None = None,
    ) -> None:
        self._limits = limits
        self._owns_work_dir = work_dir is None
        self._work_dir = (
            work_dir
            if work_dir is not None
            else Path(tempfile.mkdtemp(prefix="sdocx_web_"))
        )
        self._output_dir = self._work_dir / "output"
        self._input_dir = self._work_dir / "input"
        self._input_dir.mkdir(parents=True, exist_ok=True)
        self._output_dir.mkdir(parents=True, exist_ok=True)

        self._extractor = ArchiveExtractor(limits=self._limits)
        self._parser = NoteParser(limits=self._limits)
        self._renderer = MarkdownRenderer()
        self._storage = StorageRepository()
        self._storage.prepare(self._output_dir)

        self._files_count = 0
        self._total_bytes_read = 0
        self._results: list[NoteResult] = []
        self._finished = False
        self._aborted = False

    @property
    def work_dir(self) -> Path:
        return self._work_dir

    def _check_session_limits(self, data_len: int) -> tuple[str, str] | None:
        msg = "This file exceeds the safety limits of this tool or contains invalid paths."
        if self._files_count >= self._limits.max_session_files:
            return "UNSAFE_ARCHIVE", msg
        if data_len > self._limits.max_file_size:
            return "UNSAFE_ARCHIVE", msg
        if self._total_bytes_read + data_len > self._limits.max_session_bytes:
            return "UNSAFE_ARCHIVE", msg
        return None

    def convert_note(self, filename: str, data: bytes) -> NoteResult:
        """Convert a single note from raw bytes within the session."""
        if self._finished or self._aborted:
            raise RuntimeError("Session is already closed")

        conv_id = str(uuid.uuid4())
        limit_err = self._check_session_limits(len(data))
        if limit_err is not None:
            code, msg = limit_err
            res = NoteResult(
                status="failed",
                filename=filename,
                conversion_id=conv_id,
                error_code=code,
                message=msg,
            )
            self._results.append(res)
            return res

        self._files_count += 1
        self._total_bytes_read += len(data)
        return self._execute_conversion(filename, data, conv_id)

    def _execute_conversion(self, filename: str, data: bytes, conv_id: str) -> NoteResult:
        note_stem = Path(filename).stem or "Untitled"
        temp_dir = self._input_dir / conv_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        temp_input = temp_dir / f"{note_stem}.sdocx"
        try:
            temp_input.write_bytes(data)
            archive = self._extractor.extract(temp_input)
            note = self._parser.parse(archive)
            paths = self._storage.resolve_target_paths(self._output_dir, archive.source_name)
            markdown = self._renderer.render(note, paths.assets_dir_name)
            self._storage.persist(paths, markdown, note.assets)
            res = NoteResult(
                status="success",
                filename=filename,
                conversion_id=conv_id,
                markdown_name=paths.md_path.name,
                markdown_text=markdown,
                asset_count=len(note.assets),
                warnings=note.warnings,
            )
        except Exception as exc:
            code, msg = map_exception_to_error(exc)
            res = NoteResult(
                status="failed",
                filename=filename,
                conversion_id=conv_id,
                error_code=code,
                message=msg,
            )
        finally:
            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)
        self._results.append(res)
        return res

    def finish(self) -> tuple[bytes, SessionOutcome]:
        """Finish session, package in-memory ZIP output, and clean up scratch storage."""
        if self._finished or self._aborted:
            raise RuntimeError("Session is already closed")
        self._finished = True
        try:
            zip_bytes = package_directory_to_zip(self._output_dir)
            succeeded = sum(1 for r in self._results if r.status == "success")
            failed = sum(1 for r in self._results if r.status == "failed")
            outcome = SessionOutcome(
                total=len(self._results),
                succeeded=succeeded,
                failed=failed,
                results=tuple(self._results),
            )
            return zip_bytes, outcome
        finally:
            self._cleanup()

    def abort(self) -> None:
        """Abort session immediately and discard all session files."""
        if self._finished or self._aborted:
            raise RuntimeError("Session is already closed")
        self._aborted = True
        self._cleanup()

    def _cleanup(self) -> None:
        if self._owns_work_dir and self._work_dir.exists():
            shutil.rmtree(self._work_dir, ignore_errors=True)
