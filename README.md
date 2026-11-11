# sdocx2obsidian

A robust Python 3.11+ CLI tool that batch-converts Samsung Notes `.sdocx` exported archives into Obsidian Markdown with native wikilink media embeds.

---

## Features

- **Sequential Document Fidelity:** Images and attached audio recordings appear in the exact visual order and position relative to text where they were inserted in the original note.
- **Voice Recording Support:** Unreferenced audio clips (recordings captured directly inside Samsung Notes) are recognized and placed at the top of the converted note.
- **Full Emoji & Unicode Preservation:** Native support for standard Unicode emojis (including multi-codepoint sequences with Zero Width Joiner `\u200D` and Variation Selectors `\uFE0F`), symbols, and non-Latin scripts.
- **Clean Vault Rule:** Notes containing only text never create empty asset subdirectories.
- **Collision-Safe & Deterministic:** Automatically resolves naming collisions without overwriting existing vault notes by appending version numbers (e.g. `Note (1).md` and `Note (1)_Assets/`), updating all internal links accordingly.
- **Atomic File Operations:** Uses hidden staging directories during writes so that a visible Markdown file guarantees all its referenced assets are present. If a failure occurs mid-write, partial outputs are rolled back cleanly.
- **Strict Read-Only Sources:** Source `.sdocx` archives are treated as immutable; file contents and modification timestamps are never altered.

---

## Scope & Supported Formats

### Supported (In-Scope)
| Category | Supported Elements |
|---|---|
| **Input Archives** | Modern Samsung Notes `.sdocx` (ZIP container format) |
| **Text Content** | Raw plain typed text, Unicode emojis, and paragraph breaks |
| **Raster Images** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` |
| **Audio Recordings** | `.m4a`, `.amr`, `.mp3`, `.wav`, `.ogg` |
| **Obsidian Links** | `![[<NoteStem>_Assets/<Filename>]]` with forward slashes |

### Out of Scope (Ignored / Excluded / Not Implemented)
- **Non-Image Objects & S-Pen Drawings:** Recognition of non-image objects such as S-Pen ink, vector drawings, shapes, canvas stroke data, and `.spi` lasso drawings is not currently implemented; these elements are safely skipped with non-fatal warnings.
- **PDF Attachments & Document Files:** Document attachments and PDF drawings (`.page` files) are excluded from the conversion.
- **Rich Text Styling:** HTML/rich-text formatting tags (bold, italic, colors, tables, checkboxes) are stripped to raw plain text.
- **Metadata Scraping:** Direct Samsung Cloud / AppData scraping, folder structures, tags, or YAML frontmatter.

---

## Installation

Requires **Python 3.11** or newer.

```bash
# Clone the repository
git clone <repo-url>
cd sdocx2obsidian

# Install the package
pip install .
```

For local development with test and quality tools:
```bash
pip install -e ".[dev]"
```

---

## Command-Line Usage

Convert a directory of `.sdocx` files into your Obsidian vault:

```bash
sdocx2obsidian --source /path/to/sdocx_folder --dest /path/to/obsidian_vault
```

Or using short flags:
```bash
sdocx2obsidian -s ./samples -d ./MyVault
```

### Options
- `-s, --source <PATH>`: Directory containing exported `.sdocx` files (required).
- `-d, --dest <PATH>`: Destination directory inside your Obsidian vault (required).
- `-v, --version`: Display the installed version and exit.
- `--help`: Show usage instructions and command options.

### Exit Codes
- `0`: Batch completed successfully. If individual corrupted notes failed during conversion, the batch still finishes, reports failed files with reasons, and exits `0` (per acceptance criteria AC-4).
- `1`: Fatal setup error (e.g. source folder missing, destination directory unwritable, or unexpected crash).
- `2`: Command-line usage error (e.g. missing required flags or invalid option arguments).

---

## Output Structure Example

Given a source note `Meeting Notes_261028_120000.sdocx` containing text and two images:

```text
MyVault/
├── Meeting Notes_261028_120000.md
└── Meeting Notes_261028_120000_Assets/
    ├── diagram.png
    └── whiteboard.jpg
```

Inside `Meeting Notes_261028_120000.md`:
```markdown
Here is the project architecture overview:

![[Meeting Notes_261028_120000_Assets/diagram.png]]

Action items discussed:
Follow up with engineering next week.

![[Meeting Notes_261028_120000_Assets/whiteboard.jpg]]
```

---

## Architecture & Verification

The codebase follows strict architectural layering verified by automated static analysis:

```text
src/sdocx2obsidian/
├── domain/           # Pure value objects, models, and structural protocols
├── core/             # Pure binary parsing, text normalization, and markdown rendering
├── infrastructure/   # Safe zip archive extractor, source scanner, atomic storage
├── application/      # End-to-end conversion orchestration service
└── cli.py            # Typer and Rich presentation composition root
```

### Running the Verification Gate

All code must pass four quality checks:

```bash
# 1. Run all unit and integration tests with branch coverage
pytest

# 2. Strict static type checking
mypy --strict src tests

# 3. Linter and code formatting
ruff check src tests

# 4. Architectural layer and boundary checker
python scripts/check.py
```

