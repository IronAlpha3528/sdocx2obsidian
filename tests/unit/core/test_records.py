"""Unit tests for record extraction in core/records.py."""
from __future__ import annotations

import struct

import pytest
from tests.helpers.builder import ObjectDescriptor, SdocxBuilder

from sdocx2obsidian.core.records import (
    find_guid_markers,
    locate_text_record,
    read_records,
    scan_placeholders,
)
from sdocx2obsidian.domain.exceptions import MalformedNoteError


def test_records_find_guid_markers() -> None:
    """Finds valid GUID markers and rejects invalid lengths or shapes."""
    builder = SdocxBuilder(title="Note", body="Body")
    note_bytes = builder.build_note_bytes()
    markers = find_guid_markers(note_bytes)
    assert len(markers) >= 2
    for _offset, guid in markers:
        assert len(guid) == 36
        assert guid.count("-") == 4


def test_records_fewer_than_two_markers_raises() -> None:
    """Fewer than two GUID markers raises MalformedNoteError."""
    with pytest.raises(MalformedNoteError):
        read_records(b"too_short_or_no_markers")


def test_records_locate_text_record_valid_and_padding_only() -> None:
    """Valid text candidate is located; zero/padding-only region returns empty."""
    text = "Valid Title"
    utf16 = text.encode("utf-16le")
    payload = b"\x00" * 20 + struct.pack("<II", len(utf16) + 10, len(text)) + utf16 + b"\x00" * 20
    found_text, offset, length = locate_text_record(payload, 0, len(payload))
    assert found_text == text
    assert offset == 20
    assert length == len(utf16) + 10

    # Padding only (no candidate)
    empty_payload = b"\x00" * 50
    empty_text, e_offset, e_length = locate_text_record(empty_payload, 0, len(empty_payload))
    assert empty_text == ""
    assert e_offset == -1
    assert e_length == 0


def test_records_scan_placeholders() -> None:
    """Identifies indices of U+FFFC placeholders across text."""
    text = "\ufffcStart \ufffc\ufffc Middle \ufffc End\ufffc"
    indices = scan_placeholders(text)
    assert indices == (0, 7, 8, 17, 22)

    no_obj = "Plain text without placeholders"
    assert scan_placeholders(no_obj) == ()


def test_records_read_records_s1_and_s2_synthetic() -> None:
    """Synthetic S1 and S2 notes parse into expected record structures."""
    # S1
    s1_builder = SdocxBuilder(
        title="Hello world",
        body="Text \ufffc image \ufffc audio",
        objects=[
            ObjectDescriptor.image(media_index=0),
            ObjectDescriptor.audio(
                media_index=1,
                title="Over_the_Horizon",
                duration="00:03:18",
                text_offset=15,
            ),
        ],
    )
    s1_records = read_records(s1_builder.build_note_bytes())
    assert s1_records.title == "Hello world"
    assert len(s1_records.placeholder_offsets) == 2
    assert len(s1_records.objects) == 2
    assert s1_records.objects[0].kind == "image"
    assert s1_records.objects[0].media_index == 0
    assert s1_records.objects[1].kind == "audio"
    assert s1_records.objects[1].media_index == 1
    assert s1_records.objects[1].audio_title == "Over_the_Horizon"

    # S2
    s2_builder = SdocxBuilder(
        title="Yolo",
        body="Short \ufffc\ufffc\ufffc end",
        objects=[
            ObjectDescriptor.image(media_index=0),
            ObjectDescriptor.image(media_index=1),
            ObjectDescriptor.audio(media_index=2, title="Song", duration="01:00", text_offset=8),
        ],
    )
    s2_records = read_records(s2_builder.build_note_bytes())
    assert s2_records.title == "Yolo"
    assert len(s2_records.placeholder_offsets) == 3
    assert len(s2_records.objects) == 3
    assert s2_records.objects[0].media_index == 0
    assert s2_records.objects[1].media_index == 1
    assert s2_records.objects[2].media_index == 2


def test_records_unsupported_object() -> None:
    """Object records with unknown signatures are marked unsupported."""
    builder = SdocxBuilder(
        title="Note",
        body="Body \ufffc",
        objects=[ObjectDescriptor.unsupported()],
    )
    records = read_records(builder.build_note_bytes())
    assert len(records.objects) == 1
    assert records.objects[0].kind == "unsupported"
    assert records.objects[0].media_index is None
