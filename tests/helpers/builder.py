"""Synthetic .sdocx archive builder for testing."""
from __future__ import annotations

import hashlib
import io
import struct
import zipfile
from dataclasses import dataclass, field
from enum import Enum

IMAGE_SIG = bytes([0x06, 0x00, 0x3E, 0x00, 0x00, 0x00, 0x02, 0x00])
AUDIO_SIG = bytes([0x01, 0x00, 0x02, 0x1F, 0x03])
AUDIO_RECORDED_SIG = bytes([0x01, 0x00, 0x02, 0x17, 0x00])
DEFAULT_GUID_PREFIX = "00000000-0000-0000-0000-"


class CorruptionMode(Enum):
    """Corruption mode to inject into synthetic archive."""

    NONE = "none"
    TRUNCATED_ZIP = "truncated_zip"
    WRONG_NOTE_BYTES = "wrong_note_bytes"
    MISSING_NOTE = "missing_note"
    UNSAFE_ENTRY_NAMES = "unsafe_entry_names"
    DUPLICATE_NAMES = "duplicate_names"
    OVERSIZE_ENTRY = "oversize_entry"


@dataclass(frozen=True, slots=True)
class ObjectDescriptor:
    """Descriptor for an inline object placed in note.note."""

    kind: str
    media_index: int = 0
    title: str = ""
    duration: str = ""
    text_offset: int = 0
    sig: bytes = AUDIO_SIG

    @classmethod
    def image(cls, media_index: int) -> ObjectDescriptor:
        """Create an image object descriptor."""
        return cls(kind="image", media_index=media_index)

    @classmethod
    def audio(
        cls,
        media_index: int,
        title: str = "Audio",
        duration: str = "00:01:00",
        text_offset: int = 0,
        sig: bytes = AUDIO_SIG,
    ) -> ObjectDescriptor:
        """Create an audio object descriptor."""
        return cls(
            kind="audio",
            media_index=media_index,
            title=title,
            duration=duration,
            text_offset=text_offset,
            sig=sig,
        )

    @classmethod
    def unsupported(cls) -> ObjectDescriptor:
        """Create an unsupported object descriptor."""
        return cls(kind="unsupported")


@dataclass
class SdocxBuilder:
    """Configurable synthetic .sdocx builder."""

    title: str = "Note Title"
    body: str = "Body text"
    objects: list[ObjectDescriptor] = field(default_factory=list)
    media_files: dict[str, bytes] = field(default_factory=dict)
    include_media_info: bool = True
    include_filler: bool = True

    def build_note_bytes(self) -> bytes:
        """Build binary note.note content according to DDS Section 6."""
        parts: list[bytes] = [b"\x00" * 86]
        parts.append(self._make_guid_marker(0))
        parts.append(b"\x00" * 173)

        title_utf16 = self.title.encode("utf-16le")
        title_len = len(title_utf16) + 60
        parts.append(struct.pack("<II", title_len, len(self.title)))
        parts.append(title_utf16)
        parts.append(b"\x00" * 80)

        parts.append(self._make_guid_marker(1))
        parts.append(b"\x00" * 150)

        body_utf16 = self.body.encode("utf-16le")
        obj_payloads = [self._build_object_record(i, obj) for i, obj in enumerate(self.objects)]
        total_obj_bytes = sum(len(p) for p in obj_payloads)
        body_rec_len = len(body_utf16) + total_obj_bytes + 200

        parts.append(struct.pack("<II", body_rec_len, len(self.body)))
        parts.append(body_utf16)
        parts.extend(obj_payloads)
        parts.append(b"\x00" * 100)
        return b"".join(parts)

    def _make_guid_marker(self, index: int) -> bytes:
        guid_str = f"{DEFAULT_GUID_PREFIX}{index:012x}"
        return struct.pack("<H", 36) + guid_str.encode("ascii")

    def _build_object_record(self, idx: int, obj: ObjectDescriptor) -> bytes:
        header = struct.pack("<I", 4000) + self._make_guid_marker(idx + 2)
        if obj.kind == "image":
            img_head = b"\x00" * 367 + IMAGE_SIG
            return header + img_head + struct.pack("<H", obj.media_index) + b"\x00" * 50
        if obj.kind == "audio":
            t_bytes = obj.title.encode("utf-16le")
            d_bytes = obj.duration.encode("utf-16le")
            sig_part = (
                obj.sig
                + struct.pack("<I", obj.media_index)
                + struct.pack("<H", len(obj.title))
                + t_bytes
                + struct.pack("<H", len(obj.duration))
                + d_bytes
                + struct.pack("<I", obj.text_offset)
            )
            return header + b"\x00" * 10 + sig_part + b"\x00" * 50
        return header + b"\x00" * 200

    def build_bytes(self, corruption: CorruptionMode = CorruptionMode.NONE) -> bytes:
        """Package note.note and media into a ZIP archive with optional corruption."""
        if corruption == CorruptionMode.TRUNCATED_ZIP:
            return b"PK\x03\x04truncated_zip_data"

        bio = io.BytesIO()
        with zipfile.ZipFile(bio, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            self._write_zip_entries(zf, corruption)

        return bio.getvalue()

    def _write_zip_entries(self, zf: zipfile.ZipFile, corruption: CorruptionMode) -> None:
        if corruption != CorruptionMode.MISSING_NOTE:
            note_content = (
                b"NOT_A_VALID_NOTE_NOTE_PAYLOAD"
                if corruption == CorruptionMode.WRONG_NOTE_BYTES
                else self.build_note_bytes()
            )
            zf.writestr("note.note", note_content)

        if self.include_filler:
            zf.writestr("pageIdInfo.dat", b"PAGE_ID_INFO")
            zf.writestr("end_tag.bin", b"Document for S-Pen SDK")

        if corruption == CorruptionMode.UNSAFE_ENTRY_NAMES:
            zf.writestr("../unsafe_escape.txt", b"malicious content")

        if corruption == CorruptionMode.DUPLICATE_NAMES:
            zf.writestr("media/duplicate.png", b"1")
            zf.writestr("media/duplicate.png", b"2")

        for name, data in self.media_files.items():
            entry_name = f"media/{name}"
            zf.writestr(entry_name, data)

        if self.include_media_info:
            zf.writestr("media/mediaInfo.dat", self._build_media_info())

    def _build_media_info(self) -> bytes:
        records: list[bytes] = [struct.pack("<IH", 1, len(self.media_files))]
        for name, data in self.media_files.items():
            sha = hashlib.sha256(data).hexdigest()
            records.append(f"{name}:{sha}\n".encode())
        records.append(b"EOFX")
        return b"".join(records)


def create_s1_synthetic() -> bytes:
    """Create synthetic archive matching sample S1 structures."""
    return SdocxBuilder(
        title="Hello world",
        body=(
            "This would be normal text inthe notes with images between them\n\n\ufffc\n"
            "The above is a random image, and this is a test note\n\n\ufffc\n"
            "This is a test audio file.\n\nHello \nHi Ola \n\n"
            "This is sample text in a sample note\n\nHsiw hwid\n\nHusis s\n"
            "Ysudisv\nOdyssey\nUsidbsiiss\nSister\nIsus9\nUsing\n20th October 2026:"
        ),
        objects=[
            ObjectDescriptor.image(media_index=0),
            ObjectDescriptor.audio(
                media_index=1,
                title="Over_the_Horizon",
                duration="00:03:18",
                text_offset=119,
            ),
        ],
        media_files={
            "0@files_261028_230722_161.jpg": b"\xff\xd8\xff\xe0" + b"\x00" * 100,
            "1@_261028_230754_224.m4a": b"ftypM4A " + b"\x00" * 200,
            "2@6ae232fb_b55e6.m4a": b"ftypM4A " + b"\x00" * 150,
        },
    ).build_bytes()


def create_s2_synthetic() -> bytes:
    """Create synthetic archive matching sample S2 structures."""
    return SdocxBuilder(
        title="Yolo",
        body="Hdidjsbo\nIsisbsuow\n\ufffc\ufffc\ufffc\n",
        objects=[
            ObjectDescriptor.image(media_index=0),
            ObjectDescriptor.image(media_index=1),
            ObjectDescriptor.audio(
                media_index=2,
                title="Over_the_Horizon",
                duration="00:03:18",
                text_offset=21,
            ),
        ],
        media_files={
            "0@files_261029_130656_907.jpg": b"\xff\xd8\xff\xe0" + b"\x00" * 100,
            "1@files_261029_130656_922.jpg": b"\xff\xd8\xff\xe0" + b"\x00" * 100,
            "2@_261029_130708_202.m4a": b"ftypM4A " + b"\x00" * 200,
        },
    ).build_bytes()
