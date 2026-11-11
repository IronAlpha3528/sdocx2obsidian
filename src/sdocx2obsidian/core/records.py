"""Record parsing and structural extraction from binary note data."""
from __future__ import annotations

import re
import struct
from dataclasses import dataclass

from sdocx2obsidian.domain.exceptions import MalformedNoteError

GUID_PATTERN = re.compile(
    rb"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)
IMAGE_SIG = bytes([0x06, 0x00, 0x3E, 0x00, 0x00, 0x00, 0x02, 0x00])
AUDIO_SIG = bytes([0x1F, 0x03])


@dataclass(frozen=True, slots=True)
class RawObjectRecord:
    """Descriptor of an inline object extracted from object records."""

    kind: str
    media_index: int | None = None
    audio_title: str | None = None
    audio_duration: str | None = None
    text_offset: int | None = None


@dataclass(frozen=True, slots=True)
class RawRecordSet:
    """Structured extraction of raw note content before block assembly."""

    title: str
    body: str
    placeholder_offsets: tuple[int, ...]
    objects: tuple[RawObjectRecord, ...]
    warnings: tuple[str, ...] = ()


def find_guid_markers(data: bytes) -> list[tuple[int, str]]:
    """Locate all 36-byte GUID markers in the binary note."""
    markers: list[tuple[int, str]] = []
    limit = len(data) - 38
    for i in range(limit + 1):
        length = struct.unpack_from("<H", data, i)[0]
        if length == 36:
            candidate = data[i + 2 : i + 38]
            if GUID_PATTERN.match(candidate):
                markers.append((i, candidate.decode("ascii")))
    return markers


def _is_valid_utf16_record(raw: bytes) -> bool:
    try:
        text = raw.decode("utf-16le")
    except UnicodeDecodeError:
        return False
    for ch in text:
        if ch == "\0":
            return False
        if ch in ("\n", "\r", "\t", "\ufffc") or ch.isprintable():
            continue
        return False
    return True


def locate_text_record(data: bytes, start: int, end: int) -> tuple[str, int, int]:
    """Scan region for first valid length-prefixed UTF-16 text record candidate."""
    search_end = min(end, len(data)) - 8
    for off in range(start, search_end + 1):
        rec_len, char_count = struct.unpack_from("<II", data, off)
        if char_count < 1 or rec_len < 4 + 2 * char_count:
            continue
        byte_len = char_count * 2
        if off + 8 + byte_len > len(data):
            continue
        raw_text = data[off + 8 : off + 8 + byte_len]
        if _is_valid_utf16_record(raw_text):
            return raw_text.decode("utf-16le", errors="replace"), off, rec_len
    return "", -1, 0


def scan_placeholders(body: str) -> tuple[int, ...]:
    """Scan body text for indices of U+FFFC placeholder characters."""
    return tuple(i for i, ch in enumerate(body) if ch == "\ufffc")


def _classify_object(region: bytes) -> RawObjectRecord:
    has_img = region.find(IMAGE_SIG) != -1
    has_audio = region.find(AUDIO_SIG) != -1
    if has_img and has_audio:
        raise MalformedNoteError("Multiple object signatures found in one region")
    if has_img:
        pos = region.find(IMAGE_SIG)
        idx = struct.unpack_from("<H", region, pos + len(IMAGE_SIG))[0]
        return RawObjectRecord(kind="image", media_index=idx)
    if has_audio:
        return _decode_audio_object(region)
    return RawObjectRecord(kind="unsupported")


def _decode_audio_object(region: bytes) -> RawObjectRecord:
    pos = region.find(AUDIO_SIG) + len(AUDIO_SIG)
    idx = struct.unpack_from("<I", region, pos)[0]
    pos += 4
    t_len = struct.unpack_from("<H", region, pos)[0]
    pos += 2
    title = region[pos : pos + t_len * 2].decode("utf-16le", errors="replace")
    pos += t_len * 2
    d_len = struct.unpack_from("<H", region, pos)[0]
    pos += 2
    dur = region[pos : pos + d_len * 2].decode("utf-16le", errors="replace")
    pos += d_len * 2
    tail = struct.unpack_from("<I", region, pos)[0] if len(region) >= pos + 4 else None
    return RawObjectRecord(
        kind="audio",
        media_index=idx,
        audio_title=title,
        audio_duration=dur,
        text_offset=tail,
    )


def read_records(data: bytes) -> RawRecordSet:
    """Extract title, body, placeholders, and object records from binary note data."""
    markers = find_guid_markers(data)
    if len(markers) < 2:
        raise MalformedNoteError(f"Found {len(markers)} GUID marker(s); at least 2 required")

    t_reg_start = markers[0][0] + 38
    t_reg_end = markers[1][0]
    title, _, _ = locate_text_record(data, t_reg_start, t_reg_end)

    b_reg_start = markers[1][0] + 38
    b_reg_end = markers[2][0] if len(markers) > 2 else len(data)
    body, _, _ = locate_text_record(data, b_reg_start, b_reg_end)
    placeholders = scan_placeholders(body)

    warnings: list[str] = []
    objects: list[RawObjectRecord] = []
    for idx in range(2, len(markers)):
        m_start = markers[idx][0]
        m_end = markers[idx + 1][0] if idx + 1 < len(markers) else len(data)
        region = data[m_start:m_end]
        objects.append(_classify_object(region))

    return RawRecordSet(
        title=title,
        body=body,
        placeholder_offsets=placeholders,
        objects=tuple(objects),
        warnings=tuple(warnings),
    )
