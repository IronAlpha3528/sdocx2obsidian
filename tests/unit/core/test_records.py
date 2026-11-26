"""Unit tests for record extraction in core/records.py."""
from __future__ import annotations

import struct

import pytest
from tests.helpers.builder import AUDIO_RECORDED_SIG, ObjectDescriptor, SdocxBuilder

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


def test_records_audio_recorded_signature_17_00() -> None:
    """Audio objects using the 17 00 signature are decoded as audio objects."""
    builder = SdocxBuilder(
        title="Note with recorded audio",
        body="Here is recording: \ufffc",
        objects=[
            ObjectDescriptor.audio(
                media_index=5,
                title="Voice Memo",
                duration="00:02:15",
                text_offset=20,
                sig=AUDIO_RECORDED_SIG,
            ),
        ],
    )
    records = read_records(builder.build_note_bytes())
    assert len(records.objects) == 1
    assert records.objects[0].kind == "audio"
    assert records.objects[0].media_index == 5
    assert records.objects[0].audio_title == "Voice Memo"
    assert records.objects[0].audio_duration == "00:02:15"


def test_records_truncated_audio_object_returns_unsupported() -> None:
    """Truncated audio object safely yields unsupported kind instead of struct.error."""
    from sdocx2obsidian.core.records import _decode_audio_object

    # Truncated before index
    res1 = _decode_audio_object(b"\x01\x00\x02\x1f\x03\x00\x00", 0, 5)
    assert res1.kind == "unsupported"

    # Truncated in title
    short_title = b"\x01\x00\x02\x1f\x03" + struct.pack("<IH", 1, 100) + b"short"
    res2 = _decode_audio_object(short_title, 0, 5)
    assert res2.kind == "unsupported"

    # Truncated in duration
    t_bytes = "Title".encode("utf-16le")
    short_dur = (
        b"\x01\x00\x02\x1f\x03"
        + struct.pack("<IH", 1, len("Title"))
        + t_bytes
        + struct.pack("<H", 50)
        + b"dur"
    )
    res3 = _decode_audio_object(short_dur, 0, 5)
    assert res3.kind == "unsupported"


def test_records_image_with_embedded_small_integers_does_not_collide() -> None:
    """Small integers (23, 799) in image metadata do not cause signature collisions."""
    from tests.helpers.builder import IMAGE_SIG

    from sdocx2obsidian.core.records import _classify_object

    # Construct an image region that has raw \x17\x00 and \x1f\x03 scattered in padding
    region = (
        b"\x00" * 50
        + b"\x17\x00" * 5
        + b"\x00" * 50
        + b"\x1f\x03" * 5
        + b"\x00" * 50
        + IMAGE_SIG
        + struct.pack("<H", 3)
        + b"\x00" * 50
    )
    rec = _classify_object(region)
    assert rec.kind == "image"
    assert rec.media_index == 3


def test_records_malformed_and_truncated_object_edges() -> None:
    """Covers dual signatures, truncated image, non-GUID 36-byte candidate, and audio edges."""
    from tests.helpers.builder import IMAGE_SIG

    from sdocx2obsidian.core.records import _classify_object, _decode_audio_object

    # Length == 36 without valid GUID shape
    non_guid = b"\x24\x00" + b"Z" * 36
    assert find_guid_markers(non_guid) == []

    # Multiple object signatures in one region
    both_sigs = IMAGE_SIG + struct.pack("<H", 0) + AUDIO_RECORDED_SIG
    with pytest.raises(MalformedNoteError):
        _classify_object(both_sigs)

    # Truncated image signature (missing 2-byte media index)
    assert _classify_object(IMAGE_SIG + b"\x00").kind == "unsupported"

    # Audio truncated before title length and before duration length
    sig = AUDIO_RECORDED_SIG
    assert _decode_audio_object(sig + struct.pack("<I", 1), 0, len(sig)).kind == "unsupported"
    t_bytes = "Hi".encode("utf-16le")
    no_dur_len = sig + struct.pack("<IH", 1, 2) + t_bytes
    assert _decode_audio_object(no_dur_len, 0, len(sig)).kind == "unsupported"


