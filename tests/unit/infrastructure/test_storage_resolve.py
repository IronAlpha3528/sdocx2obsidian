"""Unit tests for storage resolve_target_paths operation in infrastructure/storage.py."""
from __future__ import annotations

from pathlib import Path

import pytest

from sdocx2obsidian.domain.naming import MAX_NOTE_STEM_LEN
from sdocx2obsidian.infrastructure.storage import StorageRepository


def test_storage_resolve_free_name_unchanged(tmp_path: Path) -> None:
    """When target name is free, stem is preserved without version suffix."""
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, "My Note")
    assert paths.md_path == tmp_path / "My Note.md"
    assert paths.assets_dir == tmp_path / "My Note_Assets"
    assert paths.assets_dir_name == "My Note_Assets"


def test_storage_resolve_md_exists_gives_v1(tmp_path: Path) -> None:
    """When .md exists, resolved name appends (1)."""
    (tmp_path / "My Note.md").write_text("existing", encoding="utf-8")
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, "My Note")
    assert paths.md_path == tmp_path / "My Note (1).md"
    assert paths.assets_dir == tmp_path / "My Note (1)_Assets"
    assert paths.assets_dir_name == "My Note (1)_Assets"


def test_storage_resolve_folder_only_exists_gives_v1(tmp_path: Path) -> None:
    """When only asset folder exists, resolved name appends (1) (T-12)."""
    (tmp_path / "My Note_Assets").mkdir()
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, "My Note")
    assert paths.md_path == tmp_path / "My Note (1).md"
    assert paths.assets_dir == tmp_path / "My Note (1)_Assets"
    assert paths.assets_dir_name == "My Note (1)_Assets"


def test_storage_resolve_v1_taken_gives_v2(tmp_path: Path) -> None:
    """When base and (1) exist, resolved name appends (2)."""
    (tmp_path / "My Note.md").write_text("v0", encoding="utf-8")
    (tmp_path / "My Note (1).md").write_text("v1", encoding="utf-8")
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, "My Note")
    assert paths.md_path == tmp_path / "My Note (2).md"
    assert paths.assets_dir == tmp_path / "My Note (2)_Assets"
    assert paths.assets_dir_name == "My Note (2)_Assets"


def test_storage_resolve_case_only_difference_counts_as_collision(tmp_path: Path) -> None:
    """Case-insensitive collision check increments version."""
    (tmp_path / "my note.MD").write_text("content", encoding="utf-8")
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, "My Note")
    assert paths.md_path.name == "My Note (1).md"


def test_storage_resolve_case_only_folder_counts_as_collision(tmp_path: Path) -> None:
    """Case-insensitive asset folder presence increments version."""
    (tmp_path / "my note_assets").mkdir()
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, "My Note")
    assert paths.md_path.name == "My Note (1).md"


def test_storage_resolve_sanitizes_banned_characters(tmp_path: Path) -> None:
    """Banned characters are sanitized before collision checking."""
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, "Note? / With: Bad*Chars")
    assert paths.md_path.name == "Note_ _ With_ Bad_Chars.md"


def test_storage_resolve_windows_reserved_names(tmp_path: Path) -> None:
    """Windows reserved device names get trailing underscore."""
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, "CON")
    assert paths.md_path.name == "CON_.md"
    assert paths.assets_dir_name == "CON__Assets"


def test_storage_resolve_long_name_truncated(tmp_path: Path) -> None:
    """Excessively long note stem is truncated to MAX_NOTE_STEM_LEN."""
    long_title = "A" * 200
    repo = StorageRepository()
    paths = repo.resolve_target_paths(tmp_path, long_title)
    expected_stem = "A" * MAX_NOTE_STEM_LEN
    assert paths.md_path.name == f"{expected_stem}.md"


def test_storage_resolve_creates_nothing_on_disk(tmp_path: Path) -> None:
    """resolve_target_paths is purely functional and creates no files or directories."""
    repo = StorageRepository()
    repo.resolve_target_paths(tmp_path, "NonExistent")
    assert list(tmp_path.iterdir()) == []


def test_storage_resolve_missing_or_unreadable_dest_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Missing dest_dir or OSError during iterdir falls back to empty existing set."""
    repo = StorageRepository()
    missing = tmp_path / "missing_dest"
    assert repo.resolve_target_paths(missing, "Note").md_path.name == "Note.md"

    existing_dir = tmp_path / "unreadable"
    existing_dir.mkdir()

    def _raise_oserror(self: Path) -> object:
        raise OSError("Permission denied")

    monkeypatch.setattr(Path, "iterdir", _raise_oserror)
    assert repo.resolve_target_paths(existing_dir, "Note").md_path.name == "Note.md"

