"""Unit tests for storage prepare operation in infrastructure/storage.py."""
from __future__ import annotations

from pathlib import Path

import pytest

from sdocx2obsidian.domain.exceptions import DestinationError
from sdocx2obsidian.infrastructure.storage import StorageRepository


def test_storage_prepare_creates_missing_nested_dir(tmp_path: Path) -> None:
    """Prepare creates nested non-existent directory."""
    dest = tmp_path / "deep" / "nested" / "dest"
    repo = StorageRepository()
    repo.prepare(dest)
    assert dest.is_dir()


def test_storage_prepare_accepts_existing_dir(tmp_path: Path) -> None:
    """Prepare succeeds on already existing directory."""
    dest = tmp_path / "existing"
    dest.mkdir()
    repo = StorageRepository()
    repo.prepare(dest)
    assert dest.is_dir()


def test_storage_prepare_path_is_file_raises_destination_error(tmp_path: Path) -> None:
    """Path that is an existing file raises DestinationError."""
    file_path = tmp_path / "not_a_dir.txt"
    file_path.write_text("file content", encoding="utf-8")
    repo = StorageRepository()
    with pytest.raises(DestinationError) as exc:
        repo.prepare(file_path)
    assert "not a directory" in str(exc.value)


def test_storage_prepare_removes_probe_file(tmp_path: Path) -> None:
    """Probe file used to test writability is cleaned up."""
    dest = tmp_path / "probe_clean"
    repo = StorageRepository()
    repo.prepare(dest)
    assert list(dest.iterdir()) == []


def test_storage_prepare_os_error_wrapped_in_destination_error(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """OS errors during directory creation or probe write are wrapped with cause."""
    dest = tmp_path / "fail_dir"

    def _failing_mkdir(self: Path, *args: object, **kwargs: object) -> None:
        raise PermissionError("Access denied")

    monkeypatch.setattr(Path, "mkdir", _failing_mkdir)
    repo = StorageRepository()
    with pytest.raises(DestinationError) as exc:
        repo.prepare(dest)
    assert "Access denied" in str(exc.value)
    assert isinstance(exc.value.cause, PermissionError)

