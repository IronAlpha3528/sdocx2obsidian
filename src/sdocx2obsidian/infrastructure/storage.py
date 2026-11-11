"""Storage repository managing destinations, collision resolution, and atomic writes."""
from __future__ import annotations

import shutil
import uuid
from collections.abc import Mapping
from pathlib import Path

from sdocx2obsidian.domain.exceptions import DestinationError, PersistError
from sdocx2obsidian.domain.models import TargetPaths
from sdocx2obsidian.domain.naming import (
    build_asset_dir_name,
    build_versioned_stem,
    sanitize_note_stem,
)
from sdocx2obsidian.domain.protocols import IStorageRepository


def _verify_targets_free(paths: TargetPaths, has_assets: bool) -> None:
    parent = paths.md_path.parent
    if not parent.exists():
        return
    existing = {p.name.casefold() for p in parent.iterdir()}
    if paths.md_path.name.casefold() in existing:
        raise PersistError(f"Target markdown file already exists: {paths.md_path}")
    if has_assets and paths.assets_dir.name.casefold() in existing:
        raise PersistError(f"Target assets directory already exists: {paths.assets_dir}")


def _write_staging(
    staging_dir: Path,
    paths: TargetPaths,
    markdown: str,
    assets: Mapping[str, bytes],
) -> tuple[Path, Path | None]:
    staging_md = staging_dir / paths.md_path.name
    staging_md.write_bytes(markdown.encode("utf-8"))
    staging_assets: Path | None = None
    if assets:
        staging_assets = staging_dir / paths.assets_dir.name
        staging_assets.mkdir(parents=True, exist_ok=True)
        for name, data in assets.items():
            (staging_assets / name).write_bytes(data)
    return staging_md, staging_assets


def _commit_staged(
    staging_md: Path,
    staging_assets: Path | None,
    paths: TargetPaths,
) -> None:
    assets_moved = False
    try:
        if staging_assets is not None:
            shutil.move(staging_assets, paths.assets_dir)
            assets_moved = True
        shutil.move(staging_md, paths.md_path)
    except Exception as exc:
        if assets_moved and paths.assets_dir.exists():
            shutil.rmtree(paths.assets_dir, ignore_errors=True)
        raise PersistError(f"Failed to commit output files: {exc}", cause=exc) from exc


class StorageRepository(IStorageRepository):
    """Filesystem repository for destination preparation, path resolution, and atomic writes."""

    def prepare(self, dest_dir: Path) -> None:
        """Create destination directory and verify write access via probe file."""
        try:
            if dest_dir.exists() and not dest_dir.is_dir():
                raise DestinationError(f"Destination path is not a directory: {dest_dir}")
            dest_dir.mkdir(parents=True, exist_ok=True)
            probe = dest_dir / f".sdocx2obsidian-probe-{uuid.uuid4().hex}"
            probe.write_bytes(b"")
            probe.unlink(missing_ok=True)
        except DestinationError:
            raise
        except OSError as exc:
            raise DestinationError(
                f"Failed to prepare destination directory '{dest_dir}': {exc}",
                cause=exc,
            ) from exc

    def resolve_target_paths(self, dest_dir: Path, note_name: str) -> TargetPaths:
        """Resolve collision-free Markdown file and asset directory paths."""
        existing: set[str] = set()
        if dest_dir.exists() and dest_dir.is_dir():
            try:
                existing = {p.name.casefold() for p in dest_dir.iterdir()}
            except OSError:
                existing = set()

        base_stem = sanitize_note_stem(note_name, fallback="Untitled")
        version = 0
        while True:
            stem = base_stem if version == 0 else build_versioned_stem(base_stem, version)
            md_name = f"{stem}.md"
            asset_name = build_asset_dir_name(stem)
            if md_name.casefold() not in existing and asset_name.casefold() not in existing:
                return TargetPaths(
                    note_stem=stem,
                    md_path=dest_dir / md_name,
                    assets_dir=dest_dir / asset_name,
                    assets_dir_name=asset_name,
                )
            version += 1

    def persist(
        self,
        paths: TargetPaths,
        markdown: str,
        assets: Mapping[str, bytes],
    ) -> None:
        """Persist Markdown and assets atomically via staging directory."""
        staging_dir = paths.md_path.parent / f".sdocx2obsidian-staging-{uuid.uuid4().hex}"
        try:
            staging_dir.mkdir(parents=True, exist_ok=True)
            staging_md, staging_assets = _write_staging(staging_dir, paths, markdown, assets)
            _verify_targets_free(paths, bool(assets))
            _commit_staged(staging_md, staging_assets, paths)
        except PersistError:
            raise
        except OSError as exc:
            raise PersistError(f"I/O error persisting note: {exc}", cause=exc) from exc
        finally:
            if staging_dir.exists():
                shutil.rmtree(staging_dir, ignore_errors=True)
