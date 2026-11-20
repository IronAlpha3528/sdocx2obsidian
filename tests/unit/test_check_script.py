"""Tests verifying architecture rules in scripts/check.py for the web layer."""
from __future__ import annotations

import ast
from pathlib import Path

from scripts.check import ALLOWED_INTERNAL, check_imports


def test_internal_layers_cannot_import_web() -> None:
    for layer in ("domain", "core", "infrastructure", "application"):
        assert "web" not in ALLOWED_INTERNAL.get(layer, set())


def test_web_layer_allowed_internal_imports() -> None:
    web_allowed = ALLOWED_INTERNAL.get("web", set())
    assert "domain" in web_allowed
    assert "core" in web_allowed
    assert "infrastructure" in web_allowed
    assert "application" in web_allowed
    assert "web" in web_allowed


def test_check_imports_rejects_typer_and_rich_in_web(tmp_path: Path) -> None:
    fake_web_file = tmp_path / "adapter.py"
    tree_typer = ast.parse("import typer")
    errs = check_imports(fake_web_file, "web", tree_typer)
    assert any("third-party import 'typer'" in e for e in errs)

    tree_rich = ast.parse("from rich.console import Console")
    errs_rich = check_imports(fake_web_file, "web", tree_rich)
    assert any("third-party import 'rich'" in e for e in errs_rich)


def test_check_imports_rejects_internal_layer_importing_web(tmp_path: Path) -> None:
    fake_core_file = tmp_path / "reader.py"
    tree = ast.parse("import sdocx2obsidian.web.adapter")
    errs = check_imports(fake_core_file, "core", tree)
    assert any("core/ must not import sdocx2obsidian.web.adapter" in e for e in errs)
