"""Unit tests for ConversionService in application/service.py."""
from __future__ import annotations

from collections.abc import Mapping
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

from sdocx2obsidian.application.service import ConversionService
from sdocx2obsidian.domain.exceptions import (
    CorruptArchiveError,
    DestinationError,
    MalformedNoteError,
    PersistError,
    RenderError,
    SourceError,
    StorageError,
)
from sdocx2obsidian.domain.models import (
    OutcomeStatus,
    ParsedNote,
    SdocxArchive,
    TargetPaths,
)


def _make_service(
    scanner: FakeSourceScanner | None = None,
    extractor: FakeArchiveExtractor | None = None,
    parser: FakeNoteParser | None = None,
    renderer: FakeMarkdownRenderer | None = None,
    storage: FakeStorageRepository | None = None,
    reporter: FakeProgressReporter | None = None,
) -> tuple[
    ConversionService,
    FakeSourceScanner,
    FakeArchiveExtractor,
    FakeNoteParser,
    FakeMarkdownRenderer,
    FakeStorageRepository,
    FakeProgressReporter,
]:
    sc = scanner or FakeSourceScanner()
    ex = extractor or FakeArchiveExtractor()
    pa = parser or FakeNoteParser()
    re = renderer or FakeMarkdownRenderer()
    st = storage or FakeStorageRepository()
    rp = reporter or FakeProgressReporter()
    srv = ConversionService(
        scanner=sc,
        extractor=ex,
        parser=pa,
        renderer=re,
        storage=st,
        reporter=rp,
    )
    return srv, sc, ex, pa, re, st, rp


def test_convert_batch_ac4_two_valid_one_corrupt(tmp_path: Path) -> None:
    """AC-4: 2 valid notes and 1 corrupt produce 2 successes, 1 failure, and return BatchResult."""
    source_dir = tmp_path / "source"
    dest_dir = tmp_path / "dest"
    sources = (source_dir / "a.sdocx", source_dir / "b.sdocx", source_dir / "c.sdocx")

    scanner = FakeSourceScanner(sources=sources)
    extractor = FakeArchiveExtractor(
        errors={"b.sdocx": CorruptArchiveError("Corrupted archive bytes")}
    )

    service, _, _, _, _, _, reporter = _make_service(scanner=scanner, extractor=extractor)
    result = service.convert_batch(source_dir, dest_dir)

    assert result.total == 3
    assert result.succeeded == 2
    assert result.failed == 1
    assert len(result.outcomes) == 3

    assert result.outcomes[0].status == OutcomeStatus.SUCCEEDED
    assert result.outcomes[1].status == OutcomeStatus.FAILED
    assert result.outcomes[1].error == "Corrupted archive bytes"
    assert result.outcomes[2].status == OutcomeStatus.SUCCEEDED

    assert reporter.total_started == 3
    assert len(reporter.outcomes) == 3


def test_convert_one_call_order_and_asset_dir_name_passed_to_renderer(tmp_path: Path) -> None:
    """Per-note flow follows extract -> parse -> resolve -> render -> persist in order."""
    source = tmp_path / "note.sdocx"
    dest_dir = tmp_path / "dest"

    order: list[str] = []

    class OrderTrackingExtractor(FakeArchiveExtractor):
        def extract(self, src: Path) -> SdocxArchive:
            order.append("extract")
            return super().extract(src)

    class OrderTrackingParser(FakeNoteParser):
        def parse(self, arch: SdocxArchive) -> ParsedNote:
            order.append("parse")
            return super().parse(arch)

    class OrderTrackingRenderer(FakeMarkdownRenderer):
        def render(self, note: ParsedNote, assets_dir_name: str) -> str:
            order.append("render")
            return super().render(note, assets_dir_name)

    class OrderTrackingStorage(FakeStorageRepository):
        def resolve_target_paths(self, dest: Path, name: str) -> TargetPaths:
            order.append("resolve")
            return super().resolve_target_paths(dest, name)

        def persist(
            self, paths: TargetPaths, md: str, assets: Mapping[str, bytes]
        ) -> None:
            order.append("persist")
            return super().persist(paths, md, assets)

    service, _, _, _, renderer, storage, _ = _make_service(
        extractor=OrderTrackingExtractor(),
        parser=OrderTrackingParser(),
        renderer=OrderTrackingRenderer(),
        storage=OrderTrackingStorage(),
    )

    outcome = service.convert_one(source, dest_dir)
    assert outcome.status == OutcomeStatus.SUCCEEDED
    assert order == ["extract", "parse", "resolve", "render", "persist"]

    # Verify asset folder name from resolve equals the one passed to render
    resolved_asset_name = storage.resolve_calls[0][1] + "_Assets"
    assert renderer.calls[0][1] == resolved_asset_name


@pytest.mark.parametrize(
    ("stage", "exc"),
    [
        ("extract", CorruptArchiveError("bad zip")),
        ("parse", MalformedNoteError("bad header")),
        ("resolve", StorageError("resolve failed")),
        ("render", RenderError("bad link")),
        ("persist", PersistError("disk error")),
    ],
)
def test_convert_one_domain_failure_produces_failed_outcome(
    tmp_path: Path, stage: str, exc: Exception
) -> None:
    """Domain errors at any individual stage produce failed outcome with exception message."""
    extractor = FakeArchiveExtractor()
    parser = FakeNoteParser()
    renderer = FakeMarkdownRenderer()
    storage = FakeStorageRepository()

    if stage == "extract":
        extractor.errors["note.sdocx"] = exc
    elif stage == "parse":
        parser.errors["note"] = exc
    elif stage == "resolve":
        storage.resolve_error = exc
    elif stage == "render":
        renderer.error = exc
    elif stage == "persist":
        storage.persist_error = exc

    service, _, _, _, _, _, _ = _make_service(
        extractor=extractor, parser=parser, renderer=renderer, storage=storage
    )
    outcome = service.convert_one(tmp_path / "note.sdocx", tmp_path / "dest")

    assert outcome.status == OutcomeStatus.FAILED
    assert outcome.error == str(exc)
    assert outcome.markdown_path is None
    assert outcome.asset_count == 0


def test_convert_one_last_resort_catch_unexpected_exception(tmp_path: Path) -> None:
    """Unexpected non-domain exception produces failed outcome labeled with type name."""
    extractor = FakeArchiveExtractor()
    extractor.errors["note.sdocx"] = KeyError("unexpected_dict_key")

    service, _, _, _, _, _, _ = _make_service(extractor=extractor)
    outcome = service.convert_one(tmp_path / "note.sdocx", tmp_path / "dest")

    assert outcome.status == OutcomeStatus.FAILED
    assert outcome.error == "unexpected internal error: KeyError"


def test_convert_batch_fatal_source_error_propagates(tmp_path: Path) -> None:
    """Fatal SourceError from scanner propagates out of convert_batch."""
    scanner = FakeSourceScanner(error=SourceError("Source folder missing"))
    service, _, _, _, _, _, _ = _make_service(scanner=scanner)

    with pytest.raises(SourceError) as exc:
        service.convert_batch(tmp_path / "source", tmp_path / "dest")
    assert "Source folder missing" in str(exc.value)


def test_convert_batch_fatal_destination_error_propagates(tmp_path: Path) -> None:
    """Fatal DestinationError from storage.prepare propagates out of convert_batch."""
    storage = FakeStorageRepository(prepare_error=DestinationError("Destination unwritable"))
    service, _, _, _, _, _, _ = _make_service(storage=storage)

    with pytest.raises(DestinationError) as exc:
        service.convert_batch(tmp_path / "source", tmp_path / "dest")
    assert "Destination unwritable" in str(exc.value)


def test_convert_batch_empty_sources(tmp_path: Path) -> None:
    """Empty batch completes cleanly with zero counts and empty outcomes."""
    service, _, _, _, _, _, reporter = _make_service(scanner=FakeSourceScanner(sources=()))
    result = service.convert_batch(tmp_path / "source", tmp_path / "dest")

    assert result.total == 0
    assert result.succeeded == 0
    assert result.failed == 0
    assert result.outcomes == ()
    assert reporter.total_started == 0
    assert reporter.outcomes == []

