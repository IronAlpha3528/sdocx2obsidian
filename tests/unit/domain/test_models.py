"""Unit tests for domain models."""
from __future__ import annotations

from pathlib import Path

import pytest

from sdocx2obsidian.domain.models import (
    BatchResult,
    ConversionOutcome,
    MediaBlock,
    MediaKind,
    OutcomeStatus,
    ParsedNote,
    SdocxArchive,
    TargetPaths,
    TextBlock,
)


def test_models_media_kind_members() -> None:
    """MediaKind enum contains IMAGE and AUDIO."""
    assert MediaKind.IMAGE.value == "image" or MediaKind.IMAGE.name == "IMAGE"
    assert MediaKind.AUDIO.value == "audio" or MediaKind.AUDIO.name == "AUDIO"


def test_models_outcome_status_members() -> None:
    """OutcomeStatus enum contains SUCCEEDED and FAILED."""
    assert OutcomeStatus.SUCCEEDED.name == "SUCCEEDED"
    assert OutcomeStatus.FAILED.name == "FAILED"


def test_models_sdocx_archive_frozen_and_fields() -> None:
    """SdocxArchive is frozen, slotted, and stores archive bytes."""
    archive = SdocxArchive(source_name="note1", note_bytes=b"bytes", media={"0@img.png": b"data"})
    assert archive.source_name == "note1"
    assert archive.note_bytes == b"bytes"
    assert archive.media["0@img.png"] == b"data"
    with pytest.raises((AttributeError, TypeError)):
        archive.source_name = "other"  # type: ignore[misc]


def test_models_text_block_frozen_and_fields() -> None:
    """TextBlock stores normalized non-empty text."""
    tb = TextBlock(text="Hello world")
    assert tb.text == "Hello world"
    with pytest.raises((AttributeError, TypeError)):
        tb.text = "change"  # type: ignore[misc]


def test_models_media_block_frozen_and_fields() -> None:
    """MediaBlock stores filename and media kind."""
    mb = MediaBlock(filename="image.png", kind=MediaKind.IMAGE)
    assert mb.filename == "image.png"
    assert mb.kind == MediaKind.IMAGE
    with pytest.raises((AttributeError, TypeError)):
        mb.filename = "change"  # type: ignore[misc]


def test_models_parsed_note_frozen_and_fields() -> None:
    """ParsedNote stores title, blocks, assets mapping, and warnings."""
    tb = TextBlock(text="Body text")
    pn = ParsedNote(title="Title", blocks=(tb,), assets={}, warnings=("warn1",))
    assert pn.title == "Title"
    assert pn.blocks == (tb,)
    assert pn.assets == {}
    assert pn.warnings == ("warn1",)
    with pytest.raises((AttributeError, TypeError)):
        pn.title = "New Title"  # type: ignore[misc]


def test_models_target_paths_frozen_and_fields() -> None:
    """TargetPaths stores note stem, full md path, assets dir path and name."""
    tp = TargetPaths(
        note_stem="MyNote",
        md_path=Path("/dest/MyNote.md"),
        assets_dir=Path("/dest/MyNote_Assets"),
        assets_dir_name="MyNote_Assets",
    )
    assert tp.note_stem == "MyNote"
    assert tp.md_path == Path("/dest/MyNote.md")
    assert tp.assets_dir == Path("/dest/MyNote_Assets")
    assert tp.assets_dir_name == "MyNote_Assets"
    with pytest.raises((AttributeError, TypeError)):
        tp.note_stem = "Other"  # type: ignore[misc]


def test_models_conversion_outcome_succeeded() -> None:
    """ConversionOutcome stores outcome details for succeeded conversion."""
    co = ConversionOutcome(
        source=Path("/src/note.sdocx"),
        status=OutcomeStatus.SUCCEEDED,
        markdown_path=Path("/dest/note.md"),
        asset_count=2,
        warnings=(),
        error=None,
    )
    assert co.status == OutcomeStatus.SUCCEEDED
    assert co.markdown_path == Path("/dest/note.md")
    assert co.asset_count == 2
    assert co.error is None
    with pytest.raises((AttributeError, TypeError)):
        co.status = OutcomeStatus.FAILED  # type: ignore[misc]


def test_models_batch_result_counts_relation() -> None:
    """BatchResult total must equal succeeded + failed."""
    co1 = ConversionOutcome(
        source=Path("n1.sdocx"),
        status=OutcomeStatus.SUCCEEDED,
        markdown_path=Path("n1.md"),
        asset_count=1,
        warnings=(),
        error=None,
    )
    co2 = ConversionOutcome(
        source=Path("n2.sdocx"),
        status=OutcomeStatus.FAILED,
        markdown_path=None,
        asset_count=0,
        warnings=(),
        error="Corrupt file",
    )
    br = BatchResult(outcomes=(co1, co2), total=2, succeeded=1, failed=1)
    assert br.total == br.succeeded + br.failed
    assert len(br.outcomes) == 2
    with pytest.raises((AttributeError, TypeError)):
        br.total = 3  # type: ignore[misc]
