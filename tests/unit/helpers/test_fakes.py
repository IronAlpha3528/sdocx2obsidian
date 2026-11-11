"""Unit tests for protocol fakes in tests/helpers/fakes.py."""
from __future__ import annotations

from pathlib import Path

import pytest
from tests.helpers.fakes import (
    FakeArchiveExtractor,
    FakeMarkdownRenderer,
    FakeNoteParser,
    FakeProgressReporter,
    FakeSourceScanner,
    FakeStorageRepository,
)

from sdocx2obsidian.domain.exceptions import CorruptArchiveError, SourceError
from sdocx2obsidian.domain.models import (
    ConversionOutcome,
    OutcomeStatus,
    ParsedNote,
    SdocxArchive,
    TextBlock,
)


def test_fake_source_scanner_recording_and_failure() -> None:
    """FakeSourceScanner logs calls and raises configured errors."""
    scanner = FakeSourceScanner(sources=[Path("a.sdocx"), Path("b.sdocx")])
    res = scanner.list_sources(Path("/src"))
    assert len(res) == 2
    assert scanner.calls == [("list_sources", Path("/src"))]

    failing = FakeSourceScanner(error=SourceError("directory not found"))
    with pytest.raises(SourceError):
        failing.list_sources(Path("/missing"))


def test_fake_archive_extractor_recording_and_failure() -> None:
    """FakeArchiveExtractor logs extraction calls and handles per-file errors."""
    archive = SdocxArchive("note", b"bytes", {})
    extractor = FakeArchiveExtractor(
        archives={"valid.sdocx": archive},
        errors={"corrupt.sdocx": CorruptArchiveError("bad zip")},
    )
    assert extractor.extract(Path("valid.sdocx")) is archive
    assert extractor.calls == [Path("valid.sdocx")]

    with pytest.raises(CorruptArchiveError):
        extractor.extract(Path("corrupt.sdocx"))


def test_fake_note_parser_and_renderer() -> None:
    """FakeNoteParser and FakeMarkdownRenderer produce configured outputs."""
    parsed = ParsedNote("Title", (TextBlock("Hello"),), {}, ())
    parser = FakeNoteParser(default_parsed_note=parsed)
    archive = SdocxArchive("note", b"data", {})
    assert parser.parse(archive) is parsed
    assert parser.calls == [archive]

    renderer = FakeMarkdownRenderer(rendered_output="# Rendered\n")
    assert renderer.render(parsed, "Assets") == "# Rendered\n"
    assert renderer.calls == [(parsed, "Assets")]


def test_fake_storage_repository() -> None:
    """FakeStorageRepository logs prepare, resolve, and persist calls."""
    storage = FakeStorageRepository()
    storage.prepare(Path("/dest"))
    paths = storage.resolve_target_paths(Path("/dest"), "MyNote")
    assert paths.note_stem == "MyNote"
    assert paths.assets_dir_name == "MyNote_Assets"

    storage.persist(paths, "# Markdown\n", {"img.png": b"img"})
    assert len(storage.persisted) == 1
    assert storage.persisted[0] == (paths, "# Markdown\n", {"img.png": b"img"})


def test_fake_progress_reporter() -> None:
    """FakeProgressReporter records started total and finished outcomes."""
    reporter = FakeProgressReporter()
    reporter.started(5)
    outcome = ConversionOutcome(
        source=Path("test.sdocx"),
        status=OutcomeStatus.SUCCEEDED,
        markdown_path=Path("test.md"),
        asset_count=1,
        warnings=(),
        error=None,
    )
    reporter.finished(outcome)
    assert reporter.total_started == 5
    assert reporter.outcomes == [outcome]
