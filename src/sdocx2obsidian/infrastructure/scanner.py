"""Source scanner implementation discovering .sdocx files."""
from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

from sdocx2obsidian.domain.exceptions import SourceError
from sdocx2obsidian.domain.protocols import ISourceScanner


class SourceScanner(ISourceScanner):
    """Discovers .sdocx files in a source directory."""

    def list_sources(self, source_dir: Path) -> Sequence[Path]:
        """Return regular .sdocx files sorted case-insensitively.

        Raises SourceError if the path does not exist, is not a directory,
        or cannot be accessed.
        """
        try:
            if not source_dir.exists():
                raise SourceError(f"Source directory does not exist: {source_dir}")
            if not source_dir.is_dir():
                raise SourceError(f"Source path is not a directory: {source_dir}")

            candidates: list[Path] = []
            for child in source_dir.iterdir():
                if child.name.startswith("."):
                    continue
                if child.is_file() and child.suffix.lower() == ".sdocx":
                    candidates.append(child)

            candidates.sort(key=lambda p: (p.name.casefold(), p.name))
            return tuple(candidates)
        except SourceError:
            raise
        except OSError as exc:
            raise SourceError(
                f"Failed to read source directory {source_dir}: {exc}",
                cause=exc,
            ) from exc
