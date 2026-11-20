"""Tests for NoteParser object and placeholder cap enforcement."""
from __future__ import annotations

import pytest
from tests.helpers.builder import ObjectDescriptor, SdocxBuilder

from sdocx2obsidian.core.parser import NoteParser
from sdocx2obsidian.domain.exceptions import MalformedNoteError
from sdocx2obsidian.domain.limits import DEFAULT_LIMITS, LimitsProfile
from sdocx2obsidian.domain.models import SdocxArchive


def test_parser_default_limits_has_no_caps() -> None:
    parser = NoteParser(limits=DEFAULT_LIMITS)
    assert parser._limits.max_objects is None
    assert parser._limits.max_placeholders is None


def test_parser_objects_cap_trips() -> None:
    profile = LimitsProfile(
        max_entries=500,
        max_entry_size=50 * 1024 * 1024,
        max_total_size=100 * 1024 * 1024,
        max_ratio=50.0,
        ratio_threshold=1024 * 1024,
        max_objects=5,
        max_placeholders=100,
    )
    builder = SdocxBuilder(
        title="Objects Cap Test",
        body="Text",
        objects=[ObjectDescriptor.image(i) for i in range(6)],  # 6 > 5
    )
    archive = SdocxArchive("test.sdocx", builder.build_note_bytes(), {})
    parser = NoteParser(limits=profile)
    with pytest.raises(MalformedNoteError, match="object count exceeds limit"):
        parser.parse(archive)


def test_parser_objects_just_under_cap_passes() -> None:
    profile = LimitsProfile(
        max_entries=500,
        max_entry_size=50 * 1024 * 1024,
        max_total_size=100 * 1024 * 1024,
        max_ratio=50.0,
        ratio_threshold=1024 * 1024,
        max_objects=5,
        max_placeholders=100,
    )
    builder = SdocxBuilder(
        title="Objects Under Cap",
        body="Text",
        objects=[ObjectDescriptor.image(i) for i in range(5)],  # 5 <= 5
    )
    archive = SdocxArchive("test.sdocx", builder.build_note_bytes(), {})
    parser = NoteParser(limits=profile)
    parsed = parser.parse(archive)
    assert parsed.title == "Objects Under Cap"


def test_parser_placeholders_cap_trips() -> None:
    profile = LimitsProfile(
        max_entries=500,
        max_entry_size=50 * 1024 * 1024,
        max_total_size=100 * 1024 * 1024,
        max_ratio=50.0,
        ratio_threshold=1024 * 1024,
        max_objects=100,
        max_placeholders=5,
    )
    # 6 placeholders > 5
    body = "Word " + ("\ufffc " * 6) + "End"
    builder = SdocxBuilder(title="Placeholders Cap Test", body=body, objects=[])
    archive = SdocxArchive("test.sdocx", builder.build_note_bytes(), {})
    parser = NoteParser(limits=profile)
    with pytest.raises(MalformedNoteError, match="placeholder count exceeds limit"):
        parser.parse(archive)


def test_parser_placeholders_just_under_cap_passes() -> None:
    profile = LimitsProfile(
        max_entries=500,
        max_entry_size=50 * 1024 * 1024,
        max_total_size=100 * 1024 * 1024,
        max_ratio=50.0,
        ratio_threshold=1024 * 1024,
        max_objects=100,
        max_placeholders=5,
    )
    body = "Word " + ("\ufffc " * 5) + "End"
    builder = SdocxBuilder(title="Placeholders Under Cap", body=body, objects=[])
    archive = SdocxArchive("test.sdocx", builder.build_note_bytes(), {})
    parser = NoteParser(limits=profile)
    parsed = parser.parse(archive)
    assert parsed.title == "Placeholders Under Cap"
