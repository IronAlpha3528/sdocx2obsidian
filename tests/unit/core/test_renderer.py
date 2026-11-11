"""Unit tests for Markdown renderer in core/renderer.py."""
from __future__ import annotations

import pytest

from sdocx2obsidian.core.renderer import MarkdownRenderer
from sdocx2obsidian.domain.exceptions import RenderError
from sdocx2obsidian.domain.models import MediaBlock, MediaKind, ParsedNote, TextBlock


def test_renderer_ac1_shape_and_blank_line_separation() -> None:
    """Blocks are interleaved, separated by one blank line, ending in single newline."""
    renderer = MarkdownRenderer()
    note = ParsedNote(
        title="Lecture",
        blocks=(
            TextBlock("Paragraph A"),
            MediaBlock("img1.png", MediaKind.IMAGE),
            TextBlock("Paragraph B"),
            MediaBlock("voice1.m4a", MediaKind.AUDIO),
        ),
        assets={"img1.png": b"", "voice1.m4a": b""},
        warnings=(),
    )
    rendered = renderer.render(note, "Lecture_Assets")
    expected = (
        "Paragraph A\n\n"
        "![[Lecture_Assets/img1.png]]\n\n"
        "Paragraph B\n\n"
        "![[Lecture_Assets/voice1.m4a]]\n"
    )
    assert rendered == expected


def test_renderer_zero_blocks_produces_single_newline() -> None:
    """Note with zero blocks renders as a single newline."""
    renderer = MarkdownRenderer()
    note = ParsedNote(title="Empty", blocks=(), assets={}, warnings=())
    assert renderer.render(note, "Empty_Assets") == "\n"


def test_renderer_versioned_assets_folder() -> None:
    """Renderer uses versioned asset folder name in embed links."""
    renderer = MarkdownRenderer()
    note = ParsedNote(
        title="Note",
        blocks=(MediaBlock("pic.jpg", MediaKind.IMAGE),),
        assets={"pic.jpg": b""},
        warnings=(),
    )
    rendered = renderer.render(note, "Note (1)_Assets")
    assert rendered == "![[Note (1)_Assets/pic.jpg]]\n"


def test_renderer_invalid_characters_raise_render_error() -> None:
    """Invalid link characters or backslashes raise RenderError."""
    renderer = MarkdownRenderer()
    note = ParsedNote(
        title="Note",
        blocks=(MediaBlock("bad\\pic.jpg", MediaKind.IMAGE),),
        assets={"bad\\pic.jpg": b""},
        warnings=(),
    )
    with pytest.raises(RenderError):
        renderer.render(note, "Assets")

    # Invalid asset directory name
    good_note = ParsedNote(
        title="Note",
        blocks=(MediaBlock("pic.jpg", MediaKind.IMAGE),),
        assets={"pic.jpg": b""},
        warnings=(),
    )
    with pytest.raises(RenderError):
        renderer.render(good_note, "Assets#1")
