"""Tests verifying domain exception mapping to user-facing codes and messages."""
from __future__ import annotations

from sdocx2obsidian.domain.exceptions import (
    CorruptArchiveError,
    MalformedNoteError,
    MissingEntryError,
    RenderError,
    Sdocx2ObsidianError,
    UnsafeArchiveError,
)
from sdocx2obsidian.web.adapter import map_exception_to_error


def test_map_corrupt_archive_error() -> None:
    exc = CorruptArchiveError("CRC mismatch /secret/path/to/archive.sdocx")
    code, msg = map_exception_to_error(exc)
    assert code == "CORRUPT_ARCHIVE"
    assert msg == "This file is not a valid or complete Samsung Notes .sdocx archive."
    assert "/secret/path" not in msg


def test_map_unsafe_archive_error() -> None:
    exc = UnsafeArchiveError("Path traversal ../../etc/passwd")
    code, msg = map_exception_to_error(exc)
    assert code == "UNSAFE_ARCHIVE"
    assert msg == "This file exceeds the safety limits of this tool or contains invalid paths."
    assert "passwd" not in msg


def test_map_missing_entry_error() -> None:
    exc = MissingEntryError("note.note not found")
    code, msg = map_exception_to_error(exc)
    assert code == "MISSING_ENTRY"
    assert msg == "This does not look like a supported modern Samsung Notes file."
    assert "note.note" not in msg


def test_map_malformed_note_error() -> None:
    exc = MalformedNoteError("Invalid header length")
    code, msg = map_exception_to_error(exc)
    assert code == "MALFORMED_NOTE"
    assert msg == (
        "The note could not be read. It may come from an unsupported Samsung Notes version."
    )
    assert "header" not in msg


def test_map_render_error() -> None:
    exc = RenderError("Failed to build link")
    code, msg = map_exception_to_error(exc)
    assert code == "RENDER_ERROR"
    assert msg == "Could not create valid links for this note."


def test_map_generic_domain_error() -> None:
    exc = Sdocx2ObsidianError("Generic internal failure")
    code, msg = map_exception_to_error(exc)
    assert code == "UNEXPECTED_ERROR"
    assert msg == "Something unexpected went wrong with this note."
    assert "Generic" not in msg


def test_map_unexpected_exception() -> None:
    exc = RuntimeError("System memory exhausted at 0xdeadbeef")
    code, msg = map_exception_to_error(exc)
    assert code == "UNEXPECTED_ERROR"
    assert msg == "Something unexpected went wrong with this note."
    assert "0xdeadbeef" not in msg
