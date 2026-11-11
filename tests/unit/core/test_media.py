"""Unit tests for media catalog building and naming in core/media.py."""
from __future__ import annotations

from sdocx2obsidian.core.media import build_media_catalog
from sdocx2obsidian.domain.models import MediaKind


def test_media_index_parsed_and_catalog_keyed_by_index() -> None:
    """Valid entry names parse index and return catalog keyed by integer index."""
    raw_media = {
        "0@files_261028_230722_161.jpg": b"jpg_bytes",
        "1@_261028_230754_224.m4a": b"m4a_bytes",
        "2@6ae232fb_b55e6.m4a": b"voice_bytes",
    }
    catalog, warnings = build_media_catalog(raw_media)
    assert len(catalog) == 3
    assert warnings == ()
    assert 0 in catalog and catalog[0].output_name == "files_261028_230722_161.jpg"
    assert catalog[0].kind == MediaKind.IMAGE
    assert 1 in catalog and catalog[1].output_name == "_261028_230754_224.m4a"
    assert catalog[1].kind == MediaKind.AUDIO
    assert 2 in catalog and catalog[2].output_name == "6ae232fb_b55e6.m4a"


def test_media_missing_at_skipped_with_warning() -> None:
    """Media entry without decimal index and @ is skipped with warning."""
    raw_media = {"noprefix.jpg": b"data", "0@img.png": b"img"}
    catalog, warnings = build_media_catalog(raw_media)
    assert len(catalog) == 1
    assert 0 in catalog
    assert len(warnings) == 1
    assert "noprefix.jpg" in warnings[0]


def test_media_unsupported_extension_skipped_with_warning() -> None:
    """Media entry with non-image/non-audio extension is skipped with warning."""
    raw_media = {"0@document.pdf": b"pdf", "1@audio.m4a": b"audio"}
    catalog, warnings = build_media_catalog(raw_media)
    assert len(catalog) == 1
    assert 1 in catalog
    assert len(warnings) == 1
    assert "document.pdf" in warnings[0]


def test_media_uppercase_extension_accepted() -> None:
    """Uppercase extension is classified and preserves original case in output."""
    raw_media = {"0@photo.PNG": b"png_data"}
    catalog, warnings = build_media_catalog(raw_media)
    assert len(catalog) == 1
    assert catalog[0].output_name == "photo.PNG"
    assert catalog[0].kind == MediaKind.IMAGE


def test_media_duplicate_output_names_suffixed_deterministically() -> None:
    """Duplicate stripped names get _<index> suffix on subsequent items."""
    raw_media = {
        "0@photo.jpg": b"img0",
        "1@photo.jpg": b"img1",
        "2@photo.jpg": b"img2",
    }
    catalog, warnings = build_media_catalog(raw_media)
    assert len(catalog) == 3
    assert catalog[0].output_name == "photo.jpg"
    assert catalog[1].output_name == "photo_1.jpg"
    assert catalog[2].output_name == "photo_2.jpg"


def test_media_empty_stem_uses_fallback_with_index() -> None:
    """Media entry with empty stem uses fallback including index."""
    raw_media = {"0@.png": b"data"}
    catalog, warnings = build_media_catalog(raw_media)
    assert len(catalog) == 1
    assert catalog[0].output_name == "media-0.png"
