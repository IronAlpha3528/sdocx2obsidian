"""Tests for ArchiveExtractor limits profile enforcement and chunked streaming reads."""
from __future__ import annotations

import zipfile
from pathlib import Path

import pytest

from sdocx2obsidian.domain.exceptions import CorruptArchiveError, UnsafeArchiveError
from sdocx2obsidian.domain.limits import DEFAULT_LIMITS, LimitsProfile
from sdocx2obsidian.infrastructure.extractor import ArchiveExtractor


def test_extractor_accepts_custom_limits(tmp_path: Path) -> None:
    zip_path = tmp_path / "custom.sdocx"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("note.note", b"header")

    custom_profile = LimitsProfile(
        max_entries=2,
        max_entry_size=1000,
        max_total_size=2000,
        max_ratio=10.0,
        ratio_threshold=100,
        max_objects=None,
        max_placeholders=None,
    )
    extractor = ArchiveExtractor(limits=custom_profile)
    archive = extractor.extract(zip_path)
    assert archive.note_bytes == b"header"


def test_extractor_entry_count_limit_trips(tmp_path: Path) -> None:
    zip_path = tmp_path / "many_entries.sdocx"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("note.note", b"note")
        for i in range(5):
            zf.writestr(f"media/{i}@img.png", b"data")

    tight_profile = LimitsProfile(
        max_entries=3,
        max_entry_size=1000,
        max_total_size=5000,
        max_ratio=10.0,
        ratio_threshold=100,
        max_objects=None,
        max_placeholders=None,
    )
    extractor = ArchiveExtractor(limits=tight_profile)
    with pytest.raises(UnsafeArchiveError, match="exceeds entry count limit"):
        extractor.extract(zip_path)


def test_extractor_entry_size_limit_trips_during_chunked_read(tmp_path: Path) -> None:
    zip_path = tmp_path / "large_entry.sdocx"
    big_data = b"X" * (128 * 1024)  # 128 KB
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("note.note", b"note")
        zf.writestr("media/0@photo.jpg", big_data)

    small_entry_profile = LimitsProfile(
        max_entries=10,
        max_entry_size=64 * 1024,  # 64 KB limit
        max_total_size=1024 * 1024,
        max_ratio=200.0,
        ratio_threshold=1024 * 1024,
        max_objects=None,
        max_placeholders=None,
    )
    extractor = ArchiveExtractor(limits=small_entry_profile)
    with pytest.raises(UnsafeArchiveError, match="exceeds entry size limit"):
        extractor.extract(zip_path)


def test_extractor_total_size_limit_trips(tmp_path: Path) -> None:
    zip_path = tmp_path / "total_size.sdocx"
    data1 = b"A" * 600
    data2 = b"B" * 600
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("note.note", data1)
        zf.writestr("media/0@file.png", data2)

    small_total_profile = LimitsProfile(
        max_entries=10,
        max_entry_size=1000,
        max_total_size=1000,  # 600 + 600 = 1200 > 1000
        max_ratio=200.0,
        ratio_threshold=1024 * 1024,
        max_objects=None,
        max_placeholders=None,
    )
    extractor = ArchiveExtractor(limits=small_total_profile)
    with pytest.raises(UnsafeArchiveError, match="exceeds total size limit"):
        extractor.extract(zip_path)


def test_extractor_compression_ratio_limit_trips(tmp_path: Path) -> None:
    zip_path = tmp_path / "ratio.sdocx"
    # Highly compressible data over ratio threshold
    repetitive_data = b"0" * (100 * 1024)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("note.note", b"note")
        zf.writestr("media/0@audio.m4a", repetitive_data)

    tight_ratio_profile = LimitsProfile(
        max_entries=10,
        max_entry_size=10 * 1024 * 1024,
        max_total_size=10 * 1024 * 1024,
        max_ratio=5.0,  # 5:1 ratio limit
        ratio_threshold=10 * 1024,  # 10 KB threshold
        max_objects=None,
        max_placeholders=None,
    )
    extractor = ArchiveExtractor(limits=tight_ratio_profile)
    with pytest.raises(UnsafeArchiveError, match="exceeds compression ratio limit"):
        extractor.extract(zip_path)


def test_extractor_chunked_read_byte_identical(tmp_path: Path) -> None:
    zip_path = tmp_path / "chunked_identical.sdocx"
    # Create multi-chunk payload (> 64 KB)
    test_data = bytes(i % 256 for i in range(200 * 1024))
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("note.note", b"note")
        zf.writestr("media/0@binary.jpg", test_data)

    extractor = ArchiveExtractor(limits=DEFAULT_LIMITS)
    archive = extractor.extract(zip_path)
    assert archive.media["0@binary.jpg"] == test_data


def test_extractor_corrupt_stream_checksum_fails(tmp_path: Path) -> None:
    zip_path = tmp_path / "corrupt_stream.sdocx"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("note.note", b"header")
        zf.writestr("media/0@audio.m4a", b"valid audio data")

    # Tamper with compressed stream bytes on disk
    raw_bytes = bytearray(zip_path.read_bytes())
    # Flip a byte in the middle of compressed stream
    target_idx = raw_bytes.find(b"valid audio data")
    if target_idx != -1:
        raw_bytes[target_idx] = ord("X")
    else:
        # Deflated stream: tamper near the end
        raw_bytes[-30] = raw_bytes[-30] ^ 0xFF
    zip_path.write_bytes(raw_bytes)

    extractor = ArchiveExtractor()
    with pytest.raises(CorruptArchiveError):
        extractor.extract(zip_path)
