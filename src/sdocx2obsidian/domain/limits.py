"""Immutable limits profiles for archive extraction and note parsing."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class LimitsProfile:
    """Resource and denial-of-service bounds for extraction and parsing."""

    max_entries: int
    max_entry_size: int
    max_total_size: int
    max_ratio: float
    ratio_threshold: int
    max_objects: int | None = None
    max_placeholders: int | None = None


DEFAULT_LIMITS = LimitsProfile(
    max_entries=5000,
    max_entry_size=512 * 1024 * 1024,
    max_total_size=1024 * 1024 * 1024,
    max_ratio=200.0,
    ratio_threshold=1024 * 1024,
    max_objects=None,
    max_placeholders=None,
)

WEB_LIMITS = LimitsProfile(
    max_entries=500,
    max_entry_size=50 * 1024 * 1024,
    max_total_size=100 * 1024 * 1024,
    max_ratio=50.0,
    ratio_threshold=1024 * 1024,
    max_objects=2500,
    max_placeholders=20000,
)
