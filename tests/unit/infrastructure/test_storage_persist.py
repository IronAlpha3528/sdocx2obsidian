"""Unit tests for storage persist operation in infrastructure/storage.py."""
from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from sdocx2obsidian.domain.exceptions import PersistError
from sdocx2obsidian.infrastructure.storage import StorageRepository


def test_storage_persist_text_only_creates_no_asset_folder(tmp_path: Path) -> None:
    """Note without assets creates only .md file, no asset folder (T-02)."""
    repo = StorageRepository()
    repo.prepare(tmp_path)
    paths = repo.resolve_target_paths(tmp_path, "TextNote")

    repo.persist(paths, "# Just Text\n\nNo media here.\n", {})

    assert paths.md_path.is_file()
    assert not paths.assets_dir.exists()
    assert paths.md_path.read_text(encoding="utf-8") == "# Just Text\n\nNo media here.\n"


def test_storage_persist_with_assets_creates_folder_and_files(tmp_path: Path) -> None:
    """Note with assets creates folder, assets, and markdown with byte exact content."""
    repo = StorageRepository()
    repo.prepare(tmp_path)
    paths = repo.resolve_target_paths(tmp_path, "MediaNote")
    assets = {
        "photo.jpg": b"\xff\xd8\xff\xe0" + b"\x00" * 50,
        "audio.m4a": b"ftypM4A " + b"\x00" * 100,
    }
    content = "# Media Note\n\n![[MediaNote_Assets/photo.jpg]]\n"

    repo.persist(paths, content, assets)

    assert paths.md_path.is_file()
    assert paths.assets_dir.is_dir()
    assert (paths.assets_dir / "photo.jpg").read_bytes() == assets["photo.jpg"]
    assert (paths.assets_dir / "audio.m4a").read_bytes() == assets["audio.m4a"]
    assert paths.md_path.read_text(encoding="utf-8") == content


def test_storage_persist_utf8_with_lf_newlines(tmp_path: Path) -> None:
    """Markdown is written as UTF-8 bytes with strict \\n newlines."""
    repo = StorageRepository()
    repo.prepare(tmp_path)
    paths = repo.resolve_target_paths(tmp_path, "Utf8Note")
    content = "Title\n\nBody line 1\nLine 2 with \U0001f600\n"

    repo.persist(paths, content, {})

    raw_bytes = paths.md_path.read_bytes()
    assert b"\r" not in raw_bytes
    assert raw_bytes == content.encode("utf-8")


def test_storage_persist_target_appeared_after_resolve_raises_persist_error(
    tmp_path: Path,
) -> None:
    """If target appeared after resolve, PersistError is raised and staging removed."""
    repo = StorageRepository()
    repo.prepare(tmp_path)
    paths = repo.resolve_target_paths(tmp_path, "Concurrent")

    # Simulate concurrent creation
    paths.md_path.write_text("concurrently created", encoding="utf-8")

    with pytest.raises(PersistError) as exc:
        repo.persist(paths, "# Content\n", {})
    assert "already exists" in str(exc.value)

    # Staging must be cleaned up
    staging_dirs = [p for p in tmp_path.iterdir() if p.name.startswith(".sdocx2obsidian-staging-")]
    assert staging_dirs == []


def test_storage_persist_failure_during_asset_write_leaves_destination_clean(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Failure injected during asset writing leaves destination unchanged (T-13)."""
    repo = StorageRepository()
    repo.prepare(tmp_path)
    paths = repo.resolve_target_paths(tmp_path, "FailAsset")

    real_write_bytes = Path.write_bytes

    def _failing_write_bytes(self: Path, data: bytes) -> int:
        if self.suffix == ".png":
            raise OSError("Disk full")
        return real_write_bytes(self, data)

    monkeypatch.setattr(Path, "write_bytes", _failing_write_bytes)

    with pytest.raises(PersistError):
        repo.persist(paths, "# Markdown\n", {"image.png": b"img_data"})

    assert not paths.md_path.exists()
    assert not paths.assets_dir.exists()
    assert list(tmp_path.iterdir()) == []


def test_storage_persist_failure_at_second_move_rolls_back_first(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Failure injected at second move (moving .md) removes moved assets folder."""
    repo = StorageRepository()
    repo.prepare(tmp_path)
    paths = repo.resolve_target_paths(tmp_path, "Rollback")

    real_move = shutil.move
    move_count = 0

    def _failing_move(src: object, dst: object, *args: object, **kwargs: object) -> object:
        nonlocal move_count
        move_count += 1
        if move_count == 2:  # First move is asset dir, second move is markdown file
            raise OSError("Injected move failure")
        return real_move(str(src), str(dst))

    monkeypatch.setattr(shutil, "move", _failing_move)

    with pytest.raises(PersistError) as exc:
        repo.persist(paths, "# Markdown\n", {"image.png": b"data"})
    assert "Injected move failure" in str(exc.value)

    # Neither asset dir nor md file should remain
    assert not paths.assets_dir.exists()
    assert not paths.md_path.exists()
    assert list(tmp_path.iterdir()) == []


def test_storage_persist_staging_directory_always_removed(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Staging directory is guaranteed to be cleaned up on error."""
    repo = StorageRepository()
    repo.prepare(tmp_path)
    paths = repo.resolve_target_paths(tmp_path, "AlwaysClean")

    def _failing_move(src: object, dst: object, *args: object, **kwargs: object) -> object:
        raise OSError("Move failed completely")

    monkeypatch.setattr(shutil, "move", _failing_move)

    with pytest.raises(PersistError):
        repo.persist(paths, "# Content\n", {})

    staging_dirs = [p for p in tmp_path.iterdir() if p.name.startswith(".sdocx2obsidian-staging-")]
    assert staging_dirs == []


def test_storage_persist_assets_dir_collision_raises_persist_error(tmp_path: Path) -> None:
    """If target assets directory appeared after resolve, PersistError is raised."""
    repo = StorageRepository()
    repo.prepare(tmp_path)
    paths = repo.resolve_target_paths(tmp_path, "AssetRace")
    paths.assets_dir.mkdir()

    with pytest.raises(PersistError) as exc:
        repo.persist(paths, "# Content\n", {"img.png": b"data"})
    assert "assets directory already exists" in str(exc.value)


def test_storage_verify_targets_free_missing_parent(tmp_path: Path) -> None:
    """_verify_targets_free returns cleanly if parent directory does not exist."""
    from sdocx2obsidian.domain.models import TargetPaths
    from sdocx2obsidian.infrastructure.storage import _verify_targets_free

    missing_parent = tmp_path / "does_not_exist"
    paths = TargetPaths(
        note_stem="Note",
        md_path=missing_parent / "Note.md",
        assets_dir=missing_parent / "Note_Assets",
        assets_dir_name="Note_Assets",
    )
    _verify_targets_free(paths, False)
