"""Pure naming policies, path sanitization, and extension classification."""
from __future__ import annotations

from sdocx2obsidian.domain.models import MediaKind

ASSET_DIR_SUFFIX = "_Assets"
MAX_NOTE_STEM_LEN = 120
MAX_MEDIA_STEM_LEN = 100
UNRECOGNIZED_EMOJI_CHAR = "\ufffd"

IMAGE_EXTENSIONS: frozenset[str] = frozenset({"png", "jpg", "jpeg", "gif", "webp"})
AUDIO_EXTENSIONS: frozenset[str] = frozenset({"m4a", "amr", "mp3", "wav", "ogg"})

WINDOWS_RESERVED_STEMS: frozenset[str] = frozenset(
    {
        "CON",
        "PRN",
        "AUX",
        "NUL",
        *(f"COM{i}" for i in range(1, 10)),
        *(f"LPT{i}" for i in range(1, 10)),
    }
)

BANNED_CHARS: frozenset[str] = frozenset('\\/:*?"<>|#^[]')

BIDI_CONTROLS: frozenset[str] = frozenset(
    {
        "\u200e",  # LRM
        "\u200f",  # RLM
        "\u061c",  # ALM
        "\u202a",  # LRE
        "\u202b",  # RLE
        "\u202c",  # PDF
        "\u202d",  # LRO
        "\u202e",  # RLO
        "\u2066",  # LRI
        "\u2067",  # RLI
        "\u2068",  # FSI
        "\u2069",  # PDI
    }
)


def strip_media_prefix(entry_name: str) -> str:
    """Remove a leading sequence of decimal digits followed by @."""
    at_index = entry_name.find("@")
    if at_index > 0 and entry_name[:at_index].isdigit():
        return entry_name[at_index + 1 :]
    return entry_name


def _sanitize_stem_chars(raw: str) -> str:
    cleaned: list[str] = []
    for ch in raw:
        if ch in BIDI_CONTROLS:
            continue
        if ch in BANNED_CHARS or ord(ch) < 32 or ord(ch) == 127:
            cleaned.append("_")
        else:
            cleaned.append(ch)
    return "".join(cleaned).strip().rstrip(".")


def _apply_reserved_and_length(name: str, max_len: int, fallback: str) -> str:
    result = name[:max_len].strip().rstrip(".")
    if not result:
        result = fallback
    if result.upper() in WINDOWS_RESERVED_STEMS:
        result = f"{result}_"
    return result


def sanitize_note_stem(raw: str, fallback: str = "Untitled") -> str:
    """Sanitize note stem for filesystem safety and link validity."""
    cleaned = _sanitize_stem_chars(raw)
    return _apply_reserved_and_length(cleaned, MAX_NOTE_STEM_LEN, fallback)


def sanitize_media_filename(raw_filename: str, fallback: str = "media") -> str:
    """Sanitize extracted media filename, preserving original extension."""
    stripped = strip_media_prefix(raw_filename)
    dot_idx = stripped.rfind(".")
    if dot_idx != -1:
        stem = stripped[:dot_idx]
        ext = stripped[dot_idx:]
    else:
        stem = stripped
        ext = ""

    cleaned_stem = _sanitize_stem_chars(stem)
    sanitized_stem = _apply_reserved_and_length(cleaned_stem, MAX_MEDIA_STEM_LEN, fallback)
    return f"{sanitized_stem}{ext}"


def classify_extension(ext: str) -> MediaKind | None:
    """Classify extension case-insensitively into IMAGE, AUDIO, or None."""
    norm = ext.lower().lstrip(".")
    if norm in IMAGE_EXTENSIONS:
        return MediaKind.IMAGE
    if norm in AUDIO_EXTENSIONS:
        return MediaKind.AUDIO
    return None


def build_asset_dir_name(note_stem: str) -> str:
    """Build the note-specific asset folder name."""
    return f"{note_stem}{ASSET_DIR_SUFFIX}"


def build_versioned_stem(base_stem: str, version: int) -> str:
    """Build collision-versioned note stem."""
    return f"{base_stem} ({version})"
