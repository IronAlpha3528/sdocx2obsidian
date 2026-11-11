"""Unit tests for domain exceptions."""
from __future__ import annotations

import pytest

from sdocx2obsidian.domain.exceptions import (
    ArchiveError,
    CorruptArchiveError,
    DestinationError,
    MalformedNoteError,
    MissingEntryError,
    ParseError,
    PersistError,
    RenderError,
    Sdocx2ObsidianError,
    SourceError,
    StorageError,
    UnsafeArchiveError,
)


def test_exceptions_hierarchy_matches_dds() -> None:
    """Exception hierarchy derives from Sdocx2ObsidianError and matches DDS 4.3."""
    assert issubclass(SourceError, Sdocx2ObsidianError)
    assert issubclass(ArchiveError, Sdocx2ObsidianError)
    assert issubclass(CorruptArchiveError, ArchiveError)
    assert issubclass(UnsafeArchiveError, ArchiveError)
    assert issubclass(MissingEntryError, ArchiveError)
    assert issubclass(ParseError, Sdocx2ObsidianError)
    assert issubclass(MalformedNoteError, ParseError)
    assert issubclass(RenderError, Sdocx2ObsidianError)
    assert issubclass(StorageError, Sdocx2ObsidianError)
    assert issubclass(DestinationError, StorageError)
    assert issubclass(PersistError, StorageError)


def test_exceptions_messages_and_cause_chaining() -> None:
    """Exceptions preserve message and cause when chained."""
    original = ValueError("inner cause")
    err = CorruptArchiveError("Corrupted archive data", original)
    assert str(err) == "Corrupted archive data"
    assert err.cause is original


def test_exceptions_catchable_via_base() -> None:
    """Every domain exception is catchable via Sdocx2ObsidianError."""
    exceptions = [
        SourceError("source error"),
        CorruptArchiveError("corrupt"),
        UnsafeArchiveError("unsafe"),
        MissingEntryError("missing note.note"),
        MalformedNoteError("malformed"),
        RenderError("render failed"),
        DestinationError("destination unwritable"),
        PersistError("persist failed"),
    ]
    for exc in exceptions:
        with pytest.raises(Sdocx2ObsidianError) as exc_info:
            raise exc
        assert exc_info.value is exc
