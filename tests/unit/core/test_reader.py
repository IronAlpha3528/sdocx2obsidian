"""Unit tests for BinaryReader in core/reader.py."""
from __future__ import annotations

import pytest

from sdocx2obsidian.core.reader import BinaryReader
from sdocx2obsidian.domain.exceptions import MalformedNoteError


def test_reader_u16_and_u32_reads() -> None:
    """Reader correctly decodes little-endian u16 and u32 values."""
    data = b"\x01\x02\x03\x04\x05\x06"
    reader = BinaryReader(data)
    assert reader.read_u16() == 0x0201
    assert reader.position == 2
    assert reader.remaining == 4
    assert reader.read_u32() == 0x06050403
    assert reader.position == 6
    assert reader.remaining == 0


def test_reader_seek_and_peek() -> None:
    """Seek changes position and peek looks ahead without advancing."""
    data = b"\xaa\xbb\xcc\xdd"
    reader = BinaryReader(data)
    reader.seek(2)
    assert reader.position == 2
    assert reader.peek(2) == b"\xcc\xdd"
    assert reader.position == 2
    assert reader.read_raw(2) == b"\xcc\xdd"
    assert reader.position == 4


def test_reader_utf16_string_by_unit_count() -> None:
    """Reader decodes UTF-16LE string given character unit count."""
    text = "Hello \u2764"
    raw = text.encode("utf-16le")
    reader = BinaryReader(raw)
    assert reader.read_utf16_string(len(text)) == text
    assert reader.remaining == 0


def test_reader_out_of_range_raises_malformed_note_error() -> None:
    """Out-of-range reads raise MalformedNoteError containing offset."""
    reader = BinaryReader(b"\x01\x02")
    with pytest.raises(MalformedNoteError) as exc_info:
        reader.read_u32()
    assert "offset" in str(exc_info.value).lower()

    with pytest.raises(MalformedNoteError):
        reader.seek(10)

    with pytest.raises(MalformedNoteError):
        reader.peek(10)


def test_reader_odd_length_utf16_raises() -> None:
    """Odd byte length for UTF-16 string raises MalformedNoteError."""
    reader = BinaryReader(b"\x41")
    with pytest.raises(MalformedNoteError):
        reader.read_utf16_string(1)


def test_reader_zero_length_and_lone_surrogates() -> None:
    """Zero-length string returns empty string; lone surrogates are replaced."""
    reader = BinaryReader(b"\x00\xd8\x00\x00")  # lone high surrogate U+D800
    assert reader.read_utf16_string(0) == ""
    assert reader.position == 0
    decoded = reader.read_utf16_string(1)
    assert decoded == "\ufffd"
