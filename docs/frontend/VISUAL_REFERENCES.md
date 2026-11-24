# Visual References & Design Direction — sdocx2obsidian

**Document:** `docs/frontend/VISUAL_REFERENCES.md`  
**Status:** Living Design Specification  
**Authority:** Aligned with `docs/frontend/PRODUCT_BRIEF.md`, `docs/frontend/UI_UX_SPEC.md`, and `docs/frontend/DESIGN_SYSTEM.md`

---

## 1. Design Direction Overview

The visual direction of `sdocx2obsidian` combines two distinct inspirations:
1. **The Tool-First Usability of iLovePDF:** Immediate task orientation, prominent file dropzone, clear staging workspace, linear progression, and high-impact completion actions.
2. **The Aesthetic Identity of Obsidian:** A refined **Purple-Black** palette, dark mode focus, high-contrast borders, and clean monospace typography that feels directly native to the Obsidian ecosystem.

---

## 2. Reference Analysis: iLovePDF

[iLovePDF](https://www.ilovepdf.com/) is widely recognized as a benchmark for high-volume, single-purpose web file utilities.

### 2.1 What Makes iLovePDF Effective
- **Unambiguous Hero Focus:** Upon page load, the user does not have to hunt for the action. The file upload button is the visual anchor of the page.
- **Linear Step-by-Step Flow:**
  - *Step 1:* Choose or drop files.
  - *Step 2:* Review file cards (reorder, rotate, delete, add more).
  - *Step 3:* Action trigger button (prominent bottom/sidebar position).
  - *Step 4:* Processing screen with animated status.
  - *Step 5:* Giant download button with automatic secondary download trigger.
- **Immediate Affordance:** The drop area is expansive and reacts instantly to drag gestures.

### 2.2 What sdocx2obsidian Adopts from iLovePDF
- **The Workbench Hero:** A dedicated `768px` tool card positioned immediately below the header.
- **Staging Area Review:** Rather than converting files immediately on drop, files are staged in a review list showing filenames, formatted file sizes, delete buttons, and a cumulative size tally.
- **Prominent Action Buttons:** A full-width, high-contrast primary button (`[ Convert X Notes to Obsidian ]` and `[ Download Obsidian Vault (.zip) ]`).
- **Secondary Information Below the Tool:** Technical details, privacy explanations, and FAQ accordions sit neatly below the tool fold so they never obstruct active users.

### 2.3 What sdocx2obsidian Explicitly Avoids from iLovePDF
- **Commercial Clutter & Ads:** No display advertisements, third-party banners, or sponsored links.
- **Paywalls & Account Prompts:** No "Upgrade to Premium", "Sign In to Convert More", or artificial rate limiting.
- **Server Upload Paradigm:** iLovePDF uploads files to remote servers; `sdocx2obsidian` is 100% client-side. The UI must explicitly convey that files stay in browser memory (`100% In-Browser · Zero Data Upload`).
- **Generic Red/Corporate Branding:** iLovePDF’s bright corporate red is replaced by Obsidian-inspired purple-black tones.

---

## 3. Obsidian Visual Alignment

Obsidian users value minimalism, density, keyboard efficiency, and calm, dark workspaces.

### 3.1 Color & Surface Hierarchy
- **Canvas:** Deepest obsidian black (`#0c0a12`), providing maximum contrast and visual comfort in low-light environments.
- **Workbench Surface:** Subtle charcoal/slate (`#14111d`) with crisp 1px structural outlines (`#272138`).
- **Accent Purple:** Deep royal purple (`#7c3aed`) and bright electric violet (`#a855f7`), echoing Obsidian’s iconic brand color.
- **Text:** High-contrast warm off-white (`#f3f0f9`) for comfortable reading of technical documentation and note content.

### 3.2 Markdown-First Presentation
- Converted note inspection mimics the appearance of a clean Markdown editor.
- Monospace font stack (`ui-monospace, Cascadia Code, Source Code Pro, Menlo, Consolas`).
- Clear visual rendering of Obsidian wikilink syntax:
  ```markdown
  ![[Note_Assets/diagram.png]]
  ```
- Subdued syntax coloring that prioritizes content legibility over flashy code highlighter themes.

---

## 4. Modern Technical Utility Aesthetic

### 4.1 What to Implement
- **Border-Driven Contrast:** Clean, precise 1px borders define cards, file rows, and buttons.
- **High-Density Data Display:** File sizes, note counts, and conversion timers are formatted concisely in monospace text.
- **Subtle, Purposeful Micro-Interactions:**
  - Smooth 200ms progress bar fill.
  - Gentle 1px translateY lift on button hover.
  - Distinct focus outline (`2px solid #a855f7` with 2px offset) for accessible keyboard navigation.
- **Fluid Dual Themes:** A polished Dark Theme as the default, paired with a clean, high-contrast Light Theme designed with identical care.

### 4.2 What to Avoid (Anti-Patterns)
- **Glassmorphism / Heavy Blurs:** Avoid semi-transparent frosted glass panels that hurt legibility and degrade performance on low-end mobile devices.
- **Loud Neon Glows & Gradients:** Avoid dramatic purple/cyan glowing drop-shadows or flashy animated gradient backgrounds that distract from the task.
- **Excessive Cards & Nested Boxes:** Avoid card-in-card nesting that wastes viewport space.
- **Bloated Whitespace:** Keep spacing compact, balanced, and functional (8px grid).

---

## 5. Integrated Markdown Preview vs. Modal Comparison

| Feature | Legacy Modal Dialog | Proposed Integrated In-Workflow Panel |
|---|---|---|
| **Context Retention** | Blocks the entire page; obscures the download button and batch results. | Sits directly beneath the download button in State 4; preserves full context. |
| **Batch Note Switching** | Awkward modal reopening for each note. | Clean dropdown selector allows fluid switching between all converted notes. |
| **Screen Space** | Constrained to modal box; often triggers double scrollbars. | Expands naturally within the tool workbench with dedicated vertical scroll. |
| **Action Accessibility** | User must close modal before downloading vault ZIP. | User can inspect Markdown and click `[ Download Vault ]` in a single view. |
| **Security Rule** | Plain text via `textContent` (MD-3). | Preserved: Strictly renders raw text via `element.textContent` inside `<pre><code>`. |
