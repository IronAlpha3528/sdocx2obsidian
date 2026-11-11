"""Markdown rendering from parsed notes to Obsidian-compatible Markdown."""
from __future__ import annotations

from sdocx2obsidian.domain.exceptions import RenderError
from sdocx2obsidian.domain.models import MediaBlock, ParsedNote, TextBlock

BANNED_LINK_CHARS: frozenset[str] = frozenset('\\/|#^[]\r\n')


def _validate_link_component(name: str) -> None:
    for ch in name:
        if ch in BANNED_LINK_CHARS or ord(ch) < 32 or ord(ch) == 127:
            raise RenderError(f"Name '{name}' contains illegal link character: {ch!r}")


class MarkdownRenderer:
    """Renders parsed notes into Obsidian Markdown text."""

    def render(self, note: ParsedNote, assets_dir_name: str) -> str:
        """Render parsed note into Markdown text with Obsidian embeds."""
        _validate_link_component(assets_dir_name)
        if not note.blocks:
            return "\n"

        parts: list[str] = []
        for block in note.blocks:
            if isinstance(block, TextBlock):
                parts.append(block.text)
            elif isinstance(block, MediaBlock):
                _validate_link_component(block.filename)
                parts.append(f"![[{assets_dir_name}/{block.filename}]]")

        return "\n\n".join(parts) + "\n"
