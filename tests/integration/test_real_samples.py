"""Integration tests against real .sdocx samples in samples/ directory."""
from __future__ import annotations

import zipfile
from pathlib import Path

import pytest

from sdocx2obsidian.core.parser import NoteParser
from sdocx2obsidian.core.records import read_records
from sdocx2obsidian.core.renderer import MarkdownRenderer
from sdocx2obsidian.domain.models import SdocxArchive

SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent / "samples"
REAL_SAMPLES = sorted(SAMPLES_DIR.glob("*.sdocx")) if SAMPLES_DIR.exists() else []

pytestmark = [
    pytest.mark.real_samples,
    pytest.mark.skipif(
        not REAL_SAMPLES,
        reason="No real .sdocx samples found in samples/ directory",
    ),
]


def _read_sample_archive(path: Path) -> SdocxArchive:
    with zipfile.ZipFile(path, "r") as zf:
        note_bytes = zf.read("note.note")
        media: dict[str, bytes] = {}
        for info in zf.infolist():
            if info.filename.startswith("media/") and not info.filename.endswith("mediaInfo.dat"):
                name = info.filename.removeprefix("media/")
                media[name] = zf.read(info.filename)
    return SdocxArchive(source_name=path.stem, note_bytes=note_bytes, media=media)


def test_real_samples_discovery() -> None:
    """Verify that real sample files in samples/ can be discovered."""
    assert len(REAL_SAMPLES) >= 2
    filenames = [p.name for p in REAL_SAMPLES]
    assert any("Hello world" in name for name in filenames)
    assert any("Yolo" in name for name in filenames)


def test_real_sample_s1_records() -> None:
    """Real sample S1 decodes title, placeholders, and inline objects."""
    s1_path = next(p for p in REAL_SAMPLES if "Hello world" in p.name)
    with zipfile.ZipFile(s1_path, "r") as zf:
        note_bytes = zf.read("note.note")

    records = read_records(note_bytes)
    assert records.title == "Hello world"
    assert len(records.placeholder_offsets) == 2
    assert records.placeholder_offsets == (64, 119)
    assert len(records.objects) == 2
    assert records.objects[0].kind == "image"
    assert records.objects[0].media_index == 0
    assert records.objects[1].kind == "audio"
    assert records.objects[1].media_index == 1
    assert records.objects[1].audio_title == "Over_the_Horizon"


def test_real_sample_s2_records() -> None:
    """Real sample S2 decodes title, 3 placeholders, and 3 inline objects."""
    s2_path = next(p for p in REAL_SAMPLES if "Yolo" in p.name)
    with zipfile.ZipFile(s2_path, "r") as zf:
        note_bytes = zf.read("note.note")

    records = read_records(note_bytes)
    assert records.title == "Yolo"
    assert len(records.placeholder_offsets) == 3
    assert records.placeholder_offsets == (19, 20, 21)
    assert len(records.objects) == 3
    assert records.objects[0].kind == "image"
    assert records.objects[0].media_index == 0
    assert records.objects[1].kind == "image"
    assert records.objects[1].media_index == 1
    assert records.objects[2].kind == "audio"
    assert records.objects[2].media_index == 2


def test_real_sample_s1_golden_markdown() -> None:
    """S1 parser plus renderer produces DDS 8.4 golden Markdown byte-for-byte."""
    s1_path = next(p for p in REAL_SAMPLES if "Hello world" in p.name)
    archive = _read_sample_archive(s1_path)
    parsed = NoteParser().parse(archive)
    rendered = MarkdownRenderer().render(parsed, "Hello_world_261028_230938_Assets")

    expected = (
        "![[Hello_world_261028_230938_Assets/6ae232fb_b55e6.m4a]]\n\n"
        "This would be normal text inthe notes with images between them\n\n"
        "![[Hello_world_261028_230938_Assets/files_261028_230722_161.jpg]]\n\n"
        "The above is a random image, and this is a test note\n\n"
        "![[Hello_world_261028_230938_Assets/_261028_230754_224.m4a]]\n\n"
        "This is a test audio file.\n\n"
        "Hello\n"
        "Hi Ola\n\n"
        "This is sample text in a sample note\n\n"
        "Hsiw hwid\n\n"
        "Husis s\n"
        "Ysudisv\n"
        "Odyssey\n"
        "Usidbsiiss\n"
        "Sister\n"
        "Isus9\n"
        "Using\n"
        "20th October 2026:\n"
    )
    assert rendered == expected


def test_real_sample_s2_golden_markdown() -> None:
    """S2 parser plus renderer produces DDS 8.4 golden Markdown byte-for-byte."""
    s2_path = next(p for p in REAL_SAMPLES if "Yolo" in p.name)
    archive = _read_sample_archive(s2_path)
    parsed = NoteParser().parse(archive)
    rendered = MarkdownRenderer().render(parsed, "Yolo_261029_130712_Assets")

    expected = (
        "Hdidjsbo\n"
        "Isisbsuow\n\n"
        "![[Yolo_261029_130712_Assets/files_261029_130656_907.jpg]]\n\n"
        "![[Yolo_261029_130712_Assets/files_261029_130656_922.jpg]]\n\n"
        "![[Yolo_261029_130712_Assets/_261029_130708_202.m4a]]\n"
    )
    assert rendered == expected
