"""Integration tests against real .sdocx samples in samples/ directory."""
from __future__ import annotations

import zipfile
from pathlib import Path

import pytest

from sdocx2obsidian.core.records import read_records

SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent / "samples"
REAL_SAMPLES = sorted(SAMPLES_DIR.glob("*.sdocx")) if SAMPLES_DIR.exists() else []

pytestmark = [
    pytest.mark.real_samples,
    pytest.mark.skipif(
        not REAL_SAMPLES,
        reason="No real .sdocx samples found in samples/ directory",
    ),
]


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
