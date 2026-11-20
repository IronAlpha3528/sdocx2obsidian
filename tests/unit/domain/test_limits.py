"""Unit tests for LimitsProfile model and predefined profiles."""
from __future__ import annotations

import dataclasses

import pytest

from sdocx2obsidian.domain.limits import (
    DEFAULT_LIMITS,
    WEB_LIMITS,
    LimitsProfile,
)


def test_limits_profile_is_frozen() -> None:
    profile = LimitsProfile(
        max_entries=10,
        max_entry_size=100,
        max_total_size=1000,
        max_ratio=10.0,
        ratio_threshold=50,
        max_objects=5,
        max_placeholders=10,
    )
    with pytest.raises(dataclasses.FrozenInstanceError):
        # pyright: ignore [reportGeneralTypeIssues]
        profile.max_entries = 20  # type: ignore[misc]


def test_default_limits_match_desktop_constants() -> None:
    assert DEFAULT_LIMITS.max_entries == 5000
    assert DEFAULT_LIMITS.max_entry_size == 512 * 1024 * 1024
    assert DEFAULT_LIMITS.max_total_size == 1024 * 1024 * 1024
    assert DEFAULT_LIMITS.max_ratio == 200.0
    assert DEFAULT_LIMITS.ratio_threshold == 1024 * 1024
    assert DEFAULT_LIMITS.max_objects is None
    assert DEFAULT_LIMITS.max_placeholders is None


def test_web_limits_match_brief_specification() -> None:
    assert WEB_LIMITS.max_entries == 500
    assert WEB_LIMITS.max_entry_size == 50 * 1024 * 1024
    assert WEB_LIMITS.max_total_size == 100 * 1024 * 1024
    assert WEB_LIMITS.max_ratio == 50.0
    assert WEB_LIMITS.ratio_threshold == 1024 * 1024
    assert WEB_LIMITS.max_objects == 2500
    assert WEB_LIMITS.max_placeholders == 20000
