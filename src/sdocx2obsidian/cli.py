"""Command-line interface and composition root for sdocx2obsidian."""
from __future__ import annotations

from pathlib import Path
from typing import Annotated

try:
    import typer
    from rich.console import Console
except ImportError:
    import sys

    sys.stderr.write(
        "CLI dependencies are not installed. Install them with: pip install 'sdocx2obsidian[cli]'\n"
    )
    sys.exit(1)

from sdocx2obsidian import __version__
from sdocx2obsidian.application.service import ConversionService
from sdocx2obsidian.core.parser import NoteParser
from sdocx2obsidian.core.renderer import MarkdownRenderer
from sdocx2obsidian.domain.exceptions import DestinationError, SourceError
from sdocx2obsidian.domain.models import BatchResult, ConversionOutcome, OutcomeStatus
from sdocx2obsidian.domain.protocols import IProgressReporter
from sdocx2obsidian.infrastructure.extractor import ArchiveExtractor
from sdocx2obsidian.infrastructure.scanner import SourceScanner
from sdocx2obsidian.infrastructure.storage import StorageRepository

app = typer.Typer(
    help="Batch-convert Samsung Notes .sdocx files into Obsidian Markdown.",
    add_completion=False,
)
console = Console()


class RichProgressReporter(IProgressReporter):
    """Rich console reporter printing per-file outcomes and live notices."""

    def __init__(self, out_console: Console) -> None:
        self._console = out_console

    def started(self, total: int) -> None:
        """Print batch start notice."""
        self._console.print(f"Found {total} .sdocx file(s) to process.")

    def finished(self, outcome: ConversionOutcome) -> None:
        """Print per-file success, failure, or warning notice."""
        if outcome.status == OutcomeStatus.FAILED:
            self._console.print(f"[FAIL] {outcome.source.name}: {outcome.error}")
        else:
            self._console.print(f"[OK]   {outcome.source.name}")
        for warning in outcome.warnings:
            self._console.print(f"[WARN] {outcome.source.name}: {warning}")


def _print_summary(out_console: Console, result: BatchResult) -> None:
    total_warnings = sum(len(o.warnings) for o in result.outcomes)
    out_console.print("\nBatch Summary:")
    out_console.print(f"  Total:     {result.total}")
    out_console.print(f"  Succeeded: {result.succeeded}")
    out_console.print(f"  Failed:    {result.failed}")
    out_console.print(f"  Warnings:  {total_warnings}")

    if result.failed > 0:
        out_console.print("\nFailed files:")
        for o in result.outcomes:
            if o.status == OutcomeStatus.FAILED:
                out_console.print(f"  - {o.source.name}: {o.error}")


def _version_callback(value: bool) -> None:
    if value:
        console.print(f"sdocx2obsidian {__version__}")
        raise typer.Exit(code=0)


def _build_service() -> ConversionService:
    scanner = SourceScanner()
    extractor = ArchiveExtractor()
    parser = NoteParser()
    renderer = MarkdownRenderer()
    storage = StorageRepository()
    reporter = RichProgressReporter(console)
    return ConversionService(scanner, extractor, parser, renderer, storage, reporter)


def _run_batch(service: ConversionService, source: Path, dest: Path) -> None:
    try:
        result = service.convert_batch(source, dest)
    except SourceError as exc:
        console.print(f"[ERROR] Source error: {exc.message}")
        raise typer.Exit(code=1) from exc
    except DestinationError as exc:
        console.print(f"[ERROR] Destination error: {exc.message}")
        raise typer.Exit(code=1) from exc
    except Exception as exc:
        console.print(f"[ERROR] Fatal crash: {exc}")
        raise typer.Exit(code=1) from exc

    if result.total == 0:
        console.print(f"Notice: No .sdocx files found in '{source}'.")
        raise typer.Exit(code=0)

    _print_summary(console, result)


@app.command()
def convert(
    source: Annotated[
        Path,
        typer.Option(
            "--source",
            "-s",
            help="Directory containing source .sdocx files.",
            show_default=False,
        ),
    ],
    dest: Annotated[
        Path,
        typer.Option(
            "--dest",
            "-d",
            help="Destination directory for converted Obsidian notes and assets.",
            show_default=False,
        ),
    ],
    version: Annotated[
        bool,
        typer.Option(
            "--version",
            "-v",
            help="Show the version and exit.",
            callback=_version_callback,
            is_eager=True,
        ),
    ] = False,
) -> None:
    """Convert Samsung Notes .sdocx files in source to Obsidian Markdown in dest."""
    service = _build_service()
    _run_batch(service, source, dest)


def main() -> None:
    """CLI execution entrypoint."""
    app()
