# sdocx2obsidian — Frontend Design System

This document specifies the design tokens, component architecture, state machine interactions, and copywriting rules for the `site/` presentation layer per `docs/frontend-redesign-brief.md`.

---

## 1. Design Tokens

### Color Palette & Computed WCAG Contrast Ratios
| Token | Hex Value | Role | Contrast on White | WCAG Level |
|---|---|---|:---:|:---:|
| **Ink** | `#14202B` | Primary text and headings | 16.57 : 1 | **AAA** |
| **Slate** | `#5B6877` | Secondary text, file sizes, limits | 5.69 : 1 | **AA** |
| **Surface** | `#FFFFFF` | Panels, modals, elevated surfaces | — | — |
| **Canvas** | `#F5F7F9` | Page background, drop area base | 15.62 : 1 (Ink) | **AAA** |
| **Line** | `#DCE2E8` | Borders, dividers, subtle outlines | 1.25 : 1 | Structural |
| **Accent** | `#0B7A75` | Primary action button, links, focus ring | 5.28 : 1 (on white) / 5.28 : 1 (white text on accent) | **AA** |
| **Accent Hover**| `#086761` | Pressed & hover state for primary action | 6.45 : 1 (white text) | **AA** |
| **Accent Tint** | `#E4F4F2` | Drag-over active area, selected states | 14.20 : 1 (Ink) | **AAA** |
| **Success** | `#1E7B45` on `#E8F5EC` | Converted status badge | 4.72 : 1 | **AA** |
| **Warning** | `#7A4F00` on `#FFF4DB` | Converted with notes / advisory badge | 5.81 : 1 | **AA** |
| **Error** | `#B3261E` on `#FDECEA` | Failed status badge | 5.94 : 1 | **AA** |

### Dark Theme Mapping (`prefers-color-scheme: dark`)
- **Canvas:** `#0C1319`
- **Surface:** `#14202B`
- **Line:** `#283645`
- **Ink:** `#F5F7F9`
- **Slate:** `#9BA8B6`
- **Accent:** `#14A099` (hover: `#18B5AD`, tint: `#133838`)
- **Success:** `#4ADE80` on `#052E16`
- **Warning:** `#FBBF24` on `#451A03`
- **Error:** `#F87171` on `#450A0A`

### Typography & Spacing
- **Font Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace Stack:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- **Type Scale:** 1.25 scale (16px base):
  - H1: `clamp(2rem, 4vw, 2.75rem)` (32–44px)
  - H2: `1.5rem` (24px)
  - H3: `1.125rem` (18px)
  - Body: `1rem` (16px)
  - Small / Chips: `0.875rem` (14px)
- **Grid:** 8px base grid (`8px, 16px, 24px, 32px, 48px`). Page container: 960px. Tool workspace: 720px max.
- **Touch Target Minimum:** All interactive elements maintain $\ge 44 \times 44 \text{ px}$ target boundaries.

---

## 2. Interaction Flow & Screens

- **S1 (Idle):**
  - Minimal header with text wordmark and anchor links to "How it works" and "Privacy".
  - Centered hero heading: *"Convert Samsung Notes to Obsidian"*.
  - Large drop area with prominent *"Select .sdocx files"* button and quiet *"or drop them here"* hint.
  - Reassuring privacy line directly below: *"Everything happens in your browser. Your notes never leave your device."*
- **S2 (Files Chosen):**
  - Heading: *"Your notes"*.
  - Clean list of chosen `.sdocx` notes showing filename (middle-truncated if long), size, and remove button (`[×]`).
  - Action row with *"Add more files"* button and summary counter (`X files, Y MB`).
  - Single prominent primary action: *"Convert to Markdown"*.
  - Quiet limits note below button: *"Up to 5 files, 50 MB each."*
  - **Large File Confirmation Modal:** If any selected file is $\ge 25\text{ MB}$, clicking *"Convert to Markdown"* prompts the user with the Mobile Memory Advisory dialog to confirm or cancel.
- **S3 (Converting):**
  - Heading: *"Converting your notes"*.
  - Smooth progress bar with percentage counter.
  - Per-note row showing status: `Waiting`, `Converting...`, `Converted`, or error.
  - *"Cancel"* button always available.
- **S4 (Done):**
  - Heading: *"Your notes are ready"*.
  - Large primary action: *"Download ZIP"*.
  - Per-note outcomes list with expandable notes for any warnings or errors.
  - Import tip: *"Unzip the folder into your Obsidian vault. Images and audio appear inside each note."*
  - Tertiary action link: *"Convert more notes"* (resets back to S1).

---

## 3. Copywriting Rules

- **Sentence Case:** Always use sentence case for headings and buttons (e.g. *"Convert to Markdown"*, not *"Convert To Markdown"*).
- **Plain Verbs:** Use direct action verbs (Select, Convert, Download, Add, Cancel, Remove).
- **No Technical Jargon:** Never expose "WASM", "Pyodide", "Web Worker", "ArrayBuffer", or internal class names in visitor-facing copy.
- **Constructive Errors:** Error messages must clearly state what happened and provide a single actionable next step.
