"""Safe binary cursor over bytes with bounds checking and little-endian decoding."""
from __future__ import annotations

import struct

from sdocx2obsidian.domain.exceptions import MalformedNoteError


class BinaryReader:
    """Safe cursor for reading binary note structures."""

    def __init__(self, data: bytes) -> None:
        self._data = data
        self._pos = 0

    @property
    def position(self) -> int:
        """Current byte offset in the buffer."""
        return self._pos

    @property
    def remaining(self) -> int:
        """Number of unread bytes remaining."""
        return max(0, len(self._data) - self._pos)

    def seek(self, offset: int) -> None:
        """Seek cursor to specified byte offset."""
        if offset < 0 or offset > len(self._data):
            raise MalformedNoteError(
                f"Seek offset {offset} out of bounds (length {len(self._data)})",
            )
        self._pos = offset

    def peek(self, count: int) -> bytes:
        """Look ahead count bytes without advancing position."""
        if count < 0 or self._pos + count > len(self._data):
            raise MalformedNoteError(
                f"Cannot peek {count} bytes at offset {self._pos} (length {len(self._data)})",
            )
        return self._data[self._pos : self._pos + count]

    def read_raw(self, count: int) -> bytes:
        """Read count bytes and advance position."""
        if count < 0 or self._pos + count > len(self._data):
            raise MalformedNoteError(
                f"Cannot read {count} bytes at offset {self._pos} (length {len(self._data)})",
            )
        result = self._data[self._pos : self._pos + count]
        self._pos += count
        return result

    def read_u16(self) -> int:
        """Read unsigned 16-bit little-endian integer."""
        raw = self.read_raw(2)
        return int(struct.unpack("<H", raw)[0])

    def read_u32(self) -> int:
        """Read unsigned 32-bit little-endian integer."""
        raw = self.read_raw(4)
        return int(struct.unpack("<I", raw)[0])

    def read_utf16_string(self, unit_count: int) -> str:
        """Read UTF-16LE string of given code unit count, replacing invalid units."""
        if unit_count == 0:
            return ""
        byte_len = unit_count * 2
        raw = self.read_raw(byte_len)
        return raw.decode("utf-16le", errors="replace")
