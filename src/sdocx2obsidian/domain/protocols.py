"""Protocol contracts defining structural interfaces for all system components."""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Protocol

from sdocx2obsidian.domain.models import (
    ConversionOutcome,
    ParsedNote,
    SdocxArchive,
    TargetPaths,
)


class ISourceScanner(Protocol):
    """Protocol for discovering source .sdocx files."""

    def list_sources(self, source_dir: Path) -> Sequence[Path]:
        """Return regular .sdocx files sorted case-insensitively."""
        ...


class IArchiveExtractor(Protocol):
    """Protocol for reading note bytes and media from a .sdocx archive."""

    def extract(self, source: Path) -> SdocxArchive:
        """Extract note bytes and media entries safely."""
        ...


class INoteParser(Protocol):
    """Protocol for parsing binary note data into structured blocks."""

    def parse(self, archive: SdocxArchive) -> ParsedNote:
        """Parse raw archive bytes into structured note content."""
        ...


class IMarkdownRenderer(Protocol):
    """Protocol for rendering parsed notes to Markdown text."""

    def render(self, note: ParsedNote, assets_dir_name: str) -> str:
        """Render a parsed note into Obsidian Markdown with wikilink embeds."""
        ...


class IStorageRepository(Protocol):
    """Protocol for managing destination directories, path resolution, and persistence."""

    def prepare(self, dest_dir: Path) -> None:
        """Create and verify destination directory writability."""
        ...

    def resolve_target_paths(self, dest_dir: Path, note_name: str) -> TargetPaths:
        """Resolve collision-free Markdown and asset folder paths."""
        ...

    def persist(
        self,
        paths: TargetPaths,
        markdown: str,
        assets: Mapping[str, bytes],
    ) -> None:
        """Write Markdown and assets atomically to the destination."""
        ...


class IProgressReporter(Protocol):
    """Protocol for receiving batch conversion progress updates."""

    def started(self, total: int) -> None:
        """Notify reporter of batch start with total note count."""
        ...

    def finished(self, outcome: ConversionOutcome) -> None:
        """Notify reporter when an individual note conversion finishes."""
        ...
