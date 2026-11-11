"""Integration tests against real .sdocx samples in samples/ directory."""
from __future__ import annotations

from pathlib import Path

import pytest

SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent / "samples"
REAL_SAMPLES = sorted(SAMPLES_DIR.glob("*.sdocx")) if SAMPLES_DIR.exists() else []

pytestmark = [
    pytest.mark.real_samples,
    pytest.mark.skipif(
        not REAL_SAMPLES,
        reason="No real .sdocx samples found in samples/ directory",
    ),
]


def test_real_samples_discovery() -> None:
    """Verify that real sample files in samples/ can be discovered."""
    assert len(REAL_SAMPLES) >= 2
    filenames = [p.name for p in REAL_SAMPLES]
    assert any("Hello world" in name for name in filenames)
    assert any("Yolo" in name for name in filenames)
