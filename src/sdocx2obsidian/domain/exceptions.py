"""Domain exception hierarchy."""
from __future__ import annotations


class Sdocx2ObsidianError(Exception):
    """Base exception for all sdocx2obsidian domain errors."""

    def __init__(self, message: str, cause: BaseException | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.cause = cause
        if cause is not None:
            self.__cause__ = cause


class SourceError(Sdocx2ObsidianError):
    """Raised when source directory is missing, invalid, or unreadable."""


class ArchiveError(Sdocx2ObsidianError):
    """Raised for general archive-level problems."""


class CorruptArchiveError(ArchiveError):
    """Raised when an archive is not a valid ZIP, truncated, or corrupt."""


class UnsafeArchiveError(ArchiveError):
    """Raised when archive contains unsafe paths or exceeds safety limits."""


class MissingEntryError(ArchiveError):
    """Raised when a required archive entry (e.g. note.note) is absent."""


class ParseError(Sdocx2ObsidianError):
    """Raised for any decoding or parsing problem."""


class MalformedNoteError(ParseError):
    """Raised when note structure, lengths, or text records are invalid."""


class RenderError(Sdocx2ObsidianError):
    """Raised when note content would produce an invalid Markdown link."""


class StorageError(Sdocx2ObsidianError):
    """Raised for destination directory and persistence errors."""


class DestinationError(StorageError):
    """Raised when destination directory cannot be created or written."""


class PersistError(StorageError):
    """Raised when staging, persisting, or moving output files fails."""
