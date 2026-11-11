"""Unit tests for synthetic .sdocx archive builder in tests/helpers/builder.py."""
from __future__ import annotations

import io
import zipfile

from tests.helpers.builder import (
    CorruptionMode,
    ObjectDescriptor,
    SdocxBuilder,
    create_s1_synthetic,
    create_s2_synthetic,
)


def test_builder_produces_valid_zip() -> None:
    """Builder produces a valid ZIP archive containing note.note and media."""
    builder = SdocxBuilder(
        title="Test Title",
        body="Paragraph 1\n\n\ufffc\n\nParagraph 2",
        objects=[ObjectDescriptor.image(media_index=0)],
        media_files={"0@photo.jpg": b"\xff\xd8\xff\xe0"},
    )
    raw_zip = builder.build_bytes()
    with zipfile.ZipFile(io.BytesIO(raw_zip)) as zf:
        namelist = zf.namelist()
        assert "note.note" in namelist
        assert "media/0@photo.jpg" in namelist
        assert "media/mediaInfo.dat" in namelist
        assert "end_tag.bin" in namelist
        assert "pageIdInfo.dat" in namelist


def test_builder_guid_markers_and_signatures() -> None:
    """Builder creates valid GUID markers, text records, and object signatures."""
    builder = SdocxBuilder(
        title="Hello",
        body="Text \ufffc audio \ufffc end",
        objects=[
            ObjectDescriptor.image(media_index=0),
            ObjectDescriptor.audio(
                media_index=1,
                title="Song",
                duration="01:23",
                text_offset=13,
            ),
        ],
        media_files={"0@img.png": b"img", "1@audio.m4a": b"audio"},
    )
    raw_zip = builder.build_bytes()
    with zipfile.ZipFile(io.BytesIO(raw_zip)) as zf:
        note_bytes = zf.read("note.note")

    # Image signature
    assert bytes([0x06, 0x00, 0x3E, 0x00, 0x00, 0x00, 0x02, 0x00]) in note_bytes
    # Audio signature
    assert bytes([0x1F, 0x03]) in note_bytes
    # "Song" in UTF-16LE
    assert "Song".encode("utf-16le") in note_bytes
    # "01:23" in UTF-16LE
    assert "01:23".encode("utf-16le") in note_bytes


def test_builder_deterministic_output() -> None:
    """Same builder configuration produces byte-for-byte identical archives."""
    builder = SdocxBuilder(
        title="Consistent",
        body="Deterministic body text \ufffc",
        objects=[ObjectDescriptor.image(media_index=0)],
        media_files={"0@test.png": b"deterministic_bytes"},
    )
    assert builder.build_bytes() == builder.build_bytes()


def test_builder_corruption_modes() -> None:
    """Corruption modes produce intended defects."""
    base = SdocxBuilder(title="Note", body="Text")

    # Missing note
    missing_bytes = base.build_bytes(corruption=CorruptionMode.MISSING_NOTE)
    with zipfile.ZipFile(io.BytesIO(missing_bytes)) as zf:
        assert "note.note" not in zf.namelist()

    # Wrong note bytes
    wrong_bytes = base.build_bytes(corruption=CorruptionMode.WRONG_NOTE_BYTES)
    with zipfile.ZipFile(io.BytesIO(wrong_bytes)) as zf:
        assert zf.read("note.note") == b"NOT_A_VALID_NOTE_NOTE_PAYLOAD"

    # Truncated zip
    truncated = base.build_bytes(corruption=CorruptionMode.TRUNCATED_ZIP)
    assert len(truncated) < 100

    # Unsafe entry names
    unsafe = base.build_bytes(corruption=CorruptionMode.UNSAFE_ENTRY_NAMES)
    with zipfile.ZipFile(io.BytesIO(unsafe)) as zf:
        assert any(".." in name for name in zf.namelist())


def test_builder_s1_and_s2_synthetic() -> None:
    """S1 and S2 synthetic factories produce well-formed notes matching samples."""
    s1_zip = create_s1_synthetic()
    with zipfile.ZipFile(io.BytesIO(s1_zip)) as zf:
        assert "note.note" in zf.namelist()
        assert "media/0@files_261028_230722_161.jpg" in zf.namelist()
        assert "media/1@_261028_230754_224.m4a" in zf.namelist()
        assert "media/2@6ae232fb_b55e6.m4a" in zf.namelist()

    s2_zip = create_s2_synthetic()
    with zipfile.ZipFile(io.BytesIO(s2_zip)) as zf:
        assert "note.note" in zf.namelist()
        assert "media/0@files_261029_130656_907.jpg" in zf.namelist()
        assert "media/1@files_261029_130656_922.jpg" in zf.namelist()
        assert "media/2@_261029_130708_202.m4a" in zf.namelist()
