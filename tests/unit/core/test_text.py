"""Unit tests for text normalization rules in core/text.py."""
from __future__ import annotations

from sdocx2obsidian.core.text import normalize_text_segment


def test_text_crlf_and_cr_normalized() -> None:
    """CRLF and CR are normalized to standard LF."""
    raw = "Line 1\r\nLine 2\rLine 3"
    assert normalize_text_segment(raw) == "Line 1\nLine 2\nLine 3"


def test_text_control_characters_removed_except_newline_and_tab() -> None:
    """Control characters are stripped while newlines and tabs inside text are preserved."""
    raw = "Hello\x00\x07\x0b\tWorld\nLine 2"
    assert normalize_text_segment(raw) == "Hello\tWorld\nLine 2"


def test_text_trailing_spaces_and_tabs_stripped_per_line() -> None:
    """Trailing spaces and tabs on every line are stripped to prevent accidental Markdown breaks."""
    raw = "Hello   \t\nHi Ola \t  \nLine 3"
    assert normalize_text_segment(raw) == "Hello\nHi Ola\nLine 3"


def test_text_runs_of_three_or_more_newlines_collapsed_to_two() -> None:
    """Runs of three or more newlines become exactly two."""
    raw = "Para 1\n\n\n\n\nPara 2\n\n\nPara 3"
    assert normalize_text_segment(raw) == "Para 1\n\nPara 2\n\nPara 3"


def test_text_leading_and_trailing_newlines_trimmed() -> None:
    """Leading and trailing newlines of segment are trimmed."""
    raw = "\n\n\nContent here\n\n"
    assert normalize_text_segment(raw) == "Content here"


def test_text_whitespace_only_segment_returns_none() -> None:
    """Segments that are empty or whitespace-only after trimming are dropped (return None)."""
    assert normalize_text_segment("   \n\t  \n\n  ") is None
    assert normalize_text_segment("") is None


def test_text_single_newline_inside_paragraph_preserved() -> None:
    """Single newline inside paragraph is preserved."""
    raw = "First line\nSecond line"
    assert normalize_text_segment(raw) == "First line\nSecond line"


def test_text_unicode_and_replacement_character() -> None:
    """Unicode characters and replacement characters are preserved."""
    raw = "Unicode: \u2764, Replacement: \ufffd"
    assert normalize_text_segment(raw) == "Unicode: \u2764, Replacement: \ufffd"
