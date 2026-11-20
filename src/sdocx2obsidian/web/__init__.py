"""Web package exposing browser adapter and in-memory conversion session."""
from __future__ import annotations

from sdocx2obsidian.web.adapter import (
    ConversionSession,
    NoteResult,
    SessionOutcome,
    map_exception_to_error,
    package_directory_to_zip,
)

__all__ = [
    "ConversionSession",
    "NoteResult",
    "SessionOutcome",
    "map_exception_to_error",
    "package_directory_to_zip",
]
