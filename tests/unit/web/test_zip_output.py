"""Tests verifying deterministic in-memory ZIP packaging."""
from __future__ import annotations

import io
import zipfile
from pathlib import Path

from sdocx2obsidian.web.adapter import package_directory_to_zip


def test_zip_deterministic_bytes(tmp_path: Path) -> None:
    # Setup directory structure
    d1 = tmp_path / "run1"
    d1.mkdir()
    (d1 / "Note.md").write_text("# Title\nContent", encoding="utf-8")
    assets1 = d1 / "Note_Assets"
    assets1.mkdir()
    (assets1 / "image.png").write_bytes(b"\x89PNG\r\n\x1a\nfakeimagebytes")

    d2 = tmp_path / "run2"
    d2.mkdir()
    (d2 / "Note.md").write_text("# Title\nContent", encoding="utf-8")
    assets2 = d2 / "Note_Assets"
    assets2.mkdir()
    (assets2 / "image.png").write_bytes(b"\x89PNG\r\n\x1a\nfakeimagebytes")

    zip1 = package_directory_to_zip(d1)
    zip2 = package_directory_to_zip(d2)

    assert zip1 == zip2
    assert len(zip1) > 0


def test_zip_compression_and_fixed_timestamps(tmp_path: Path) -> None:
    dest = tmp_path / "dest"
    dest.mkdir()
    (dest / "Note.md").write_text("# Hello world markdown content", encoding="utf-8")
    assets = dest / "Note_Assets"
    assets.mkdir()
    (assets / "audio.m4a").write_bytes(b"ftypM4A fake audio stream data")

    zip_bytes = package_directory_to_zip(dest)
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        infolist = zf.infolist()
        assert len(infolist) == 2

        # Check sorting: entries must be in strictly sorted alphabetical order
        assert [info.filename for info in infolist] == ["Note.md", "Note_Assets/audio.m4a"]

        for info in infolist:
            # Fixed timestamp (1980, 1, 1, 0, 0, 0)
            assert info.date_time == (1980, 1, 1, 0, 0, 0)
            # Forward slash only
            assert "\\" not in info.filename
            # No traversal
            assert ".." not in info.filename

        # Note.md must be deflated
        md_info = zf.getinfo("Note.md")
        assert md_info.compress_type == zipfile.ZIP_DEFLATED

        # Media must be stored uncompressed
        media_info = zf.getinfo("Note_Assets/audio.m4a")
        assert media_info.compress_type == zipfile.ZIP_STORED


def test_zip_non_ascii_names(tmp_path: Path) -> None:
    dest = tmp_path / "dest"
    dest.mkdir()
    # Note with non-ASCII and emoji
    name = "ملاحظة_📝_テスト.md"
    (dest / name).write_text("# Non-ascii title", encoding="utf-8")

    zip_bytes = package_directory_to_zip(dest)
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        assert name in zf.namelist()
        info = zf.getinfo(name)
        # UTF-8 flag bit (bit 11: 0x800)
        assert info.flag_bits & 0x800 != 0
        assert zf.read(name).decode("utf-8") == "# Non-ascii title"
