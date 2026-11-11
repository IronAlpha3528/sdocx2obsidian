"""Hand-written recording protocol fakes for testing application and workflow layers."""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path

from sdocx2obsidian.domain.models import (
    ConversionOutcome,
    ParsedNote,
    SdocxArchive,
    TargetPaths,
)
from sdocx2obsidian.domain.naming import build_asset_dir_name


@dataclass
class FakeSourceScanner:
    """Recording fake for ISourceScanner."""

    sources: Sequence[Path] = field(default_factory=tuple)
    error: Exception | None = None
    calls: list[tuple[str, Path]] = field(default_factory=list)

    def list_sources(self, source_dir: Path) -> Sequence[Path]:
        """Record call and return sources or raise error."""
        self.calls.append(("list_sources", source_dir))
        if self.error is not None:
            raise self.error
        return self.sources


@dataclass
class FakeArchiveExtractor:
    """Recording fake for IArchiveExtractor."""

    archives: dict[str, SdocxArchive] = field(default_factory=dict)
    errors: dict[str, Exception] = field(default_factory=dict)
    default_archive: SdocxArchive | None = None
    calls: list[Path] = field(default_factory=list)

    def extract(self, source: Path) -> SdocxArchive:
        """Record call and return archive or raise error."""
        self.calls.append(source)
        if source.name in self.errors:
            raise self.errors[source.name]
        if source.name in self.archives:
            return self.archives[source.name]
        if self.default_archive is not None:
            return self.default_archive
        return SdocxArchive(source.stem, b"dummy_note_bytes", {})


@dataclass
class FakeNoteParser:
    """Recording fake for INoteParser."""

    parsed_notes: dict[str, ParsedNote] = field(default_factory=dict)
    errors: dict[str, Exception] = field(default_factory=dict)
    default_parsed_note: ParsedNote | None = None
    calls: list[SdocxArchive] = field(default_factory=list)

    def parse(self, archive: SdocxArchive) -> ParsedNote:
        """Record call and return parsed note or raise error."""
        self.calls.append(archive)
        if archive.source_name in self.errors:
            raise self.errors[archive.source_name]
        if archive.source_name in self.parsed_notes:
            return self.parsed_notes[archive.source_name]
        if self.default_parsed_note is not None:
            return self.default_parsed_note
        return ParsedNote(archive.source_name, (), {}, ())


@dataclass
class FakeMarkdownRenderer:
    """Recording fake for IMarkdownRenderer."""

    rendered_output: str = "Rendered Markdown\n"
    error: Exception | None = None
    calls: list[tuple[ParsedNote, str]] = field(default_factory=list)

    def render(self, note: ParsedNote, assets_dir_name: str) -> str:
        """Record call and return rendered Markdown or raise error."""
        self.calls.append((note, assets_dir_name))
        if self.error is not None:
            raise self.error
        return self.rendered_output


@dataclass
class FakeStorageRepository:
    """Recording fake for IStorageRepository."""

    prepare_error: Exception | None = None
    resolve_error: Exception | None = None
    persist_error: Exception | None = None
    prepare_calls: list[Path] = field(default_factory=list)
    resolve_calls: list[tuple[Path, str]] = field(default_factory=list)
    persisted: list[tuple[TargetPaths, str, Mapping[str, bytes]]] = field(default_factory=list)

    def prepare(self, dest_dir: Path) -> None:
        """Record prepare call and handle errors."""
        self.prepare_calls.append(dest_dir)
        if self.prepare_error is not None:
            raise self.prepare_error

    def resolve_target_paths(self, dest_dir: Path, note_name: str) -> TargetPaths:
        """Record resolve call and return TargetPaths."""
        self.resolve_calls.append((dest_dir, note_name))
        if self.resolve_error is not None:
            raise self.resolve_error
        assets_name = build_asset_dir_name(note_name)
        return TargetPaths(
            note_stem=note_name,
            md_path=dest_dir / f"{note_name}.md",
            assets_dir=dest_dir / assets_name,
            assets_dir_name=assets_name,
        )

    def persist(
        self,
        paths: TargetPaths,
        markdown: str,
        assets: Mapping[str, bytes],
    ) -> None:
        """Record persist call and handle errors."""
        self.persisted.append((paths, markdown, assets))
        if self.persist_error is not None:
            raise self.persist_error


@dataclass
class FakeProgressReporter:
    """Recording fake for IProgressReporter."""

    total_started: int = 0
    outcomes: list[ConversionOutcome] = field(default_factory=list)

    def started(self, total: int) -> None:
        """Record total count."""
        self.total_started = total

    def finished(self, outcome: ConversionOutcome) -> None:
        """Record individual conversion outcome."""
        self.outcomes.append(outcome)
