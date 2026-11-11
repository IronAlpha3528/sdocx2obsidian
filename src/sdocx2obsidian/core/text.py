"""Text normalization and cleanup for Samsung Notes text segments."""
from __future__ import annotations

import re


def _clean_char(ch: str) -> str:
    if ch in ("\n", "\t"):
        return ch
    code = ord(ch)
    if code < 32 or code == 127:
        return ""
    if 0xD800 <= code <= 0xDFFF:
        return "\ufffd"
    return ch


def normalize_text_segment(text: str) -> str | None:
    """Normalize raw note body text segment according to DDS 7.5."""
    if not text:
        return None

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = "".join(_clean_char(ch) for ch in normalized)

    lines = [line.rstrip(" \t") for line in cleaned.split("\n")]
    joined = "\n".join(lines)

    collapsed = re.sub(r"\n{3,}", "\n\n", joined)
    trimmed = collapsed.strip("\n")

    if not trimmed or not trimmed.strip():
        return None

    return trimmed
