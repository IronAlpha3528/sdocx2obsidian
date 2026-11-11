"""Domain models and value objects."""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class MediaKind(Enum):
    """Category of an exported media file."""

    IMAGE = "image"
    AUDIO = "audio"


class OutcomeStatus(Enum):
    """Result of converting one note file."""

    SUCCEEDED = "succeeded"
    FAILED = "failed"


@dataclass(frozen=True, slots=True)
class SdocxArchive:
    """Raw content read from one .sdocx archive."""

    source_name: str
    note_bytes: bytes
    media: Mapping[str, bytes]


@dataclass(frozen=True, slots=True)
class TextBlock:
    """Plain text block, normalized and non-empty."""

    text: str


@dataclass(frozen=True, slots=True)
class MediaBlock:
    """Inline media block referencing an extracted file."""

    filename: str
    kind: MediaKind


ContentBlock = TextBlock | MediaBlock


@dataclass(frozen=True, slots=True)
class ParsedNote:
    """Decoded note content and assets."""

    title: str
    blocks: tuple[ContentBlock, ...]
    assets: Mapping[str, bytes]
    warnings: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class TargetPaths:
    """Collision-resolved output paths for a note."""

    note_stem: str
    md_path: Path
    assets_dir: Path
    assets_dir_name: str


@dataclass(frozen=True, slots=True)
class ConversionOutcome:
    """Per-file outcome of a note conversion."""

    source: Path
    status: OutcomeStatus
    markdown_path: Path | None
    asset_count: int
    warnings: tuple[str, ...]
    error: str | None


@dataclass(frozen=True, slots=True)
class BatchResult:
    """Summary of batch conversion outcomes."""

    outcomes: tuple[ConversionOutcome, ...]
    total: int
    succeeded: int
    failed: int

