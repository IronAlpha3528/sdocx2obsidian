"""Unit tests for NoteParser in core/parser.py."""
from __future__ import annotations

import pytest
from tests.helpers.builder import (
    ObjectDescriptor,
    SdocxBuilder,
)

from sdocx2obsidian.core.parser import NoteParser
from sdocx2obsidian.domain.exceptions import MalformedNoteError
from sdocx2obsidian.domain.models import MediaBlock, SdocxArchive, TextBlock


def test_parser_t01_interleaving_text_and_media() -> None:
    """T-01: Interleaves text and media in order; assets match media blocks."""
    builder = SdocxBuilder(
        title="Note",
        body="Text 1\n\n\ufffc\n\nText 2\n\n\ufffc\n\nText 3",
        objects=[
            ObjectDescriptor.image(media_index=0),
            ObjectDescriptor.audio(media_index=1, title="Audio1", duration="01:00", text_offset=18),
        ],
        media_files={"0@img.png": b"img", "1@voice.m4a": b"m4a"},
    )
    archive = SdocxArchive("note", builder.build_note_bytes(), builder.media_files)
    parser = NoteParser()
    note = parser.parse(archive)

    assert len(note.blocks) == 5
    assert isinstance(note.blocks[0], TextBlock) and note.blocks[0].text == "Text 1"
    assert isinstance(note.blocks[1], MediaBlock) and note.blocks[1].filename == "img.png"
    assert isinstance(note.blocks[2], TextBlock) and note.blocks[2].text == "Text 2"
    assert isinstance(note.blocks[3], MediaBlock) and note.blocks[3].filename == "voice.m4a"
    assert isinstance(note.blocks[4], TextBlock) and note.blocks[4].text == "Text 3"
    assert set(note.assets.keys()) == {"img.png", "voice.m4a"}


def test_parser_t05_voice_recordings_placed_first() -> None:
    """T-05: Unreferenced audio files are voice recordings and placed at start."""
    builder = SdocxBuilder(
        title="Note",
        body="Body text\n\n\ufffc",
        objects=[ObjectDescriptor.image(media_index=0)],
        media_files={
            "0@img.png": b"img",
            "1@rec2.m4a": b"rec2",
            "2@rec1.m4a": b"rec1",
        },
    )
    archive = SdocxArchive("note", builder.build_note_bytes(), builder.media_files)
    note = NoteParser().parse(archive)

    # Voice recordings (indices 1 and 2) must precede body text and image
    assert isinstance(note.blocks[0], MediaBlock) and note.blocks[0].filename == "rec2.m4a"
    assert isinstance(note.blocks[1], MediaBlock) and note.blocks[1].filename == "rec1.m4a"
    assert isinstance(note.blocks[2], TextBlock)
    assert isinstance(note.blocks[3], MediaBlock) and note.blocks[3].filename == "img.png"


def test_parser_t06_adjacent_placeholders() -> None:
    """T-06: Consecutive placeholders yield adjacent media blocks."""
    builder = SdocxBuilder(
        title="Note",
        body="Text\n\ufffc\ufffc\nEnd",
        objects=[
            ObjectDescriptor.image(media_index=0),
            ObjectDescriptor.image(media_index=1),
        ],
        media_files={"0@a.jpg": b"a", "1@b.jpg": b"b"},
    )
    archive = SdocxArchive("note", builder.build_note_bytes(), builder.media_files)
    note = NoteParser().parse(archive)
    assert len(note.blocks) == 4
    assert isinstance(note.blocks[1], MediaBlock)
    assert isinstance(note.blocks[2], MediaBlock)


def test_parser_t07_more_placeholders_than_objects() -> None:
    """T-07: Placeholders without objects are dropped with warning."""
    builder = SdocxBuilder(
        title="Note",
        body="Text 1\n\ufffc\nText 2\n\ufffc\nText 3",
        objects=[ObjectDescriptor.image(media_index=0)],
        media_files={"0@a.jpg": b"a"},
    )
    archive = SdocxArchive("note", builder.build_note_bytes(), builder.media_files)
    note = NoteParser().parse(archive)
    assert len(note.blocks) == 3  # Text 1, MediaBlock, Text 2\nText 3
    assert any("placeholder" in w.lower() for w in note.warnings)


def test_parser_t08_more_objects_than_placeholders() -> None:
    """T-08: Objects without placeholders are appended at end with warning."""
    builder = SdocxBuilder(
        title="Note",
        body="Text only",
        objects=[ObjectDescriptor.image(media_index=0)],
        media_files={"0@orphan.jpg": b"data"},
    )
    archive = SdocxArchive("note", builder.build_note_bytes(), builder.media_files)
    note = NoteParser().parse(archive)
    assert len(note.blocks) == 2
    assert isinstance(note.blocks[0], TextBlock)
    assert isinstance(note.blocks[1], MediaBlock) and note.blocks[1].filename == "orphan.jpg"
    assert any("appended" in w.lower() for w in note.warnings)


def test_parser_t09_unsupported_object_consumes_slot() -> None:
    """T-09: Unsupported objects consume their placeholder slot and are dropped with warning."""
    builder = SdocxBuilder(
        title="Note",
        body="Text 1\n\ufffc\nText 2\n\ufffc\nText 3",
        objects=[
            ObjectDescriptor.unsupported(),
            ObjectDescriptor.image(media_index=0),
        ],
        media_files={"0@valid.png": b"valid"},
    )
    archive = SdocxArchive("note", builder.build_note_bytes(), builder.media_files)
    note = NoteParser().parse(archive)
    # The first placeholder had unsupported object; second had image
    media_blocks = [b for b in note.blocks if isinstance(b, MediaBlock)]
    assert len(media_blocks) == 1
    assert media_blocks[0].filename == "valid.png"
    assert any("unsupported" in w.lower() for w in note.warnings)


def test_parser_t15_empty_body_and_no_media() -> None:
    """T-15: Empty body and no media yields 0 blocks."""
    builder = SdocxBuilder(title="Empty Note", body="")
    archive = SdocxArchive("note", builder.build_note_bytes(), {})
    note = NoteParser().parse(archive)
    assert len(note.blocks) == 0


def test_parser_empty_or_short_note_bytes_raises_malformed_note_error() -> None:
    """Empty or too short note bytes raise MalformedNoteError."""
    archive = SdocxArchive("note", b"short", {})
    with pytest.raises(MalformedNoteError):
        NoteParser().parse(archive)


def test_parser_duplicate_media_ref_and_unreferenced_image() -> None:
    """Duplicate media references drop with warning; unreferenced images warn and omit."""
    builder = SdocxBuilder(
        title="Note",
        body="First \ufffc Second \ufffc End",
        objects=[
            ObjectDescriptor.image(media_index=0),
            ObjectDescriptor.image(media_index=0),
        ],
        media_files={
            "0@used.png": b"used",
            "1@unused.jpg": b"unused",
        },
    )
    archive = SdocxArchive("note", builder.build_note_bytes(), builder.media_files)
    note = NoteParser().parse(archive)

    assert list(note.assets.keys()) == ["used.png"]
    assert any("Duplicate reference" in w for w in note.warnings)
    assert any("Unreferenced image 'unused.jpg'" in w for w in note.warnings)
