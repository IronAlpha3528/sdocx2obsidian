# UI / UX Specification — sdocx2obsidian Web Frontend

**Document:** `docs/frontend/UI_UX_SPEC.md`  
**Status:** Living Design Specification  
**Authority:** Aligned with `docs/srs.md`, `docs/dds.md`, `docs/web-acceptance.md`, and `docs/frontend/PRODUCT_BRIEF.md`

---

## 1. Information Architecture & Page Layout

Inspired by the direct, single-purpose utility layout of **iLovePDF**, the user interface is structured around a single-page, tool-centric layout. The converter is the undisputed hero of the page, positioned immediately below a lightweight utility header. Supporting documentation, privacy details, and FAQ sections are positioned below the tool fold.

### 1.1 Structural Layout Wireframe

```
+-------------------------------------------------------------------------+
| [Header] Logo / Wordmark (Left)         [GitHub] [Theme Toggle] (Right) |
+-------------------------------------------------------------------------+
|                                                                         |
|                                                                         |
|       +---------------------------------------------------------+       |
|       |                     [TOOL CONTAINER]                    |       |
|       |                                                         |       |
|       |   State 1: Drop Zone / File Picker                      |       |
|       |   State 2: Staged Files & Pre-Flight Review             |       |
|       |   State 3: Live Progress & Sequential Conversion        |       |
|       |   State 4: Download Vault & Integrated Markdown Preview |       |
|       |                                                         |       |
|       +---------------------------------------------------------+       |
|                                                                         |
|                                                                         |
+-------------------------------------------------------------------------+
| [Information Section] (Collapsible Accordion / Structured Cards)        |
| - How It Works & Local Privacy Architecture                             |
| - Obsidian Vault Structure & Wikilink Embedding                         |
| - Format Limits & Known Limitations                                     |
+-------------------------------------------------------------------------+
| [Footer] License & Copyright · Zero Telemetry Notice · GitHub Repo      |
+-------------------------------------------------------------------------+
```

### 1.2 Viewport & Container Constraints
- **Max Tool Container Width:** `768px` (centered horizontally with dynamic auto margins).
- **Page Margin:** `16px` on mobile (`< 640px`), `24px` on tablet (`640px – 1023px`), and `32px` on desktop (`≥ 1024px`).
- **Vertical Spacing:** Generous header-to-tool spacing (`48px` desktop, `24px` mobile) to frame the converter as an elevated workbench.

---

## 2. Header & Navigation Spec

The header is clean, horizontal, and strictly functional without marketing distraction.

1. **Brand Identity (Left):**
   - Wordmark: `sdocx2obsidian` (Monospace or technical sans font).
   - Tag / Badge: `v1.0.0` or `Web` (Subtle chip in theme accent color).
   - Optional Icon: Geometric document-to-markdown glyph.
2. **Action Controls (Right):**
   - **GitHub Repository Link:** Clean SVG Octocat icon linking to `https://github.com/thewh1teagle/sdocx2obsidian` (opens in `_blank` with `rel="noopener noreferrer"`).
   - **Theme Toggle:** Segmented button or toggle icon switching between Dark (default) and Light mode. Persists selection to `localStorage`.
   - **Privacy Shield Pill:** Micro-badge indicating `100% In-Browser · Zero Data Upload`.

---

## 3. The 4-State Converter Workflow

The core converter operates as a strictly sequential finite workflow. Each state transitions smoothly without unexpected full-page layout jumps.

### 3.1 State 1: Idle / Drop Zone (The Landing State)

When the user arrives or resets the session, the tool displays an inviting, high-affordance drop area.

```
+---------------------------------------------------------+
|                                                         |
|                       [ Upload Icon ]                   |
|                                                         |
|             Drag & drop Samsung Notes (.sdocx)          |
|                             or                          |
|                 [ Choose .sdocx Files ]                 |
|                                                         |
|   Max 5 files · Up to 50 MB each · 100 MB total session |
|                                                         |
+---------------------------------------------------------+
```

- **Visual Affordance:**
  - Border: 2px dashed border in subtle purple-slate tone.
  - Background: Deep matte charcoal/black surface with slight elevation.
  - Drag-Over State: Border turns solid accent purple (`#9333ea` / `#a855f7`), background gains subtle tinted fill, text shifts to "Drop files to stage".
- **Trigger Mechanisms:**
  - Hidden native file input: `<input type="file" id="file-input" accept=".sdocx" multiple>`
  - Primary Button: "[ Choose .sdocx Files ]" (prominent high-contrast button).
  - Drag events: `dragenter`, `dragover`, `dragleave`, `drop`.
- **Validation on Drop / Select:**
  - Evaluates file extensions (`.sdocx`). Non-sdocx files are rejected with an immediate dismissible alert: *"Only .sdocx files exported from Samsung Notes are supported."*
  - Checks count limit: $\le 5$ files.
  - Checks individual size limit: $\le 50\text{ MB}$.
  - Checks cumulative size limit: $\le 100\text{ MB}$.
  - If valid, smoothly transitions to **State 2 (Staging)**.

---

### 3.2 State 2: Staged Files & Pre-Flight Review

Allows the user to inspect their selected files, verify file sizes, remove unwanted items, add more files (up to the 5-file cap), and proceed to conversion.

```
+---------------------------------------------------------+
| Staged Notes (3 / 5)                       Total: 18.4 MB |
+---------------------------------------------------------+
| [Note Icon] Physics_Lecture_01.sdocx             6.2 MB [x] |
| [Note Icon] Meeting_Notes_Nov23.sdocx            1.8 MB [x] |
| [Note Icon] Project_Roadmap_Draft.sdocx         10.4 MB [x] |
+---------------------------------------------------------+
| [+ Add More Files]                                      |
|                                                         |
|           [ Convert 3 Notes to Obsidian ]               |
|                                                         |
|   [Cancel / Clear All]                                  |
+---------------------------------------------------------+
```

- **Staged File Row Anatomy:**
  - Left: File format icon + filename (truncated with ellipsis if $> 35$ characters, full filename in native tooltip `title`).
  - Middle: Formatted file size (e.g., `6.2 MB`, `840 KB`).
  - Right: Remove button (`[×]`, accessible `aria-label="Remove <filename>"`).
- **Aggregate Metadata Bar:**
  - Displays count: `Notes (X / 5)`.
  - Displays session size tally: `Total: XX.X MB / 100 MB`.
- **Actions:**
  - Secondary Action: `[+ Add More Files]` (opens file picker to append items, disabled if count reaches 5).
  - Destructive Action: `[Cancel / Clear All]` (returns cleanly to State 1).
  - **Primary Action Button:** `[ Convert X Notes to Obsidian ]` — Full-width, prominent accent purple button.

#### 3.2.1 Large File Memory Confirmation Dialog (Special Trigger)
If one or more staged files is $\ge 25\text{ MB}$, clicking `[ Convert ... ]` intercepts the flow and triggers the **Large File Advisory Confirmation Box** before executing the Pyodide engine:

```
+----------------------------------------------------+
|  [!] Memory Notice for Large Notes                 |
|                                                    |
|  You have selected 1 note(s) larger than 25 MB:    |
|  • Project_Large_Recording.sdocx (28.4 MB)         |
|                                                    |
|  Unpacking and converting large media notes in     |
|  browser memory may cause slow performance or tab  |
|  crashes on mobile devices with limited RAM.       |
|                                                    |
|  [ Continue Conversion ]    [ Cancel / Review ]    |
+----------------------------------------------------+
```
- **Modal Behavior:**
  - Accessible dialog (`role="dialog"`, `aria-modal="true"`).
  - Background overlay backdrop with blur.
  - Traps keyboard focus; pressing `Escape` or clicking `[ Cancel / Review ]` closes the dialog and keeps files in State 2.
  - Clicking `[ Continue Conversion ]` dismisses dialog and initiates State 3 immediately.

---

### 3.3 State 3: Live Conversion & Progress Tracking

The Web Worker initializes the Python WebAssembly runtime and converts notes sequentially. The UI provides clear, multi-tiered feedback so the user knows the tab has not frozen.

```
+---------------------------------------------------------+
| Converting Notes...                         66% (2 / 3) |
| [======================================------]          |
| Active: Converting note 2 of 3: Meeting_Notes_Nov23...  |
+---------------------------------------------------------+
| [✓] Physics_Lecture_01.sdocx                Converted   |
| [⟳] Meeting_Notes_Nov23.sdocx               Converting..|
| [·] Project_Roadmap_Draft.sdocx             Waiting...  |
+---------------------------------------------------------+
|                                                         |
|                  [ Cancel Conversion ]                  |
|                                                         |
|   Processing locally inside your browser memory...      |
+---------------------------------------------------------+
```

- **Top Progress Bar:**
  - Animated, smooth fill bar displaying global completion percentage.
  - Status ticker text:
    - Initializing: *"Loading Python conversion engine..."*
    - Note active: *"Converting note X of Y: <filename>..."*
    - Finalizing: *"Packaging Obsidian vault zip..."*
- **Per-Note Status Chips:**
  - `Waiting`: Muted gray pill.
  - `Converting...`: Animated pulse accent purple pill.
  - `Converted`: Soft emerald green pill with checkmark `[✓]`.
  - `Failed`: Soft crimson red pill with warning icon `[!]`.
- **User Control:**
  - `[ Cancel Conversion ]` button sends `abort_session` to the Web Worker, terminates the active operation, and resets safely to State 1 or error state without unhandled promise rejections.

---

### 3.4 State 4: Results, Download & Integrated Markdown Preview

Once conversion completes (or finishes with partial note warnings), the tool transforms into the **Results Workbench**.

```
+---------------------------------------------------------+
| [✓] Conversion Complete!                                |
| 3 notes converted successfully · 8 images · 1 audio     |
+---------------------------------------------------------+
|                                                         |
|        [ Download Obsidian Vault (.zip) — 14.2 MB ]     |
|                                                         |
|                   [ Convert More Notes ]                |
+---------------------------------------------------------+
| Note Results & Markdown Inspection:                     |
| [ Physics_Lecture_01.md ▼ ]      [ Copy Markdown ]      |
+---------------------------------------------------------+
| # Physics Lecture 01                                    |
|                                                         |
| ![[Physics_Lecture_01_Assets/audio_1.m4a]]              |
|                                                         |
| Today we discussed wave-particle duality and equations: |
|                                                         |
| ![[Physics_Lecture_01_Assets/whiteboard_diagram.jpg]]   |
|                                                         |
| Final notes on homework assignment due Monday.          |
+---------------------------------------------------------+
| [ℹ] Vault Unpack Guide:                                 |
| Extract the ZIP directly into your Obsidian vault root. |
+---------------------------------------------------------+
```

- **Primary Action (Top):**
  - High-emphasis, large primary button: `[ Download Obsidian Vault (.zip) — XX.X MB ]`.
  - Automatically triggers download of `obsidian_vault.zip` via blob URL.
- **Secondary Action:**
  - `[ Convert More Notes ]`: Restores the application to State 1 for another batch.
- **Integrated Markdown Preview Specification:**
  - Instead of a detached modal popup, preview is an **in-situ workspace panel** directly beneath the download hero.
  - **Note Selector:** If multiple notes were converted, a clean dropdown or segmented tab bar lets the user switch between `Note_A.md`, `Note_B.md`, etc.
  - **Copy Action:** `[ Copy Markdown ]` button copies raw text to clipboard with temporary visual feedback: *"Copied!"*.
  - **Security Rule (MD-3):** Preview strictly renders raw text via `element.textContent` inside a styled `<pre><code>` block. No HTML injection, no dangerous DOM parsing, no `innerHTML`.
  - **Assets Pill:** Displays preserved asset stats: `3 images preserved · 1 audio memo`.
- **Note-Level Error & Warning Handling:**
  - If a note failed while others succeeded:
    - Status badge shows `Failed (Corrupt archive or unsupported format)`.
    - Warning message displayed under the file row.
    - Content-free GitHub issue report button: `[ Report Issue on GitHub ]` (pre-fills platform, browser, error type, but **zero user note content**).

---

## 4. Secondary Information Architecture (Below the Fold)

Positioned directly below the tool card, structured as clean, expandable accordion sections or quiet cards:

1. **How It Works (Privacy & Technology):**
   - Explains WebAssembly and Pyodide running client-side.
   - Emphasizes zero network requests and absolute confidentiality.
2. **Obsidian Compatibility Guide:**
   - Visual breakdown of the vault structure:
     ```text
     Obsidian_Vault/
     ├── Physics_Lecture_01.md
     ├── Physics_Lecture_01_Assets/
     │   ├── audio_1.m4a
     │   └── whiteboard_diagram.jpg
     └── Meeting_Notes_Nov23.md  (No empty asset folder for text-only notes)
     ```
   - Explanation of Obsidian Wikilink syntax (`![[Asset_Folder/Image.png]]`).
3. **Format Support & Caveats:**
   - Supported: Samsung Notes `.sdocx` format (ZIP containing `note.note`).
   - Not supported: Legacy `.snb` (S-Note) files, password-locked/encrypted notes.
   - Vector handwriting note: Samsung Notes proprietary S-Pen vector ink strokes cannot be rendered as editable text or vector SVG without Samsung proprietary libraries; typed text, photos, and voice recordings are extracted in full.

---

## 5. Responsive Behavior & Breakpoints

The application enforces a mobile-first, responsive grid across three core viewports:

| Breakpoint | Target Screen Width | Layout Adjustments |
|---|---|---|
| **Mobile** | `< 640px` | - Full viewport width tool card (`margin: 0 12px`).<br>- Touch targets strictly $\ge 44\text{px} \times 44\text{px}$.<br>- File list rows collapse into 2-line layout (filename top, size + delete bottom).<br>- Download & Convert actions pin as a **sticky bottom bar** if scrolled.<br>- Drop zone replaces drag text with simple tap-to-select affordance. |
| **Tablet** | `640px – 1023px` | - Tool container constrained to `640px`.<br>- Padding: `24px`.<br>- Integrated preview max height capped at `360px` with internal vertical scroll. |
| **Desktop** | `≥ 1024px` | - Tool container centered at `768px`.<br>- Integrated preview comfortably expands to `480px` height.<br>- Full drag-and-drop hover interactions active. |

---

## 6. Accessibility (A11y) Specification

Targeting **WCAG 2.2 Level AA** compliance across all interactive states:

1. **Color Contrast:**
   - Body copy and filenames: $\ge 4.5:1$ against surface background.
   - Large text ($\ge 18\text{pt}$ or bold $\ge 14\text{pt}$) and UI borders/icons: $\ge 3:1$.
2. **Keyboard Navigation:**
   - Full keyboard operability: all buttons, dropdowns, remove icons, and toggles reachable via `Tab` / `Shift+Tab`.
   - Explicit, high-contrast focus rings (`:focus-visible`) using a distinct 2px accent outline with 2px offset.
   - Modal focus trap for the Large File Advisory with `Escape` key dismissal.
3. **Screen Reader Announcements (`aria-live`):**
   - A dedicated visually hidden announcer region: `<div id="a11y-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>`.
   - Updates announced:
     - On file drop: *"3 files staged. Total size 18.4 megabytes."*
     - On conversion start: *"Conversion started. Loading Python engine."*
     - On note complete: *"Converted Physics Lecture 01. 1 of 3 finished."*
     - On final finish: *"All notes converted. Ready to download Obsidian vault."*
     - On error: *"Error converting file. Please review status details."*
4. **Touch Target Size:**
   - All interactive targets (buttons, remove crosses, dropdown selectors) have a minimum clickable area of $44\text{px} \times 44\text{px}$.
5. **Reduced Motion:**
   - Respects `@media (prefers-reduced-motion: reduce)`: disables progress bar pulse animations and transitions, replacing them with instant state changes.
