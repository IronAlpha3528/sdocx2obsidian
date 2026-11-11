"""Application conversion service orchestrating end-to-end note conversion."""
from __future__ import annotations

from pathlib import Path

from sdocx2obsidian.domain.exceptions import Sdocx2ObsidianError
from sdocx2obsidian.domain.models import (
    BatchResult,
    ConversionOutcome,
    OutcomeStatus,
)
from sdocx2obsidian.domain.protocols import (
    IArchiveExtractor,
    IMarkdownRenderer,
    INoteParser,
    IProgressReporter,
    ISourceScanner,
    IStorageRepository,
)


class ConversionService:
    """Orchestrates batch conversion of Samsung Notes archives into Obsidian Markdown."""

    def __init__(
        self,
        scanner: ISourceScanner,
        extractor: IArchiveExtractor,
        parser: INoteParser,
        renderer: IMarkdownRenderer,
        storage: IStorageRepository,
        reporter: IProgressReporter,
    ) -> None:
        self._scanner = scanner
        self._extractor = extractor
        self._parser = parser
        self._renderer = renderer
        self._storage = storage
        self._reporter = reporter

    def convert_batch(self, source_dir: Path, dest_dir: Path) -> BatchResult:
        """Run batch conversion across all discovered notes in source directory.

        Propagates fatal SourceError and DestinationError if directory setup fails.
        """
        sources = self._scanner.list_sources(source_dir)
        self._storage.prepare(dest_dir)
        self._reporter.started(len(sources))

        outcomes: list[ConversionOutcome] = []
        for source in sources:
            outcome = self.convert_one(source, dest_dir)
            self._reporter.finished(outcome)
            outcomes.append(outcome)

        succeeded = sum(1 for o in outcomes if o.status == OutcomeStatus.SUCCEEDED)
        failed = sum(1 for o in outcomes if o.status == OutcomeStatus.FAILED)
        return BatchResult(
            outcomes=tuple(outcomes),
            total=len(sources),
            succeeded=succeeded,
            failed=failed,
        )

    def convert_one(self, source: Path, dest_dir: Path) -> ConversionOutcome:
        """Convert a single .sdocx source archive into Obsidian Markdown and assets."""
        try:
            archive = self._extractor.extract(source)
            note = self._parser.parse(archive)
            paths = self._storage.resolve_target_paths(dest_dir, archive.source_name)
            markdown = self._renderer.render(note, paths.assets_dir_name)
            self._storage.persist(paths, markdown, note.assets)
            return ConversionOutcome(
                source=source,
                status=OutcomeStatus.SUCCEEDED,
                markdown_path=paths.md_path,
                asset_count=len(note.assets),
                warnings=note.warnings,
                error=None,
            )
        except Sdocx2ObsidianError as exc:
            return ConversionOutcome(
                source=source,
                status=OutcomeStatus.FAILED,
                markdown_path=None,
                asset_count=0,
                warnings=(),
                error=exc.message,
            )
        except Exception as exc:
            return ConversionOutcome(
                source=source,
                status=OutcomeStatus.FAILED,
                markdown_path=None,
                asset_count=0,
                warnings=(),
                error=f"unexpected internal error: {type(exc).__name__}",
            )
