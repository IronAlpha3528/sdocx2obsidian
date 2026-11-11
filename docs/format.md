# .sdocx Format Evidence Log

The normative format description used by the code is in `docs/dds.md` (format section). This file records evidence and open questions. Update it only through the `spike` workflow.

## Samples analyzed
| Id | Content | Result |
|---|---|---|
| S1 | Title, typed text, 1 image, 1 attached audio file, 1 voice recording (single page group of 4 pages) | All structures decoded |
| S2 | Title, typed text, 2 images, 1 attached audio file | All structures decoded |

## Verified (both samples)
- Container is a ZIP; media entries are named `<index>@<original name>`.
- `mediaInfo.dat` lists media with a SHA-256 hash; hashes match the media bytes.
- Title and body are length-prefixed UTF-16LE records inside `note.note`.
- Inline objects are marked in the body by U+FFFC; paragraphs are separated by `\n`.
- Image objects carry their media index; attached-audio objects carry index, display title, duration text, and their own text offset.
- Voice recordings have media files but no inline placeholder.

## Unverified / open
- Object order in the file equals placeholder order when objects are moved after creation (needs a reordered sample).
- Notes with empty title, empty body, or only media.
- Other object types (PDF/file attachments, stickers, drawings, tables, checklists).
- Formatted text (bold, headings), emoji, right-to-left and non-Latin text.
- Notes with many pages or very long text; other Samsung Notes versions.
