"""Smoke test for package import and version."""
from __future__ import annotations

import sdocx2obsidian


def test_package_import_exposes_non_empty_version() -> None:
    """Package imports successfully and exposes a non-empty __version__ string."""
    assert hasattr(sdocx2obsidian, "__version__")
    assert isinstance(sdocx2obsidian.__version__, str)
    assert len(sdocx2obsidian.__version__) > 0
