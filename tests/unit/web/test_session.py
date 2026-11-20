"""Tests verifying the web ConversionSession interface."""
from __future__ import annotations

import io
import zipfile

import pytest
from tests.helpers.builder import ObjectDescriptor, SdocxBuilder

from sdocx2obsidian.domain.limits import LimitsProfile
from sdocx2obsidian.web.adapter import ConversionSession


def _build_text_only(title: str = "Simple", body: str = "Plain text content") -> bytes:
    return SdocxBuilder(title=title, body=body).build_bytes()


def _build_image_note(title: str = "Photo Note") -> bytes:
    return SdocxBuilder(
        title=title,
        body="Photo here:\n\ufffc",
        objects=[ObjectDescriptor.image(media_index=0)],
        media_files={"0@photo.jpg": b"\xff\xd8\xff\xe0" + b"\x00" * 50},
    ).build_bytes()


def _build_audio_note(title: str = "Voice Note") -> bytes:
    return SdocxBuilder(
        title=title,
        body="Audio here:\n\ufffc",
        objects=[ObjectDescriptor.audio(media_index=0, title="Audio")],
        media_files={"0@voice.m4a": b"ftypM4A " + b"\x00" * 50},
    ).build_bytes()


def test_session_text_only_no_assets() -> None:
    session = ConversionSession()
    sdocx_bytes = _build_text_only(title="Simple", body="Plain text content")

    res = session.convert_note("Simple.sdocx", sdocx_bytes)
    assert res.status == "success"
    assert res.error_code is None
    assert res.asset_count == 0
    assert res.warnings == ()
    assert res.markdown_name == "Simple.md"

    zip_bytes, outcome = session.finish()
    assert outcome.total == 1
    assert outcome.succeeded == 1
    assert outcome.failed == 0

    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        names = zf.namelist()
        assert names == ["Simple.md"]
        assert "Simple_Assets/" not in names
        assert any("Assets" in n for n in names) is False


def test_session_image_and_audio_notes() -> None:
    session = ConversionSession()
    img_bytes = _build_image_note(title="Photo Note")
    aud_bytes = _build_audio_note(title="Voice Note")

    res_img = session.convert_note("Photo Note.sdocx", img_bytes)
    assert res_img.status == "success"
    assert res_img.asset_count == 1

    res_aud = session.convert_note("Voice Note.sdocx", aud_bytes)
    assert res_aud.status == "success"
    assert res_aud.asset_count == 1

    zip_bytes, outcome = session.finish()
    assert outcome.total == 2
    assert outcome.succeeded == 2
    assert outcome.failed == 0

    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        names = zf.namelist()
        assert "Photo Note.md" in names
        assert any(n.startswith("Photo Note_Assets/") for n in names)
        assert "Voice Note.md" in names
        assert any(n.startswith("Voice Note_Assets/") for n in names)


def test_session_name_collision_resolution() -> None:
    session = ConversionSession()
    bytes1 = _build_image_note(title="Same Title")
    bytes2 = _build_image_note(title="Same Title")

    res1 = session.convert_note("Same Title.sdocx", bytes1)
    res2 = session.convert_note("Same Title.sdocx", bytes2)

    assert res1.status == "success"
    assert res1.markdown_name == "Same Title.md"

    assert res2.status == "success"
    assert res2.markdown_name == "Same Title (1).md"

    zip_bytes, outcome = session.finish()
    assert outcome.succeeded == 2

    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        names = zf.namelist()
        assert "Same Title.md" in names
        assert "Same Title (1).md" in names
        assert any(n.startswith("Same Title_Assets/") for n in names)
        assert any(n.startswith("Same Title (1)_Assets/") for n in names)


def test_session_corrupt_bytes_returns_failure_without_raising() -> None:
    session = ConversionSession()
    corrupt_bytes = b"not a zip file at all"

    res = session.convert_note("Corrupt.sdocx", corrupt_bytes)
    assert res.status == "failed"
    assert res.error_code == "CORRUPT_ARCHIVE"
    assert res.message == "This file is not a valid or complete Samsung Notes .sdocx archive."
    assert res.markdown_name is None
    assert res.asset_count == 0

    zip_bytes, outcome = session.finish()
    assert outcome.total == 1
    assert outcome.succeeded == 0
    assert outcome.failed == 1


def test_session_over_limit_rejected_before_reading() -> None:
    strict_limits = LimitsProfile(
        max_entries=10,
        max_entry_size=1000,
        max_total_size=5000,
        max_ratio=10.0,
        ratio_threshold=100,
        max_file_size=1000,
        max_session_bytes=2000,
        max_session_files=2,
    )
    session = ConversionSession(limits=strict_limits)

    # 1. Individual file exceeds max_file_size
    large_bytes = b"x" * 1500
    res1 = session.convert_note("TooLarge.sdocx", large_bytes)
    assert res1.status == "failed"
    assert res1.error_code == "UNSAFE_ARCHIVE"
    assert res1.message == (
        "This file exceeds the safety limits of this tool or contains invalid paths."
    )

    # 2. File count cap
    small_bytes = _build_text_only(title="Note 1")
    small_bytes2 = _build_text_only(title="Note 2")
    small_bytes3 = _build_text_only(title="Note 3")

    r1 = session.convert_note("Note1.sdocx", small_bytes)
    assert r1.status == "success"
    r2 = session.convert_note("Note2.sdocx", small_bytes2)
    assert r2.status == "success"

    # Exceeds max_session_files (limit is 2)
    r3 = session.convert_note("Note3.sdocx", small_bytes3)
    assert r3.status == "failed"
    assert r3.error_code == "UNSAFE_ARCHIVE"


def test_session_abort_removes_data() -> None:
    session = ConversionSession()
    work_dir = session.work_dir
    assert work_dir.exists()

    sdocx_bytes = _build_text_only(title="Test")
    session.convert_note("Test.sdocx", sdocx_bytes)

    session.abort()
    assert not work_dir.exists()

    # Operations after abort raise RuntimeError
    with pytest.raises(RuntimeError):
        session.convert_note("Test2.sdocx", sdocx_bytes)
    with pytest.raises(RuntimeError):
        session.finish()


def test_session_lifecycle_errors() -> None:
    session = ConversionSession()
    sdocx_bytes = _build_text_only(title="Test")
    session.convert_note("Test.sdocx", sdocx_bytes)

    session.finish()

    # Convert after finish
    with pytest.raises(RuntimeError):
        session.convert_note("Another.sdocx", sdocx_bytes)

    # Finish twice
    with pytest.raises(RuntimeError):
        session.finish()
