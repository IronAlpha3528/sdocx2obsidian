"""Unit tests for pure naming policies in domain/naming.py."""
from __future__ import annotations

import pytest

from sdocx2obsidian.domain.models import MediaKind
from sdocx2obsidian.domain.naming import (
    ASSET_DIR_SUFFIX,
    MAX_MEDIA_STEM_LEN,
    MAX_NOTE_STEM_LEN,
    UNRECOGNIZED_EMOJI_CHAR,
    build_asset_dir_name,
    build_versioned_stem,
    classify_extension,
    sanitize_media_filename,
    sanitize_note_stem,
    strip_media_prefix,
)


def test_naming_constants() -> None:
    """Naming constants match the DDS specifications."""
    assert ASSET_DIR_SUFFIX == "_Assets"
    assert MAX_NOTE_STEM_LEN == 120
    assert MAX_MEDIA_STEM_LEN == 100
    assert UNRECOGNIZED_EMOJI_CHAR == "\ufffd"


@pytest.mark.parametrize(
    ("input_stem", "expected"),
    [
        ("Simple Note", "Simple Note"),
        ("Note: with? illegal* chars|", "Note_ with_ illegal_ chars_"),
        ("Note/with\\slashes", "Note_with_slashes"),
        ("  leading and trailing spaces  ", "leading and trailing spaces"),
        ("trailing dots...", "trailing dots"),
        ("CON", "CON_"),
        ("aux", "aux_"),
        ("com1", "com1_"),
        ("lpt9", "lpt9_"),
        ("", "Untitled"),
        ("   ", "Untitled"),
        ("...", "Untitled"),
        ("A" * 150, "A" * 120),
    ],
)
def test_naming_sanitize_note_stem(input_stem: str, expected: str) -> None:
    """Note stem is sanitized for filesystem and links with length limit and reserved words."""
    assert sanitize_note_stem(input_stem, fallback="Untitled") == expected


def test_naming_sanitize_note_stem_link_chars() -> None:
    """Link-breaking characters (#, ^, [, ]) are replaced with underscores."""
    assert sanitize_note_stem("Tag #1 ^block [test]") == "Tag _1 _block _test_"


@pytest.mark.parametrize(
    ("raw_entry", "expected"),
    [
        ("0@files_261028_230722_161.jpg", "files_261028_230722_161.jpg"),
        ("12@_261028_230754_224.m4a", "_261028_230754_224.m4a"),
        ("no_prefix.png", "no_prefix.png"),
        ("0@", ""),
        ("@photo.jpg", "@photo.jpg"),
        ("abc@photo.jpg", "abc@photo.jpg"),
    ],
)
def test_naming_strip_media_prefix(raw_entry: str, expected: str) -> None:
    """Removes a leading run of decimal digits followed by @."""
    assert strip_media_prefix(raw_entry) == expected


@pytest.mark.parametrize(
    ("filename", "expected"),
    [
        ("photo.jpg", "photo.jpg"),
        ("0@photo.PNG", "photo.PNG"),
        ("image:with*illegal.jpeg", "image_with_illegal.jpeg"),
        ("media#1^[link].png", "media_1__link_.png"),
        ("  spaced  .gif", "spaced.gif"),
        (".jpg", "media.jpg"),
        ("", "media"),
        ("A" * 150 + ".png", "A" * 100 + ".png"),
        ("NUL.png", "NUL_.png"),
    ],
)
def test_naming_sanitize_media_filename(filename: str, expected: str) -> None:
    """Media filename strips prefix, sanitizes stem, preserves extension, enforces length."""
    assert sanitize_media_filename(filename, fallback="media") == expected


@pytest.mark.parametrize(
    ("ext", "expected_kind"),
    [
        ("png", MediaKind.IMAGE),
        (".PNG", MediaKind.IMAGE),
        ("jpg", MediaKind.IMAGE),
        ("JPEG", MediaKind.IMAGE),
        (".gif", MediaKind.IMAGE),
        ("webp", MediaKind.IMAGE),
        ("m4a", MediaKind.AUDIO),
        (".M4A", MediaKind.AUDIO),
        ("amr", MediaKind.AUDIO),
        ("mp3", MediaKind.AUDIO),
        (".wav", MediaKind.AUDIO),
        ("ogg", MediaKind.AUDIO),
        ("pdf", None),
        ("txt", None),
        ("", None),
    ],
)
def test_naming_classify_extension(ext: str, expected_kind: MediaKind | None) -> None:
    """Classifies extension case-insensitively into IMAGE, AUDIO, or None."""
    assert classify_extension(ext) == expected_kind


def test_naming_build_asset_dir_name() -> None:
    """Builds asset folder name by appending literal _Assets."""
    assert build_asset_dir_name("Meeting Notes") == "Meeting Notes_Assets"
    assert build_asset_dir_name("Note (1)") == "Note (1)_Assets"


def test_naming_build_versioned_stem() -> None:
    """Builds versioned stem with (n) suffix starting at 1."""
    assert build_versioned_stem("Note", 1) == "Note (1)"
    assert build_versioned_stem("Note", 2) == "Note (2)"


def test_naming_idempotence() -> None:
    """Sanitizing an already sanitized note stem produces identical output."""
    stem = "My_Clean_Note (1)"
    assert sanitize_note_stem(stem) == stem
    assert sanitize_note_stem(sanitize_note_stem(stem)) == stem


def test_naming_bidi_controls_stripped() -> None:
    """Direction-override and invisible Bidi controls are stripped."""
    # U+202E (RLO), U+202A (LRE), U+202C (PDF), U+200E (LRM), U+200F (RLM), U+2066-U+2069
    malicious = "Note\u202eexe.txt\u202c"
    sanitized = sanitize_note_stem(malicious)
    assert sanitized == "Noteexe.txt"
    assert "\u202e" not in sanitized
    assert "\u202c" not in sanitized

    # Media filename Bidi stripping
    media_raw = "0@audio\u200e_test\u2069.m4a"
    sanitized_media = sanitize_media_filename(media_raw)
    assert sanitized_media == "audio_test.m4a"


def test_naming_zwj_and_emoji_preserved() -> None:
    """Zero-width joiners, non-joiners, and variation selectors must NOT be stripped."""
    # Emoji with ZWJ: family emoji 👨‍👩‍👦 (\u200d)
    family_stem = "Family 👨\u200d👩\u200d👦 Note"
    sanitized = sanitize_note_stem(family_stem)
    assert "\u200d" in sanitized
    assert "👨\u200d👩\u200d👦" in sanitized

    # Variation selector: ❤️ (\u2764\ufe0f)
    heart_stem = "Heart \u2764\ufe0f"
    sanitized_heart = sanitize_note_stem(heart_stem)
    assert "\ufe0f" in sanitized_heart

    # ZWNJ: \u200c
    zwnj_stem = "Text\u200cPart"
    sanitized_zwnj = sanitize_note_stem(zwnj_stem)
    assert "\u200c" in sanitized_zwnj

