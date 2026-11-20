"""Note parsing and block orchestration implementing INoteParser."""
from __future__ import annotations

from sdocx2obsidian.core.media import MediaEntry, build_media_catalog
from sdocx2obsidian.core.records import RawObjectRecord, read_records
from sdocx2obsidian.core.text import normalize_text_segment
from sdocx2obsidian.domain.exceptions import MalformedNoteError
from sdocx2obsidian.domain.limits import DEFAULT_LIMITS, LimitsProfile
from sdocx2obsidian.domain.models import (
    ContentBlock,
    MediaBlock,
    MediaKind,
    ParsedNote,
    SdocxArchive,
    TextBlock,
)


class NoteParser:
    """Orchestrates parsing of binary note and media into structured ParsedNote."""

    def __init__(self, limits: LimitsProfile = DEFAULT_LIMITS) -> None:
        self._limits = limits

    def _check_record_caps(self, object_count: int, placeholder_count: int) -> None:
        if self._limits.max_objects is not None and object_count > self._limits.max_objects:
            raise MalformedNoteError(
                f"Note object count exceeds limit ({object_count} > {self._limits.max_objects})"
            )
        if (
            self._limits.max_placeholders is not None
            and placeholder_count > self._limits.max_placeholders
        ):
            raise MalformedNoteError(
                f"Note placeholder count exceeds limit "
                f"({placeholder_count} > {self._limits.max_placeholders})"
            )

    def parse(self, archive: SdocxArchive) -> ParsedNote:
        """Parse raw SdocxArchive into a ParsedNote."""
        if len(archive.note_bytes) < 38:
            raise MalformedNoteError("Note bytes too short to contain required structures")

        catalog, cat_warn = build_media_catalog(archive.media)
        records = read_records(archive.note_bytes)
        self._check_record_caps(len(records.objects), len(records.placeholder_offsets))

        referenced_indices: set[int] = set()
        media_slots, extra_media, obj_warn = self._process_objects(
            records.objects,
            len(records.placeholder_offsets),
            records.placeholder_offsets,
            catalog,
            referenced_indices,
        )

        voice_blocks = self._extract_voice_recordings(catalog, referenced_indices)
        body_blocks = self._assemble_body_blocks(records.body, media_slots)
        all_blocks = (*voice_blocks, *body_blocks, *extra_media)

        unref_warn = self._warn_unreferenced_images(catalog, referenced_indices)
        all_warnings = (*cat_warn, *records.warnings, *obj_warn, *unref_warn)
        asset_entries = self._collect_asset_entries(all_blocks, catalog)
        assets = {b.filename: catalog[idx].data for idx, b in asset_entries}

        return ParsedNote(
            title=records.title,
            blocks=all_blocks,
            assets=assets,
            warnings=all_warnings,
        )

    def _extract_voice_recordings(
        self,
        catalog: dict[int, MediaEntry],
        referenced: set[int],
    ) -> list[MediaBlock]:
        voice: list[MediaBlock] = []
        for idx in sorted(catalog.keys()):
            entry = catalog[idx]
            if entry.kind == MediaKind.AUDIO and idx not in referenced:
                voice.append(MediaBlock(filename=entry.output_name, kind=entry.kind))
                referenced.add(idx)
        return voice

    def _process_objects(
        self,
        objects: tuple[RawObjectRecord, ...],
        num_placeholders: int,
        ph_offsets: tuple[int, ...],
        catalog: dict[int, MediaEntry],
        referenced: set[int],
    ) -> tuple[list[MediaBlock | None], list[MediaBlock], list[str]]:
        warnings: list[str] = []
        paired_count = min(len(objects), num_placeholders)
        slots: list[MediaBlock | None] = []

        for i in range(paired_count):
            obj = objects[i]
            block, warn = self._resolve_object_slot(obj, catalog, referenced)
            if warn:
                warnings.append(warn)
            slots.append(block)

        if num_placeholders > len(objects):
            diff = num_placeholders - len(objects)
            warnings.append(f"{diff} placeholder(s) without matching object dropped.")
            for _ in range(diff):
                slots.append(None)

        extra_blocks: list[MediaBlock] = []
        for i in range(paired_count, len(objects)):
            block, warn = self._resolve_object_slot(objects[i], catalog, referenced)
            if block:
                extra_blocks.append(block)
                warnings.append(f"Object without placeholder appended: {block.filename}")
            elif warn:
                warnings.append(warn)

        return slots, extra_blocks, warnings

    def _resolve_object_slot(
        self,
        obj: RawObjectRecord,
        catalog: dict[int, MediaEntry],
        referenced: set[int],
    ) -> tuple[MediaBlock | None, str | None]:
        if obj.kind == "unsupported":
            return None, "Unsupported object at placeholder skipped."
        if obj.media_index is None or obj.media_index not in catalog:
            return None, f"Object referenced media index {obj.media_index} not in catalog."
        idx = obj.media_index
        if idx in referenced:
            return None, f"Duplicate reference to media index {idx} dropped."
        referenced.add(idx)
        entry = catalog[idx]
        return MediaBlock(filename=entry.output_name, kind=entry.kind), None

    def _append_text_block(self, blocks: list[ContentBlock], text: str) -> None:
        if blocks and isinstance(blocks[-1], TextBlock):
            combined = f"{blocks[-1].text}\n\n{text}"
            clean = normalize_text_segment(combined)
            if clean is not None:
                blocks[-1] = TextBlock(text=clean)
        else:
            blocks.append(TextBlock(text=text))

    def _assemble_body_blocks(
        self,
        body: str,
        media_slots: list[MediaBlock | None],
    ) -> list[ContentBlock]:
        segments = body.split("\ufffc")
        blocks: list[ContentBlock] = []
        for i, segment in enumerate(segments):
            clean_text = normalize_text_segment(segment)
            if clean_text is not None:
                self._append_text_block(blocks, clean_text)
            if i < len(media_slots) and media_slots[i] is not None:
                blocks.append(media_slots[i])  # type: ignore[arg-type]
        return blocks

    def _warn_unreferenced_images(
        self,
        catalog: dict[int, MediaEntry],
        referenced: set[int],
    ) -> list[str]:
        warnings: list[str] = []
        for idx, entry in catalog.items():
            if entry.kind == MediaKind.IMAGE and idx not in referenced:
                warnings.append(f"Unreferenced image '{entry.output_name}' not exported.")
        return warnings

    def _collect_asset_entries(
        self,
        blocks: tuple[ContentBlock, ...],
        catalog: dict[int, MediaEntry],
    ) -> list[tuple[int, MediaBlock]]:
        results: list[tuple[int, MediaBlock]] = []
        for b in blocks:
            if isinstance(b, MediaBlock):
                idx = next(i for i, e in catalog.items() if e.output_name == b.filename)
                results.append((idx, b))
        return results
