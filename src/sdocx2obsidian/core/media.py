"""Media catalog construction, prefix stripping, and deterministic collision resolution."""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from sdocx2obsidian.domain.models import MediaKind
from sdocx2obsidian.domain.naming import (
    classify_extension,
    sanitize_media_filename,
)


@dataclass(frozen=True, slots=True)
class MediaEntry:
    """Descriptor of an extracted media item."""

    index: int
    entry_name: str
    output_name: str
    kind: MediaKind
    data: bytes


def _parse_entry_index(name: str) -> int | None:
    at_idx = name.find("@")
    if at_idx > 0 and name[:at_idx].isdigit():
        return int(name[:at_idx])
    return None


def _derive_output_name(entry_name: str, index: int) -> str:
    fallback = f"media-{index}"
    return sanitize_media_filename(entry_name, fallback=fallback)


def _resolve_duplicates(
    entries: list[tuple[int, str, str, MediaKind, bytes]],
) -> dict[int, MediaEntry]:
    used_names: set[str] = set()
    result: dict[int, MediaEntry] = {}
    for idx, entry_name, out_name, kind, data in entries:
        final_name = out_name
        if final_name in used_names:
            dot_idx = final_name.rfind(".")
            if dot_idx != -1:
                final_name = f"{final_name[:dot_idx]}_{idx}{final_name[dot_idx:]}"
            else:
                final_name = f"{final_name}_{idx}"
        used_names.add(final_name)
        result[idx] = MediaEntry(
            index=idx,
            entry_name=entry_name,
            output_name=final_name,
            kind=kind,
            data=data,
        )
    return result


def build_media_catalog(
    media: Mapping[str, bytes],
) -> tuple[dict[int, MediaEntry], tuple[str, ...]]:
    """Build indexed media catalog and warning log from archive media mapping."""
    warnings: list[str] = []
    candidates: list[tuple[int, str, str, MediaKind, bytes]] = []

    for entry_name in sorted(media.keys()):
        idx = _parse_entry_index(entry_name)
        if idx is None:
            warnings.append(f"Media entry '{entry_name}' lacks decimal index prefix; skipped.")
            continue

        dot_idx = entry_name.rfind(".")
        ext = entry_name[dot_idx:] if dot_idx != -1 else ""
        kind = classify_extension(ext)
        if kind is None:
            msg = f"Media entry '{entry_name}' has unsupported extension '{ext}'; skipped."
            warnings.append(msg)
            continue

        out_name = _derive_output_name(entry_name, idx)
        candidates.append((idx, entry_name, out_name, kind, media[entry_name]))

    candidates.sort(key=lambda c: c[0])
    catalog = _resolve_duplicates(candidates)
    return catalog, tuple(warnings)
