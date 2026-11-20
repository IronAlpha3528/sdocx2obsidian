"""Smoke test for package import and version."""
from __future__ import annotations

import sdocx2obsidian


def test_package_import_exposes_non_empty_version() -> None:
    """Package imports successfully and exposes a non-empty __version__ string."""
    assert hasattr(sdocx2obsidian, "__version__")
    assert isinstance(sdocx2obsidian.__version__, str)
    assert len(sdocx2obsidian.__version__) > 0


def test_package_core_modules_independent_of_cli() -> None:
    """Core, domain, infrastructure, and application modules can be instantiated independently."""
    from sdocx2obsidian.core.parser import NoteParser
    from sdocx2obsidian.core.renderer import MarkdownRenderer
    from sdocx2obsidian.domain.limits import WEB_LIMITS
    from sdocx2obsidian.infrastructure.extractor import ArchiveExtractor
    from sdocx2obsidian.infrastructure.storage import StorageRepository

    extractor = ArchiveExtractor(limits=WEB_LIMITS)
    parser = NoteParser(limits=WEB_LIMITS)
    renderer = MarkdownRenderer()
    storage = StorageRepository()
    assert extractor._limits == WEB_LIMITS
    assert parser._limits == WEB_LIMITS
    assert renderer is not None
    assert storage is not None


def test_cli_missing_typer_prints_hint() -> None:
    """When CLI dependencies are missing, importing cli.py prints an install hint and exits 1."""
    import subprocess
    import sys

    cmd = [
        sys.executable,
        "-c",
        "import sys; sys.modules['typer'] = None; "
        "import sdocx2obsidian.cli",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=False)  # noqa: S603
    assert res.returncode == 1
    assert (
        "CLI dependencies are not installed. Install them with: pip install 'sdocx2obsidian[cli]'"
        in res.stderr
    )

