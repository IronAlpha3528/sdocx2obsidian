# Frontend Redesign Brief — sdocx2obsidian (phase P16b)

**For:** the Antigravity agent. **From:** the maintainer.
**Goal:** replace the current `site/` user interface with one that follows the familiar "tool page" pattern of iLovePDF (one clear job, one big button, a simple step-by-step flow), built to established HCI principles and design rules, and looking minimal and modern.

This brief changes **only the presentation layer** of `site/`. Everything decided in `docs/web-implementation-brief.md` still holds: conversion stays in the browser, no third-party requests, plain-text preview only, no UI framework, content-free issue link, the privacy statement, the minimal content security policy, and the limits from the web profile. Where this brief and that one disagree on anything except visual design and interaction design, the earlier brief wins; stop and ask.

---

## 0. Protocol

1. Treat this as phase **P16b**. Follow the same working protocol as `docs/plan.md` and the implementation brief section 0: read, plan in at most 10 lines, tests first where there is logic, run the gate after each change, report, tick the tracker, commit locally as `P16b: frontend redesign`, stop. Never push. No CI.
2. **Scope fence.** You may change files under `site/` and the web section of `README.md`, and add the P16b entry to `docs/plan.md`. Do not change `src/`, the worker message contract, the session interface, the limits, the content of the privacy statement, or the issue-link fields. If a design need requires one of those, stop and propose it.
3. **Reuse, do not rewrite, the logic.** Keep the existing worker wiring, state machine, and Node integration tests green. If the state machine lacks a state this design needs (for example "files selected, not yet converting"), add it with tests first.
4. **Gate:** `npm run check` plus the four Python commands, plus the design verification in section 9.
5. **Design review gate (new).** After you finish the design plan (section 8, step 2), **stop and show it to the maintainer** before writing any interface code.
6. **Stop and ask** if: a requirement here conflicts with the minimal content security policy or the no-third-party rule; a font or icon would need a network request; the page weight budget in section 7 cannot be met; or a pattern needs a dependency.

---

## 1. Reference and how to use it

**Reference:** the tool pages of https://www.ilovepdf.com/ (for example Merge PDF). The pattern as understood: a short title and one-line description; one very large primary button to select files, with drag and drop on the same area; after files are chosen, a workspace with the file list and a single prominent action button; a processing screen; and a result screen with one large download button and a "start over" path. The home page of that site also has a grid of tool cards, which this single-purpose tool does **not** need.

If you can open the live site, study one tool flow end to end and note the sequence of screens and what the user must do on each. **Take the interaction pattern and the general feel only.** Do not copy its logo, colors, icons, illustrations, wording, or any asset, and do not imply affiliation. The result must be recognizably its own.

---

## 2. Design direction

**Feel:** calm, light, friendly, and quick. Plenty of white space. One strong accent color used only for the primary action and key states. Big, obvious targets. No decoration that does not carry information.

**What "minimal and modern" means here (testable):**
- One primary action per screen, visually dominant, in the accent color. Every other control is quieter.
- No more than two type weights in use on a screen, one type family, one accent color plus neutrals plus three status colors.
- No gradients as decoration, no stock illustrations, no emoji as icons, no animated backgrounds.
- A simple line-icon set drawn by you as inline vector graphics (a handful of icons only), consistent stroke width, all with accessible names or marked decorative.
- Borders and spacing, not shadows, separate things. At most one shadow style, used only for the sticky action bar on small screens.

**Avoid these generic tells:** a tracked-out all-caps label above every heading; numbered markers on things that are not a sequence; the same rounded card repeated for every block; a headline with one word in a different color; scattered fade-in effects. The three-step guide **is** a real sequence, so numbering is correct there.

**Brand:** a text wordmark using the project name, with one small mark you draw yourself. No logo copied from anywhere.

---

## 3. Maintainer decisions for this phase (locked unless overridden)

| ID | Decision |
|---|---|
| FD-1 | One page, one tool. Sections: tool, how it works, what is converted, privacy, FAQ, footer. No tool grid, no accounts, no login, no pricing |
| FD-2 | Language: English only, with text kept in one place so translation is possible later |
| FD-3 | Accent color: deep teal (see tokens). Not red, and not Obsidian's purple, to avoid looking like a copy of either product |
| FD-4 | Light theme is the primary design. A dark theme that follows the system setting is welcome if it costs little: same tokens, re-mapped, verified for contrast. Skip it if it threatens the budget |
| FD-5 | One typeface, self-hosted, Latin subset only, with a system font fallback that looks acceptable. If the font file would break the weight budget, use the system font stack |
| FD-6 | No conversion options. The tool does one thing, so there is no settings panel (fewer choices, faster decisions) |

---

## 4. Design tokens (starting values; verify every contrast ratio programmatically)

| Token | Value | Use |
|---|---|---|
| Ink | #14202B | Primary text |
| Slate | #5B6877 | Secondary text |
| Surface | #FFFFFF | Page and panels |
| Canvas | #F5F7F9 | Section backgrounds, drop area base |
| Line | #DCE2E8 | Borders, dividers |
| Accent | #0B7A75 | Primary button, links, focus ring |
| Accent hover | #086761 | Primary button hover and pressed |
| Accent tint | #E4F4F2 | Drop area on drag-over, selected states |
| Success | #1E7B45 on #E8F5EC | Converted |
| Warning | #7A4F00 on #FFF4DB | Converted with notes |
| Error | #B3261E on #FDECEA | Failed |

- **Type:** one family, sizes on a 1.25 scale from a 16 px base; headline scales fluidly between roughly 32 and 44 px; body line height about 1.5; line length at most 65 characters. Suggested family: a friendly geometric sans with an open license (for example Figtree or Plus Jakarta Sans), subset, with swap loading.
- **Spacing:** an 8 px grid. Page content column about 960 px wide; tool area about 720 px.
- **Radius:** a small scale, not one value for everything: controls about 10 px, containers about 16 px, status chips fully rounded.
- **Targets:** every interactive element at least 44 by 44 px (the standard minimum is 24 px; this tool is used on phones).
- **Focus:** a clear two-pixel accent focus ring with offset on every focusable element, never removed.
- **Motion:** only responses to user actions (state changes, progress). Durations about 150 to 250 ms. Honor reduced-motion by removing movement and keeping instant state changes. No automatic page-load animation.

---

## 5. Screens and states (the flow)

The whole tool is one page that changes in place. Use real, final copy from section 6.

```
S1  Idle (first view)                      S2  Files chosen
+--------------------------------------+   +--------------------------------------+
| wordmark                 How  Privacy |   | wordmark                 How  Privacy |
|                                      |   |                                      |
|   Convert Samsung Notes to Obsidian  |   |   Your notes                         |
|   Drop .sdocx files, get Markdown    |   |  +----------------------------------+|
|                                      |   |  | file  name.sdocx     12 MB    x  ||
|  +--------------------------------+  |   |  | file  name2.sdocx     3 MB    x  ||
|  |        [ Select .sdocx files ] |  |   |  +----------------------------------+|
|  |        or drop them here       |  |   |   + Add more        2 files, 15 MB   |
|  +--------------------------------+  |   |                                      |
|  Runs in your browser. Files never   |   |   [ Convert to Markdown ]            |
|  leave your device.                  |   |   Limits: 5 files, 50 MB each        |
|                                      |   |                                      |
|  How it works (3 steps)              |   |                                      |
+--------------------------------------+   +--------------------------------------+

S3  Converting                             S4  Done
+--------------------------------------+   +--------------------------------------+
|   Converting 2 notes                 |   |   Your notes are ready               |
|  +----------------------------------+|   |   [ Download ZIP ]                   |
|  | name.sdocx       Converting...   ||   |   2 notes converted                  |
|  | name2.sdocx      Waiting         ||   |  +----------------------------------+|
|  +----------------------------------+|   |  | name.sdocx   Converted           ||
|   [ Cancel ]                         |   |  | name2.sdocx  Converted, 1 note > ||
+--------------------------------------+   |  +----------------------------------+|
                                           |   How to open in Obsidian            |
                                           |   Convert more notes                 |
                                           +--------------------------------------+
```

**Desktop and tablet:** the action area is the tool column itself; on S2 the primary button sits directly below the file list. **Phone:** the primary action becomes a full-width button in a bar fixed to the bottom of the screen on S2 and S4 (with the safe-area inset respected and no content hidden behind it); the drop area becomes simply a large "Select files" button because dropping is rare on phones.

State rules:

| State | What the visitor sees | Rules |
|---|---|---|
| S1 Idle | Title, one line, big select button with the drop area around it, privacy line directly under it | The whole drop area is clickable and keyboard-operable. Drag-over shows the tint and a text change ("Release to add files") |
| Runtime loading | A calm inline progress note under the button, never a blocking overlay | Loading starts on first sign of intent (pointer or keyboard focus on the button, drag over the page, or file chosen), so the visitor is never made to wait without cause. The visitor can already choose files while it loads; conversion starts when ready |
| S2 Files chosen | List of files with size and remove buttons; "Add more"; one primary button; the limits stated quietly | Files that break a limit are listed with a clear reason and do not block the others. The primary button is disabled only when no file is valid, and says why |
| S3 Converting | One row per file with a clear status; overall progress; "Cancel" | Status text, not color alone. Cancel is always available and immediate. Rows update in place with no layout jump |
| S4 Done | Success heading, the single large download button, per-file outcome with expandable notes, import tip, "Convert more notes" | Focus moves to the heading. Warnings are expandable per file, not dumped. The download button keeps its label ("Download ZIP") |
| Partial success | Same as S4, with failed files marked and each with its message and next step | The ZIP still downloads for the files that worked |
| Failure (all files) | A clear error heading, per-file reasons, and a way to try again | Offer the content-free "Report this problem" link; never a stack trace or error codes in prose |
| Cancelled | Back to S2 with the files kept | Nothing is lost |
| Unsupported browser | A plain message naming what is needed and suggesting a current browser | Shown before any file work, not after a failure |
| Preview (optional) | A collapsed "Preview text" section on S4 | Plain text only, set as text, never as markup, as already decided |

---

## 6. Copy (final wording; sentence case; plain verbs; keep every action's name consistent)

| Where | Text |
|---|---|
| Page title / H1 | Convert Samsung Notes to Obsidian |
| Subtitle | Turn .sdocx files into Markdown notes with their images and audio, ready for your vault. |
| Primary button (S1) | Select .sdocx files |
| Drop hint | or drop them here |
| Drag-over | Release to add files |
| Privacy line | Everything happens in your browser. Your notes never leave your device. |
| Loading | Getting the converter ready. This happens once and is saved for next time. |
| S2 heading | Your notes |
| Add more | Add more files |
| Primary button (S2) | Convert to Markdown |
| Limits line | Up to 5 files, 50 MB each. |
| S3 heading | Converting your notes |
| Cancel | Cancel |
| S4 heading | Your notes are ready |
| Download | Download ZIP |
| Import tip | Unzip the folder into your Obsidian vault. Images and audio appear inside each note. |
| Start over | Convert more notes |
| Status words | Waiting, Converting, Converted, Converted with notes, Could not convert |
| Wrong type | This is not a .sdocx file. Export the note from Samsung Notes as .sdocx and try again. |
| Too big | This file is over 50 MB, which is the limit for this tool. |
| Too many | Only 5 files can be converted at once. The first 5 were added. |
| Per-file errors | Use the messages from the implementation brief section 5 (P15), each followed by one next step ("Export the note again from Samsung Notes", "Try the desktop command-line tool for very large files") |
| Report link | Report this problem |

**How it works** (a real sequence, so numbered): 1. Export a note from Samsung Notes as .sdocx. 2. Select or drop the file here. 3. Download the ZIP and unzip it into your vault.
**What is converted:** typed text, images, and audio in the original order. **What is skipped:** formatting, handwriting and drawings, PDF attachments. Say this in two short lists, in plain words.
**FAQ (short):** Is my note uploaded? (No.) Why was something skipped? What happens to the file after I close the tab? Which Samsung Notes versions work? How do I report a note that fails? Footer: "Unofficial open-source tool. Not affiliated with Samsung or Obsidian." plus the repository link and license (ask the maintainer; do not invent).

Writing rules: errors say what happened and what to do, never apologize, never blame the visitor; an empty screen is an invitation to act; do not use jargon such as "WASM", "worker", "runtime" in visitor-facing text.

---

## 7. Hard constraints

- **Budgets:** the page itself (HTML, CSS, script, font, icons) at most 100 KB transferred, excluding the converter runtime. No layout shift while loading. The page is usable (select button works) before the runtime has finished loading.
- **No third-party requests** of any kind: fonts, icons, scripts, analytics. Verify with a network log.
- **No framework.** Plain HTML, CSS, and TypeScript or JavaScript. Dev-only tooling must be pinned and named in your plan for approval.
- **Content security policy unchanged:** no inline scripts or styles that would require loosening it; no `eval`-style features.
- **Browser support:** current and previous major versions of Chrome, Firefox, Safari (desktop and iOS), and Samsung Internet. Use progressive enhancement; the drag-and-drop layer must never be the only way to add files.
- **File picker on Android:** some Android pickers grey out files with an unknown extension when a type filter is set. Test on a real Android phone; if `.sdocx` files cannot be selected, drop the filter and validate the extension in the page.

---

## 8. Process (follow in order)

1. **Audit the current `site/` UI** against sections 9 and 10. Produce a short findings list (what fails, which principle, how severe). Do not fix anything yet.
2. **Design plan (then stop for maintainer approval):** the token table (final hex values with computed contrast ratios), the type scale, the layout concept with ASCII wireframes for desktop and phone for S1 to S4, the component list (button, drop area, file row, status chip, progress, notice, disclosure, bottom bar), the icon list, and the copy deck. Review the plan against section 2's "avoid" list and say what you changed.
3. **Build** in small steps: tokens and base styles; layout and components; each state; responsive behavior; accessibility behavior; motion last.
4. **Self-critique:** if your environment can take screenshots, capture every state at 360, 768, and 1280 px wide and review them against the plan; remove anything decorative that does not carry information.
5. **Verify** (section 9) and **report** (section 11).

---

## 9. HCI principles: required behavior and how to verify

| Principle | Required in this UI | Verify by |
|---|---|---|
| Visibility of system status (Nielsen 1) | Visible state at all times: loading, per-file status, overall progress, done. Feedback within 100 ms of any action; anything slower shows progress | Throttled-network and large-file run; no silent waits |
| Match with the real world (2) | Words the visitor uses: "notes", "Obsidian", "Samsung Notes". No technical terms | Copy review |
| User control and freedom (3) | Cancel at any time, remove a file, add more files, start over, cancelled keeps files | Each action tried in each state |
| Consistency and standards (4), Jakob's law | Familiar tool-page flow; one name per action everywhere; standard control behavior | Copy and component audit |
| Error prevention (5) | Pre-checks for type, size, and count before conversion; disabled primary button explains why; limits visible before they bite | Try wrong type, oversize, too many |
| Recognition over recall (6) | Everything needed is visible: limits, steps, what is skipped; nothing to remember between screens | Walkthrough |
| Flexibility and efficiency (7) | Drop, click, or keyboard; multi-select; start loading early so conversion feels instant | Three input methods tested |
| Aesthetic and minimalist design (8) | One primary action per screen; nothing competing; extra detail collapsed | Squint test: the primary button is the first thing seen |
| Error recovery (9) | Each error: what happened, why in plain words, and the next step; partial success still downloads | Trigger every error in the catalogue |
| Help and documentation (10) | Short guide and FAQ on the page; issue link | Review |
| Shneiderman's rules | Closure (clear "done" screen), informative feedback, reversible actions, internal locus of control | Walkthrough |
| Fitts's law | Largest target is the primary button; targets at least 44 px; bottom action bar on phones within thumb reach | Measure sizes on a phone |
| Hick's law | No options panel; only one primary choice per screen | Count choices per screen |
| Doherty threshold | Responses under about 400 ms except real conversion work, which shows progress | Timing check |
| Chunking and progressive disclosure | Three-step guide; warnings and preview collapsed until asked | Review |
| Gestalt: proximity, similarity, common region | Related things grouped by space and containers; same-role elements look the same; file list visibly one group | Review against wireframes |
| Visual hierarchy | Clear order: headline, primary button, privacy line, then everything else; type and weight carry rank | Squint test |

**Accessibility (WCAG 2.2 AA, treated as required):**
- Semantic structure: one `h1`, ordered headings, landmarks (header, main, footer), a skip link, real buttons and links, a real file input behind the drop area (the drop area is operable by keyboard and screen reader).
- Contrast at least 4.5:1 for text and 3:1 for controls and focus rings, computed, not eyeballed; status never conveyed by color alone (always text plus icon).
- Keyboard: every action reachable and operable; logical focus order; visible focus; focus moves to the new heading after state changes; no keyboard traps; focus returns sensibly after removing a file or cancelling.
- Screen readers: a polite live region announces file added, conversion progress milestones, completion, and errors; remove buttons name their file ("Remove name.sdocx"); the page title reflects the state.
- Reflow at 400 percent zoom without horizontal scrolling; text resizes to 200 percent without loss; touch targets 44 px; no content hidden behind the fixed bottom bar; reduced motion honored; no time limits.
- Language attribute set; no reliance on hover.

**Test plan the maintainer can run (you write it; include in the report):** five tasks with two or three first-time users: (1) convert one note, (2) add a second file, (3) recover from choosing a wrong file, (4) cancel and restart, (5) find out what is not converted. Record time, errors, hesitations, and one-line feedback. Also: keyboard-only run; one screen reader pass (VoiceOver or TalkBack, and NVDA if available); a real phone run on cellular speed; offline after first load.

**Automated checks:** unit tests for any new state logic; an automated accessibility scan and a contrast check as dev-only tooling (name and pin the tools in your plan for approval); a network-log check showing zero third-party requests; Lighthouse accessibility, performance, and best-practices scores reported as numbers (target at least 95 for accessibility, at least 90 for the others; explain any shortfall).

---

## 10. Components (build once, reuse)

Primary button; secondary button (outlined) and text button; drop area (idle, drag-over, disabled); file row (name with middle truncation and full name on focus or hover, size, status chip, remove); status chip (waiting, converting, converted, converted with notes, failed); progress bar with text; inline notice (info, warning, error); disclosure (for per-file notes, preview, FAQ); bottom action bar (phone); header with wordmark and two anchor links; footer. Each component has defined states: default, hover, focus, pressed, disabled, and (where relevant) error. Name them consistently in CSS and document them in a short `site/DESIGN.md` (tokens, components, states, copy rules) so future changes stay consistent.

---

## 11. End-of-session report

Findings from the audit (with severity); the approved design plan and any deviations; files changed; tests added; computed contrast table; screenshots list (if captured); weights (transferred page size, font size); measured timings; results of every check in section 9 (pass, fail, not tested, and why); the usability test plan; open questions; what you could not verify (especially real-device behavior). Then tick the tracker, commit locally, and **stop**.
