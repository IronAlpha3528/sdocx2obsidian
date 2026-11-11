"""Unit tests for ArchiveExtractor in infrastructure/extractor.py."""
from __future__ import annotations

import hashlib
import io
import zipfile
from pathlib import Path

import pytest

from sdocx2obsidian.domain.exceptions import (
    CorruptArchiveError,
    MissingEntryError,
    UnsafeArchiveError,
)
from sdocx2obsidian.infrastructure.extractor import ArchiveExtractor


def _create_zip(entries: dict[str, bytes]) -> bytes:
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, data in entries.items():
            zf.writestr(name, data)
    return bio.getvalue()


def test_extractor_valid_archive(tmp_path: Path) -> None:
    """Valid archive extracts note bytes and media entries relative to media/."""
    zip_bytes = _create_zip(
        {
            "note.note": b"note payload data",
            "media/0@photo.jpg": b"jpg data",
            "media/1@audio.m4a": b"m4a data",
            "media/mediaInfo.dat": b"sha info ignored",
            "pageIdInfo.dat": b"page id data",
            "end_tag.bin": b"end tag",
        }
    )
    sdocx_file = tmp_path / "My Note.sdocx"
    sdocx_file.write_bytes(zip_bytes)

    extractor = ArchiveExtractor()
    archive = extractor.extract(sdocx_file)

    assert archive.source_name == "My Note"
    assert archive.note_bytes == b"note payload data"
    assert set(archive.media.keys()) == {"0@photo.jpg", "1@audio.m4a"}
    assert archive.media["0@photo.jpg"] == b"jpg data"
    assert archive.media["1@audio.m4a"] == b"m4a data"


def test_extractor_not_a_zip_raises_corrupt(tmp_path: Path) -> None:
    """Non-zip file raises CorruptArchiveError."""
    corrupt = tmp_path / "bad.sdocx"
    corrupt.write_text("this is plain text, not a zip", encoding="utf-8")
    extractor = ArchiveExtractor()
    with pytest.raises(CorruptArchiveError):
        extractor.extract(corrupt)


def test_extractor_empty_file_raises_corrupt(tmp_path: Path) -> None:
    """Zero-byte file raises CorruptArchiveError."""
    empty = tmp_path / "empty.sdocx"
    empty.write_bytes(b"")
    extractor = ArchiveExtractor()
    with pytest.raises(CorruptArchiveError):
        extractor.extract(empty)


def test_extractor_missing_file_raises_corrupt(tmp_path: Path) -> None:
    """Nonexistent file raises CorruptArchiveError."""
    extractor = ArchiveExtractor()
    with pytest.raises(CorruptArchiveError):
        extractor.extract(tmp_path / "does_not_exist.sdocx")


def test_extractor_truncated_archive_raises_corrupt(tmp_path: Path) -> None:
    """Truncated archive raises CorruptArchiveError."""
    truncated = tmp_path / "truncated.sdocx"
    truncated.write_bytes(b"PK\x03\x04truncated_header_data")
    extractor = ArchiveExtractor()
    with pytest.raises(CorruptArchiveError):
        extractor.extract(truncated)


def test_extractor_missing_note_raises_missing_entry(tmp_path: Path) -> None:
    """Archive without note.note raises MissingEntryError."""
    zip_bytes = _create_zip({"media/0@photo.jpg": b"photo"})
    source = tmp_path / "no_note.sdocx"
    source.write_bytes(zip_bytes)
    extractor = ArchiveExtractor()
    with pytest.raises(MissingEntryError):
        extractor.extract(source)


@pytest.mark.parametrize(
    "bad_name",
    [
        "../escape.txt",
        "nested/../../escape.txt",
        "/absolute/file.txt",
        "C:/drive/file.txt",
        "media//double_slash.jpg",
    ],
)
def test_extractor_unsafe_names_raise_unsafe(tmp_path: Path, bad_name: str) -> None:
    """Archive with path traversal or unsafe names raises UnsafeArchiveError."""
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, "w") as zf:
        zf.writestr("note.note", b"content")
        zf.writestr(bad_name, b"malicious")
    source = tmp_path / "unsafe.sdocx"
    source.write_bytes(bio.getvalue())

    extractor = ArchiveExtractor()
    with pytest.raises(UnsafeArchiveError):
        extractor.extract(source)


def test_extractor_raw_backslash_raises_unsafe(tmp_path: Path) -> None:
    """Archive with backslash in raw entry name raises UnsafeArchiveError."""
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, "w") as zf:
        zf.writestr("note.note", b"content")
        zf.writestr("media/foo.txt", b"malicious")
    raw = bio.getvalue().replace(b"media/foo.txt", b"media\\foo.txt")
    source = tmp_path / "backslash.sdocx"
    source.write_bytes(raw)

    extractor = ArchiveExtractor()
    with pytest.raises(UnsafeArchiveError) as exc:
        extractor.extract(source)
    assert "backslash" in str(exc.value)


def test_extractor_raw_nul_byte_raises_unsafe(tmp_path: Path) -> None:
    """Archive with NUL byte in raw entry name raises UnsafeArchiveError."""
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, "w") as zf:
        zf.writestr("note.note", b"content")
        zf.writestr("media/foo.txt", b"malicious")
    raw = bio.getvalue().replace(b"media/foo.txt", b"media\x00foo.txt")
    source = tmp_path / "nul.sdocx"
    source.write_bytes(raw)

    extractor = ArchiveExtractor()
    with pytest.raises(UnsafeArchiveError) as exc:
        extractor.extract(source)
    assert "NUL byte" in str(exc.value)


def test_extractor_entry_length_mismatch_raises_corrupt(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Entry returning different byte count than declared raises CorruptArchiveError."""
    zip_bytes = _create_zip({"note.note": b"real content"})
    source = tmp_path / "mismatch.sdocx"
    source.write_bytes(zip_bytes)

    extractor = ArchiveExtractor()

    def _failing_read(self: zipfile.ZipFile, name_or_info: zipfile.ZipInfo) -> bytes:
        return b"short"

    monkeypatch.setattr(zipfile.ZipFile, "read", _failing_read)
    with pytest.raises(CorruptArchiveError) as exc:
        extractor.extract(source)
    assert "length mismatch" in str(exc.value)


def test_extractor_read_failure_raises_corrupt(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Error during reading entry data raises CorruptArchiveError."""
    zip_bytes = _create_zip({"note.note": b"content"})
    source = tmp_path / "read_err.sdocx"
    source.write_bytes(zip_bytes)

    extractor = ArchiveExtractor()

    def _error_read(self: zipfile.ZipFile, name_or_info: zipfile.ZipInfo) -> bytes:
        raise zipfile.BadZipFile("CRC failed")

    monkeypatch.setattr(zipfile.ZipFile, "read", _error_read)
    with pytest.raises(CorruptArchiveError) as exc:
        extractor.extract(source)
    assert "Failed to read entry" in str(exc.value)




def test_extractor_duplicate_names_raise_unsafe(tmp_path: Path) -> None:
    """Archive with duplicate entries raises UnsafeArchiveError."""
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, "w") as zf:
        zf.writestr("note.note", b"content")
        zf.writestr("media/0@photo.jpg", b"photo 1")
        zf.writestr("media/0@photo.jpg", b"photo 2")
    source = tmp_path / "dup.sdocx"
    source.write_bytes(bio.getvalue())

    extractor = ArchiveExtractor()
    with pytest.raises(UnsafeArchiveError):
        extractor.extract(source)


def test_extractor_entry_count_limit_raises_unsafe(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Exceeding MAX_ENTRIES raises UnsafeArchiveError."""
    from sdocx2obsidian.infrastructure import extractor as ext_mod

    monkeypatch.setattr(ext_mod, "MAX_ENTRIES", 3)
    zip_bytes = _create_zip(
        {
            "note.note": b"content",
            "media/0@a.jpg": b"a",
            "media/1@b.jpg": b"b",
            "media/2@c.jpg": b"c",
        }
    )
    source = tmp_path / "too_many.sdocx"
    source.write_bytes(zip_bytes)

    extractor = ArchiveExtractor()
    with pytest.raises(UnsafeArchiveError) as exc:
        extractor.extract(source)
    assert "entry count limit" in str(exc.value)


def test_extractor_oversize_entry_raises_unsafe(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Single kept entry exceeding MAX_ENTRY_SIZE raises UnsafeArchiveError."""
    from sdocx2obsidian.infrastructure import extractor as ext_mod

    monkeypatch.setattr(ext_mod, "MAX_ENTRY_SIZE", 50)
    zip_bytes = _create_zip(
        {
            "note.note": b"X" * 100,
        }
    )
    source = tmp_path / "oversize.sdocx"
    source.write_bytes(zip_bytes)

    extractor = ArchiveExtractor()
    with pytest.raises(UnsafeArchiveError) as exc:
        extractor.extract(source)
    assert "exceeds entry size limit" in str(exc.value)


def test_extractor_total_oversize_raises_unsafe(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Kept entries total size exceeding MAX_TOTAL_SIZE raises UnsafeArchiveError."""
    from sdocx2obsidian.infrastructure import extractor as ext_mod

    monkeypatch.setattr(ext_mod, "MAX_TOTAL_SIZE", 80)
    zip_bytes = _create_zip(
        {
            "note.note": b"X" * 50,
            "media/0@photo.jpg": b"Y" * 50,
        }
    )
    source = tmp_path / "total_oversize.sdocx"
    source.write_bytes(zip_bytes)

    extractor = ArchiveExtractor()
    with pytest.raises(UnsafeArchiveError) as exc:
        extractor.extract(source)
    assert "exceeds total size limit" in str(exc.value)


def test_extractor_high_compression_ratio_raises_unsafe(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Entry exceeding compression ratio threshold raises UnsafeArchiveError."""
    from sdocx2obsidian.infrastructure import extractor as ext_mod

    monkeypatch.setattr(ext_mod, "MAX_RATIO", 5.0)
    monkeypatch.setattr(ext_mod, "RATIO_THRESHOLD", 50)
    # 2000 zeroes compresses to ~25 bytes; ratio ~80 > 5
    zip_bytes = _create_zip(
        {
            "note.note": b"\x00" * 2000,
        }
    )
    source = tmp_path / "ratio_bomb.sdocx"
    source.write_bytes(zip_bytes)

    extractor = ArchiveExtractor()
    with pytest.raises(UnsafeArchiveError) as exc:
        extractor.extract(source)
    assert "compression ratio" in str(exc.value)


def test_extractor_read_only_leaves_source_unmodified(tmp_path: Path) -> None:
    """Source file bytes and mtime are strictly preserved."""
    zip_bytes = _create_zip({"note.note": b"hello"})
    source = tmp_path / "readonly.sdocx"
    source.write_bytes(zip_bytes)

    digest_before = hashlib.sha256(source.read_bytes()).hexdigest()
    mtime_before = source.stat().st_mtime_ns

    extractor = ArchiveExtractor()
    archive = extractor.extract(source)
    assert archive.note_bytes == b"hello"

    digest_after = hashlib.sha256(source.read_bytes()).hexdigest()
    mtime_after = source.stat().st_mtime_ns

    assert digest_before == digest_after
    assert mtime_before == mtime_after
