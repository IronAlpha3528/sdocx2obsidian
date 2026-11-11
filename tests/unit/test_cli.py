"""Unit tests for CLI interface in cli.py using typer CliRunner."""
from __future__ import annotations

from pathlib import Path

import pytest
from tests.helpers.builder import create_s1_synthetic, create_s2_synthetic
from typer.testing import CliRunner

from sdocx2obsidian import __version__
from sdocx2obsidian.cli import app

runner = CliRunner()


def test_cli_help() -> None:
    """--help prints usage information and exits with code 0."""
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "Usage:" in result.output or "sdocx2obsidian" in result.output
    assert "--source" in result.output
    assert "--dest" in result.output


def test_cli_version() -> None:
    """--version prints package version and exits with code 0."""
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_cli_missing_source_exits_2(tmp_path: Path) -> None:
    """Missing required --source option exits with code 2."""
    dest = tmp_path / "dest"
    result = runner.invoke(app, ["-d", str(dest)])
    assert result.exit_code == 2
    assert "Missing option" in result.output or "source" in result.output.lower()


def test_cli_missing_dest_exits_2(tmp_path: Path) -> None:
    """Missing required --dest option exits with code 2."""
    source = tmp_path / "source"
    result = runner.invoke(app, ["-s", str(source)])
    assert result.exit_code == 2
    assert "Missing option" in result.output or "dest" in result.output.lower()


def test_cli_no_sdocx_files_in_source_prints_notice_exits_0(tmp_path: Path) -> None:
    """Empty source folder prints notice and exits with code 0."""
    source = tmp_path / "empty_source"
    source.mkdir()
    dest = tmp_path / "dest"

    result = runner.invoke(app, ["-s", str(source), "-d", str(dest)])
    assert result.exit_code == 0
    assert "No .sdocx files found" in result.output


def test_cli_fatal_source_error_exits_1(tmp_path: Path) -> None:
    """Non-existent source folder causes SourceError and exits with code 1."""
    missing_source = tmp_path / "nonexistent"
    dest = tmp_path / "dest"

    result = runner.invoke(app, ["-s", str(missing_source), "-d", str(dest)])
    assert result.exit_code == 1
    assert "[ERROR]" in result.output
    assert "Source error" in result.output


def test_cli_fatal_destination_error_exits_1(tmp_path: Path) -> None:
    """Destination path that is an existing file causes DestinationError and exits 1."""
    source = tmp_path / "source"
    source.mkdir()
    file_dest = tmp_path / "already_a_file.txt"
    file_dest.write_text("existing", encoding="utf-8")

    result = runner.invoke(app, ["-s", str(source), "-d", str(file_dest)])
    assert result.exit_code == 1
    assert "[ERROR]" in result.output
    assert "Destination error" in result.output


def test_cli_happy_path_synthetic_notes(tmp_path: Path) -> None:
    """Happy path converts synthetic notes end to end, prints summary, and exits 0."""
    source = tmp_path / "source"
    source.mkdir()
    dest = tmp_path / "dest"

    (source / "Hello world.sdocx").write_bytes(create_s1_synthetic())
    (source / "Yolo.sdocx").write_bytes(create_s2_synthetic())

    result = runner.invoke(app, ["-s", str(source), "-d", str(dest)])
    assert result.exit_code == 0

    assert "[OK]   Hello world.sdocx" in result.output
    assert "[OK]   Yolo.sdocx" in result.output
    assert "Total:     2" in result.output
    assert "Succeeded: 2" in result.output
    assert "Failed:    0" in result.output

    assert (dest / "Hello world.md").is_file()
    assert (dest / "Yolo.md").is_file()
    assert (dest / "Hello world_Assets").is_dir()
    assert (dest / "Yolo_Assets").is_dir()


def test_cli_partial_failures_lists_failed_files_and_exits_0(tmp_path: Path) -> None:
    """Batch with valid and corrupted notes lists failed files and exits 0 (AC-4)."""
    source = tmp_path / "source"
    source.mkdir()
    dest = tmp_path / "dest"

    (source / "Valid.sdocx").write_bytes(create_s1_synthetic())
    (source / "Corrupt.sdocx").write_bytes(b"not a valid zip file")

    result = runner.invoke(app, ["-s", str(source), "-d", str(dest)])
    assert result.exit_code == 0

    assert "[OK]   Valid.sdocx" in result.output
    assert "[FAIL] Corrupt.sdocx:" in result.output
    assert "Total:     2" in result.output
    assert "Succeeded: 1" in result.output
    assert "Failed:    1" in result.output
    assert "Failed files:" in result.output
    assert "- Corrupt.sdocx:" in result.output

    assert (dest / "Valid.md").is_file()


def test_main_module_execution() -> None:
    """Running python -m sdocx2obsidian via module import executes properly."""
    import runpy
    import sys
    monkeypatch_argv = ["sdocx2obsidian", "--version"]
    original_argv = sys.argv
    try:
        sys.argv = monkeypatch_argv
        with pytest.raises(SystemExit) as exc:
            runpy.run_module("sdocx2obsidian", run_name="__main__")
        assert exc.value.code == 0
    finally:
        sys.argv = original_argv

