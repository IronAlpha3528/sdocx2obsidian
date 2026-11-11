"""Unit tests for SourceScanner in infrastructure/scanner.py."""
from __future__ import annotations

from pathlib import Path

import pytest

from sdocx2obsidian.domain.exceptions import SourceError
from sdocx2obsidian.infrastructure.scanner import SourceScanner


def test_scanner_lists_sdocx_files_sorted_case_insensitively(tmp_path: Path) -> None:
    """Returns only .sdocx files sorted case-insensitively, non-recursively."""
    (tmp_path / "b.sdocx").write_text("b", encoding="utf-8")
    (tmp_path / "A.sdocx").write_text("a", encoding="utf-8")
    (tmp_path / "C.SDOCX").write_text("c", encoding="utf-8")
    (tmp_path / "other.txt").write_text("txt", encoding="utf-8")
    (tmp_path / ".hidden.sdocx").write_text("h", encoding="utf-8")

    # Subfolder with .sdocx must be ignored (non-recursive)
    sub = tmp_path / "subfolder"
    sub.mkdir()
    (sub / "nested.sdocx").write_text("nested", encoding="utf-8")

    scanner = SourceScanner()
    sources = scanner.list_sources(tmp_path)
    assert len(sources) == 3
    assert [p.name for p in sources] == ["A.sdocx", "b.sdocx", "C.SDOCX"]


def test_scanner_empty_directory_returns_empty_tuple(tmp_path: Path) -> None:
    """Empty folder returns empty sequence without error."""
    scanner = SourceScanner()
    assert scanner.list_sources(tmp_path) == ()


def test_scanner_missing_path_raises_source_error(tmp_path: Path) -> None:
    """Missing path raises SourceError."""
    scanner = SourceScanner()
    with pytest.raises(SourceError):
        scanner.list_sources(tmp_path / "nonexistent")


def test_scanner_path_is_file_raises_source_error(tmp_path: Path) -> None:
    """Path that is a file instead of directory raises SourceError."""
    file_path = tmp_path / "file.txt"
    file_path.write_text("content", encoding="utf-8")
    scanner = SourceScanner()
    with pytest.raises(SourceError):
        scanner.list_sources(file_path)


def test_scanner_os_error_wrapped_in_source_error(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """OS read failure is wrapped in SourceError with cause."""
    def _failing_iterdir(self: Path) -> None:
        raise PermissionError("Access denied")

    monkeypatch.setattr(Path, "iterdir", _failing_iterdir)
    scanner = SourceScanner()
    with pytest.raises(SourceError) as exc_info:
        scanner.list_sources(tmp_path)
    assert "Access denied" in str(exc_info.value)
    assert isinstance(exc_info.value.cause, PermissionError)

