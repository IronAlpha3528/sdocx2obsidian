"""End-to-end acceptance tests verifying SRS criteria AC-1 to AC-4 and scenario catalogue."""
from __future__ import annotations

import hashlib
from pathlib import Path

from tests.helpers.builder import (
    CorruptionMode,
    ObjectDescriptor,
    SdocxBuilder,
    create_s1_synthetic,
    create_s2_synthetic,
)
from typer.testing import CliRunner

from sdocx2obsidian.cli import app

runner = CliRunner()


def test_ac1_single_note_with_media_end_to_end(tmp_path: Path) -> None:
    """AC-1: Valid note with media converts to .md with embeds and asset folder."""
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    dest_dir = tmp_path / "dest"

    note_path = source_dir / "VisualNote.sdocx"
    note_path.write_bytes(
        SdocxBuilder(
            title="VisualNote",
            body="Text before image\n\n\ufffc\nText after image\n",
            objects=[ObjectDescriptor.image(media_index=0)],
            media_files={"0@photo.jpg": b"\xff\xd8\xff\xe0" + b"\x00" * 30},
        ).build_bytes()
    )

    result = runner.invoke(app, ["-s", str(source_dir), "-d", str(dest_dir)])
    assert result.exit_code == 0

    md_file = dest_dir / "VisualNote.md"
    asset_dir = dest_dir / "VisualNote_Assets"

    assert md_file.is_file()
    assert asset_dir.is_dir()

    md_content = md_file.read_text(encoding="utf-8")
    assert "![[VisualNote_Assets/photo.jpg]]" in md_content
    assert "\\" not in md_content  # Forward slashes only

    asset_file = asset_dir / "photo.jpg"
    assert asset_file.is_file()
    assert asset_file.read_bytes() == b"\xff\xd8\xff\xe0" + b"\x00" * 30


def test_ac2_text_only_note_end_to_end(tmp_path: Path) -> None:
    """AC-2: Note without media creates only .md file, no asset folder (clean vault)."""
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    dest_dir = tmp_path / "dest"

    note_path = source_dir / "PlainTextNote.sdocx"
    note_path.write_bytes(
        SdocxBuilder(
            title="PlainTextNote",
            body="First paragraph of text.\n\nSecond paragraph of text.\n",
        ).build_bytes()
    )

    result = runner.invoke(app, ["-s", str(source_dir), "-d", str(dest_dir)])
    assert result.exit_code == 0

    md_file = dest_dir / "PlainTextNote.md"
    assert md_file.is_file()

    # Clean vault rule: no asset folder created
    asset_dirs = [p for p in dest_dir.iterdir() if p.is_dir()]
    assert asset_dirs == []


def test_ac3_collision_resolution_end_to_end(tmp_path: Path) -> None:
    """AC-3: Target name collisions increment version and link to versioned asset folder."""
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    dest_dir = tmp_path / "dest"
    dest_dir.mkdir()

    # Pre-existing file and asset directory
    (dest_dir / "MeetingNotes.md").write_text("Existing note", encoding="utf-8")
    existing_assets = dest_dir / "MeetingNotes_Assets"
    existing_assets.mkdir()
    (existing_assets / "old.png").write_bytes(b"old")

    note_path = source_dir / "MeetingNotes.sdocx"
    note_path.write_bytes(
        SdocxBuilder(
            title="MeetingNotes",
            body="New meeting notes with image\n\n\ufffc\n",
            objects=[ObjectDescriptor.image(media_index=0)],
            media_files={"0@new_diagram.png": b"diagram_bytes"},
        ).build_bytes()
    )

    result = runner.invoke(app, ["-s", str(source_dir), "-d", str(dest_dir)])
    assert result.exit_code == 0

    v1_md = dest_dir / "MeetingNotes (1).md"
    v1_assets = dest_dir / "MeetingNotes (1)_Assets"

    assert v1_md.is_file()
    assert v1_assets.is_dir()
    assert (v1_assets / "new_diagram.png").read_bytes() == b"diagram_bytes"

    # Embed in v1 note points to the versioned asset folder
    content = v1_md.read_text(encoding="utf-8")
    assert "![[MeetingNotes (1)_Assets/new_diagram.png]]" in content

    # Original files untouched
    assert (dest_dir / "MeetingNotes.md").read_text(encoding="utf-8") == "Existing note"
    assert (existing_assets / "old.png").read_bytes() == b"old"


def test_ac4_batch_resilience_end_to_end(tmp_path: Path) -> None:
    """AC-4: Batch completes cleanly when individual notes fail, reporting summary."""
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    dest_dir = tmp_path / "dest"

    (source_dir / "Note1.sdocx").write_bytes(
        SdocxBuilder(title="Note1", body="Body of Note 1").build_bytes()
    )
    (source_dir / "Note2_Corrupt.sdocx").write_bytes(
        SdocxBuilder(title="Note2", body="Corrupt").build_bytes(
            corruption=CorruptionMode.TRUNCATED_ZIP
        )
    )
    (source_dir / "Note3.sdocx").write_bytes(
        SdocxBuilder(title="Note3", body="Body of Note 3").build_bytes()
    )

    result = runner.invoke(app, ["-s", str(source_dir), "-d", str(dest_dir)])
    assert result.exit_code == 0

    assert (dest_dir / "Note1.md").is_file()
    assert (dest_dir / "Note3.md").is_file()
    assert not (dest_dir / "Note2_Corrupt.md").exists()

    assert "Total:     3" in result.output
    assert "Succeeded: 2" in result.output
    assert "Failed:    1" in result.output
    assert "Note2_Corrupt.sdocx" in result.output


def test_t03_clean_vault_invariant(tmp_path: Path) -> None:
    """T-03: Empty body and no media creates single-newline .md and no asset folder."""
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    dest_dir = tmp_path / "dest"

    (source_dir / "EmptyNote.sdocx").write_bytes(
        SdocxBuilder(title="EmptyNote", body="").build_bytes()
    )

    result = runner.invoke(app, ["-s", str(source_dir), "-d", str(dest_dir)])
    assert result.exit_code == 0

    md_file = dest_dir / "EmptyNote.md"
    assert md_file.is_file()
    assert md_file.read_text(encoding="utf-8") == "\n"

    # Zero folders in destination
    assert [p for p in dest_dir.iterdir() if p.is_dir()] == []


def test_t14_determinism_repeated_execution(tmp_path: Path) -> None:
    """T-14: Converting identical input into clean destinations yields identical bytes."""
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    (source_dir / "Sample.sdocx").write_bytes(create_s1_synthetic())

    dest1 = tmp_path / "dest1"
    dest2 = tmp_path / "dest2"

    runner.invoke(app, ["-s", str(source_dir), "-d", str(dest1)])
    runner.invoke(app, ["-s", str(source_dir), "-d", str(dest2)])

    md1 = (dest1 / "Sample.md").read_bytes()
    md2 = (dest2 / "Sample.md").read_bytes()
    assert md1 == md2

    assets1 = sorted(p.name for p in (dest1 / "Sample_Assets").iterdir())
    assets2 = sorted(p.name for p in (dest2 / "Sample_Assets").iterdir())
    assert assets1 == assets2


def test_t17_source_immutability(tmp_path: Path) -> None:
    """T-17: Source file content and modification timestamp are strictly preserved."""
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    dest_dir = tmp_path / "dest"

    sample_path = source_dir / "Immutable.sdocx"
    sample_path.write_bytes(create_s1_synthetic())

    sha_before = hashlib.sha256(sample_path.read_bytes()).hexdigest()
    mtime_before = sample_path.stat().st_mtime_ns

    result = runner.invoke(app, ["-s", str(source_dir), "-d", str(dest_dir)])
    assert result.exit_code == 0

    sha_after = hashlib.sha256(sample_path.read_bytes()).hexdigest()
    mtime_after = sample_path.stat().st_mtime_ns

    assert sha_before == sha_after
    assert mtime_before == mtime_after


def test_t18_golden_outputs(tmp_path: Path) -> None:
    """T-18: Synthetic S1 and S2 notes render golden outputs matching DDS §8.4."""
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    dest_dir = tmp_path / "dest"

    (source_dir / "S1.sdocx").write_bytes(create_s1_synthetic())
    (source_dir / "S2.sdocx").write_bytes(create_s2_synthetic())

    result = runner.invoke(app, ["-s", str(source_dir), "-d", str(dest_dir)])
    assert result.exit_code == 0

    s1_md = (dest_dir / "S1.md").read_text(encoding="utf-8")
    assert "![[S1_Assets/6ae232fb_b55e6.m4a]]\n\n" in s1_md
    assert "![[S1_Assets/files_261028_230722_161.jpg]]\n\n" in s1_md
    assert "![[S1_Assets/_261028_230754_224.m4a]]\n\n" in s1_md

    s2_md = (dest_dir / "S2.md").read_text(encoding="utf-8")
    assert "![[S2_Assets/files_261029_130656_907.jpg]]\n\n" in s2_md
    assert "![[S2_Assets/files_261029_130656_922.jpg]]\n\n" in s2_md
    assert "![[S2_Assets/_261029_130708_202.m4a]]\n" in s2_md
