"""Integration tests against real .sdocx samples in samples/ directory."""
from __future__ import annotations

import io
import zipfile
from pathlib import Path

import pytest

from sdocx2obsidian.core.parser import NoteParser
from sdocx2obsidian.core.records import read_records
from sdocx2obsidian.core.renderer import MarkdownRenderer
from sdocx2obsidian.domain.models import SdocxArchive
from sdocx2obsidian.web.adapter import ConversionSession

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


def test_real_sample_s3_empty_note() -> None:
    """Real sample S3 with empty body yields empty Markdown with trailing newline."""
    s3_path = next((p for p in REAL_SAMPLES if "Empty note with title" in p.name), None)
    if s3_path is None:
        pytest.skip("Sample S3 not found")
    archive = _read_sample_archive(s3_path)
    parsed = NoteParser().parse(archive)
    rendered = MarkdownRenderer().render(parsed, "Assets")

    assert parsed.title == "Empty note with title"
    assert len(parsed.blocks) == 0
    assert len(parsed.assets) == 0
    assert rendered == "\n"


def test_real_sample_s4_emoji_note() -> None:
    """Real sample S4 with emojis and ZWJ decodes correctly and normalizes."""
    s4_path = next((p for p in REAL_SAMPLES if "Note with emoji between texts" in p.name), None)
    if s4_path is None:
        pytest.skip("Sample S4 not found")
    archive = _read_sample_archive(s4_path)
    parsed = NoteParser().parse(archive)
    rendered = MarkdownRenderer().render(parsed, "Assets")

    assert parsed.title == "Note with emoji between texts"
    assert len(parsed.blocks) == 1
    assert "Today is a birthday🎉🎉🎂🎂🔥🙇\u200d♂️🐒" in rendered
    expected_md = (
        "Loreal ipsum\nYellow world\nIddbi\n"
        "Today is a birthday🎉🎉🎂🎂🔥🙇\u200d♂️🐒\n"
    )
    assert rendered == expected_md


def test_real_sample_s5_voice_recorder_audio() -> None:
    """Real sample S5 decodes recorded voice audio objects (sig 17 00) and skips .spi."""
    s5_path = next((p for p in REAL_SAMPLES if "Test Note" in p.name), None)
    if s5_path is None:
        pytest.skip("Sample S5 (Test Note) not found")
    archive = _read_sample_archive(s5_path)
    parsed = NoteParser().parse(archive)
    rendered = MarkdownRenderer().render(parsed, "Test_Note_Assets")

    assert parsed.title == "Test Note"
    assert len(parsed.blocks) == 7
    media_filenames = [b.filename for b in parsed.blocks if hasattr(b, "filename")]
    assert media_filenames == [
        "240610_200556_844.mp3",
        "240610_200606_825.mp3",
        "files240610_200620_779.jpg",
        "240610_200704_044.mp3",
        "240626_132453_378.m4a",
    ]
    assert any("page_0000011.spi" in w for w in parsed.warnings)
    assert "![[Test_Note_Assets/240610_200556_844.mp3]]" in rendered
    assert "![[Test_Note_Assets/240610_200606_825.mp3]]" in rendered
    assert "![[Test_Note_Assets/files240610_200620_779.jpg]]" in rendered
    assert "![[Test_Note_Assets/240610_200704_044.mp3]]" in rendered
    assert "![[Test_Note_Assets/240626_132453_378.m4a]]" in rendered


def test_real_samples_through_web_session() -> None:
    """Verify that all available real samples convert cleanly via ConversionSession."""
    session = ConversionSession()
    for sample_path in REAL_SAMPLES:
        data = sample_path.read_bytes()
        res = session.convert_note(sample_path.name, data)
        assert res.status == "success"
        assert res.markdown_name is not None
        assert res.markdown_text is not None

    zip_bytes, outcome = session.finish()
    assert outcome.total == len(REAL_SAMPLES)
    assert outcome.succeeded == len(REAL_SAMPLES)
    assert outcome.failed == 0

    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        namelist = zf.namelist()
        for res in outcome.results:
            assert res.markdown_name in namelist



