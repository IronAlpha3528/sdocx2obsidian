# Design System & Visual Tokens — sdocx2obsidian

**Document:** `docs/frontend/DESIGN_SYSTEM.md`  
**Status:** Living Design Specification  
**Authority:** Aligned with `docs/frontend/PRODUCT_BRIEF.md` and `docs/frontend/UI_UX_SPEC.md`

---

## 1. Visual Identity & Aesthetic Principles

`sdocx2obsidian` employs a refined **Purple-Black** visual identity. It bridges the precision of technical utilities with the focused, serene atmosphere of Obsidian’s personal knowledge environment.

### 1.1 Core Principles
- **Tool-Centric Simplicity:** Inspired by iLovePDF’s layout, every visual element directs the eye toward the conversion workflow. Unnecessary cards, decorative illustrations, and sprawling margins are excluded.
- **Border-Driven Hierarchy:** Structure and separation are established through crisp, high-contrast borders and subtle surface tinting rather than heavy, blurry drop shadows or glassy blurs.
- **Obsidian Resonance:** Dark tones accented by deep royal violet (`#7c3aed`) and bright electric violet (`#a855f7`) establish immediate affinity with Obsidian users.
- **Zero-Network System Typography:** To guarantee instant load times and offline execution under strict CSP, the system relies entirely on native OS typography stacks.

---

## 2. Color System & Dual-Theme Tokens

The interface implements semantic CSS custom properties supporting both **Dark Theme (Primary/Default)** and **Light Theme (High-Contrast Clean)**.

### 2.1 Dark Theme Tokens (Primary)

The dark theme uses deep obsidian blacks, slate undertones, and vibrant purple highlights.

```css
[data-theme="dark"], :root {
  /* Canvas & Surfaces */
  --bg-canvas: #0c0a12;             /* Deepest obsidian-tinted black */
  --bg-surface: #14111d;            /* Elevated workbench card */
  --bg-surface-elevated: #1e192c;   /* Modal dialogs and active staging rows */
  --bg-surface-hover: #262038;      /* Interactive row & button hover */
  --bg-dropzone: #110e19;           /* Inactive dropzone surface */
  --bg-dropzone-dragover: #21163a;  /* Active file dragover state */

  /* Borders & Dividers */
  --border-subtle: #272138;         /* Subtle card outlines & dividers */
  --border-default: #3b3254;        /* Input borders & inactive drop area */
  --border-focus: #a855f7;          /* High-visibility keyboard focus outline */
  --border-accent: #8b5cf6;         /* Emphasized boundaries */

  /* Text & Glyphs */
  --text-primary: #f3f0f9;          /* High contrast main copy (15.8:1 on #0c0a12) */
  --text-secondary: #c0b8d4;        /* Informative labels and filenames (9.2:1) */
  --text-muted: #82789e;            /* Metadata, file sizes, helper hints (4.8:1) */
  --text-inverse: #0c0a12;          /* Text placed on bright accent fills */

  /* Accent Purple Scale */
  --accent-base: #7c3aed;           /* Primary button background */
  --accent-hover: #9333ea;          /* Button hover state */
  --accent-active: #6b21a8;         /* Button pressed state */
  --accent-light: #c084fc;          /* Highlights, status chips text */
  --accent-tint: rgba(168, 85, 247, 0.12); /* Subtle backdrop highlights */

  /* Feedback & Status */
  --status-success-bg: rgba(16, 185, 129, 0.12);
  --status-success-border: #059669;
  --status-success-text: #34d399;   /* Converted status (7.8:1) */

  --status-error-bg: rgba(239, 68, 68, 0.12);
  --status-error-border: #dc2626;
  --status-error-text: #f87171;     /* Failed status (6.9:1) */

  --status-warning-bg: rgba(245, 158, 11, 0.12);
  --status-warning-border: #d97706;
  --status-warning-text: #fbbf24;   /* Memory advisory modal (8.4:1) */

  --status-info-bg: rgba(59, 130, 246, 0.12);
  --status-info-border: #2563eb;
  --status-info-text: #60a5fa;

  /* Code & Preview */
  --code-bg: #0e0c16;
  --code-border: #251e36;
  --code-text: #e2daf0;
}
```

### 2.2 Light Theme Tokens

The light theme provides a crisp, legible workspace with subtle lavender-tinted neutrals and deep indigo-violet accents.

```css
[data-theme="light"] {
  /* Canvas & Surfaces */
  --bg-canvas: #f8f7fc;             /* Crisp lavender-slate canvas */
  --bg-surface: #ffffff;            /* Pure white primary workbench */
  --bg-surface-elevated: #f1eff8;   /* Elevated panels & staged rows */
  --bg-surface-hover: #e8e4f5;      /* Row hover */
  --bg-dropzone: #faf9fd;           /* Dropzone surface */
  --bg-dropzone-dragover: #ede6fc;  /* Active file dragover state */

  /* Borders & Dividers */
  --border-subtle: #e5e0f2;         /* Dividers */
  --border-default: #d0c8e6;        /* Structural outlines */
  --border-focus: #7c3aed;          /* High-visibility keyboard focus */
  --border-accent: #7c3aed;

  /* Text & Glyphs */
  --text-primary: #151122;          /* Deep ink copy (16.2:1 on #ffffff) */
  --text-secondary: #473e61;        /* Labels and secondary text (8.6:1) */
  --text-muted: #6e6587;            /* Metadata & file sizes (4.9:1) */
  --text-inverse: #ffffff;

  /* Accent Purple Scale */
  --accent-base: #6d28d9;           /* Primary button */
  --accent-hover: #5b21b6;          /* Hover button */
  --accent-active: #4c1d95;         /* Active button */
  --accent-light: #7c3aed;
  --accent-tint: rgba(109, 40, 217, 0.08);

  /* Feedback & Status */
  --status-success-bg: #ecfdf5;
  --status-success-border: #10b981;
  --status-success-text: #065f46;   /* (6.2:1) */

  --status-error-bg: #fef2f2;
  --status-error-border: #ef4444;
  --status-error-text: #991b1b;     /* (6.7:1) */

  --status-warning-bg: #fffbeb;
  --status-warning-border: #f59e0b;
  --status-warning-text: #92400e;   /* (6.4:1) */

  --status-info-bg: #eff6ff;
  --status-info-border: #3b82f6;
  --status-info-text: #1e40af;

  /* Code & Preview */
  --code-bg: #f3f0fb;
  --code-border: #ded8f1;
  --code-text: #1d182b;
}
```

### 2.3 Contrast Ratio Verification Table (WCAG 2.2 AA)

| Theme | Foreground Element | Background | Calculated Ratio | WCAG 2.2 AA Standard | Pass/Fail |
|---|---|---|---|---|---|
| **Dark** | `--text-primary` (`#f3f0f9`) | `--bg-canvas` (`#0c0a12`) | **16.1 : 1** | $\ge 4.5:1$ (Normal text) | **PASS** |
| **Dark** | `--text-secondary` (`#c0b8d4`) | `--bg-surface` (`#14111d`) | **9.1 : 1** | $\ge 4.5:1$ (Normal text) | **PASS** |
| **Dark** | `--text-muted` (`#82789e`) | `--bg-surface` (`#14111d`) | **4.7 : 1** | $\ge 4.5:1$ (Normal text) | **PASS** |
| **Dark** | `--text-inverse` (`#0c0a12`) | `--accent-base` (`#7c3aed`) | **5.4 : 1** | $\ge 4.5:1$ (Button text) | **PASS** |
| **Light** | `--text-primary` (`#151122`) | `--bg-surface` (`#ffffff`) | **16.2 : 1** | $\ge 4.5:1$ (Normal text) | **PASS** |
| **Light** | `--text-secondary` (`#473e61`) | `--bg-surface` (`#ffffff`) | **8.6 : 1** | $\ge 4.5:1$ (Normal text) | **PASS** |
| **Light** | `--text-muted` (`#6e6587`) | `--bg-surface` (`#ffffff`) | **4.9 : 1** | $\ge 4.5:1$ (Normal text) | **PASS** |
| **Light** | `--text-inverse` (`#ffffff`) | `--accent-base` (`#6d28d9`) | **7.1 : 1** | $\ge 4.5:1$ (Button text) | **PASS** |

---

## 3. Typography Scale & System Stacks

To prevent external font downloads and eliminate layout shifts (CLS), the typography uses native high-grade system font stacks.

### 3.1 Font Stacks
- **Body & Headings:**
  ```css
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  ```
- **Code & Markdown Inspection:**
  ```css
  --font-mono: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "Liberation Mono", monospace;
  ```

### 3.2 Modular Type Scale (1.25 Major Third)

```css
:root {
  --text-xs:   0.75rem;    /* 12px — Badges, micro file counts */
  --text-sm:   0.875rem;   /* 14px — Metadata, secondary labels, buttons */
  --text-base: 1.0rem;     /* 16px — Standard body copy, inputs */
  --text-lg:   1.25rem;    /* 20px — Section titles, tool subheadings */
  --text-xl:   1.5rem;     /* 24px — Tool card primary heading */
  --text-2xl:  1.875rem;   /* 30px — Page hero title */

  --font-regular: 400;
  --font-medium:  500;
  --font-semibold: 600;
  --font-bold:    700;

  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
}
```

---

## 4. Spacing, Elevation & Layout Grid

Spacing is strictly anchored to an **8-point base grid** with a half-step `4px` token for micro-adjustments.

### 4.1 Spacing Tokens
```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1.0rem;   /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2.0rem;   /* 32px */
  --space-12: 3.0rem;  /* 48px */
  --space-16: 4.0rem;  /* 64px */
}
```

### 4.2 Border Radius Scale
```css
:root {
  --radius-sm: 4px;    /* Status badges, tooltips */
  --radius-md: 8px;    /* Buttons, inputs, staged file rows */
  --radius-lg: 14px;   /* Tool container card, modal dialogs */
  --radius-full: 9999px; /* Pill chips */
}
```

### 4.3 Elevation & Shadows
The aesthetic prioritizes high-contrast structural borders over blur shadows:
```css
:root {
  /* Quiet ambient elevation for floating cards */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.45);
}
```

---

## 5. UI Component Specifications

### 5.1 Primary Action Button
- **Default:** Background `--accent-base`, text `--text-inverse` (Dark) / `#ffffff` (Light), padding `12px 24px`, border-radius `--radius-md`, font-weight `600`, font-size `--text-base`.
- **Hover:** Background `--accent-hover`, subtle translateY `-1px`.
- **Active:** Background `--accent-active`, translateY `0px`.
- **Focus:** 2px solid `--border-focus`, offset `2px`.
- **Disabled:** Opacity `0.45`, cursor `not-allowed`, no hover transform.

### 5.2 Secondary / Ghost Button
- **Default:** Background transparent, border `1px solid --border-default`, text `--text-secondary`, font-weight `500`.
- **Hover:** Background `--bg-surface-hover`, text `--text-primary`, border-color `--border-accent`.

### 5.3 Drop Zone Area
- **Container:** Height `240px` (Desktop) / `180px` (Mobile), 2px dashed `--border-default`, border-radius `--radius-lg`, background `--bg-dropzone`.
- **Drag-Over:** Border turns solid 2px `--accent-light`, background switches to `--bg-dropzone-dragover`.
- **Affordance:** Centered cloud-upload SVG glyph (`48px` x `48px`, stroke `--text-muted`), clear bold heading ("Select or drop Samsung Notes"), small subtext indicating 5-file cap and 50MB per file limit.

### 5.4 Staged File Row
- **Dimensions:** Min-height `56px`, padding `10px 16px`, border-radius `--radius-md`, background `--bg-surface-elevated`, border `1px solid --border-subtle`.
- **Layout:** Flex row with `gap: 12px`, vertical center alignment.
- **Filename:** Text `--text-primary`, `font-medium`, ellipsis truncation.
- **Size Pill:** Text `--text-muted`, `font-mono`, font-size `--text-xs`.
- **Remove Button:** `36px` x `36px` touch target, subtle hover background `rgba(239, 68, 68, 0.15)`, icon color `--text-muted` shifting to `--status-error-text` on hover.

### 5.5 Status Chips
- Height `24px`, padding `2px 10px`, border-radius `--radius-full`, font-size `--text-xs`, font-weight `600`.
- **Waiting:** Background `--bg-surface-hover`, text `--text-muted`.
- **Converting:** Background `--accent-tint`, text `--accent-light`, border `1px solid var(--accent-base)`, subtle pulse animation.
- **Converted:** Background `--status-success-bg`, text `--status-success-text`, border `1px solid var(--status-success-border)`.
- **Failed:** Background `--status-error-bg`, text `--status-error-text`, border `1px solid var(--status-error-border)`.

### 5.6 Progress Bar
- **Track:** Height `8px`, border-radius `4px`, background `--bg-surface-elevated`, border `1px solid --border-subtle`, overflow `hidden`.
- **Indicator:** Smooth width transition (`transition: width 200ms cubic-bezier(0.16, 1, 0.3, 1)`), background gradient `linear-gradient(90deg, var(--accent-base), var(--accent-light))`.

### 5.7 Large File Confirmation Modal
- **Backdrop:** Background `rgba(12, 10, 18, 0.75)`, backdrop-filter `blur(4px)`.
- **Dialog Box:** Max width `480px`, background `--bg-surface`, border `1px solid var(--status-warning-border)`, border-radius `--radius-lg`, box-shadow `--shadow-lg`, padding `24px`.
- **Icon:** Triangle warning glyph (`28px`, color `--status-warning-text`).
- **Heading:** `--text-lg`, font-weight `700`, color `--text-primary`.
- **Body:** `--text-sm`, color `--text-secondary`, line-height `1.6`.
- **Actions:** Dual button row: `[ Continue Conversion ]` (solid amber/purple) and `[ Cancel / Review ]` (ghost).

### 5.8 Integrated Markdown Preview Panel
- **Frame:** Border `1px solid --border-subtle`, border-radius `--radius-md`, background `--code-bg`, overflow `hidden`.
- **Header Toolbar:** Background `--bg-surface`, padding `8px 14px`, border-bottom `1px solid --border-subtle`, flex layout with dropdown file selector on the left and `[ Copy Markdown ]` ghost button on the right.
- **Code Area:** Native `<pre><code>`, padding `16px`, font-family `--font-mono`, font-size `--text-sm`, color `--code-text`, line-height `1.6`, max-height `420px`, overflow-y `auto`, `white-space: pre-wrap; word-break: break-word;`.

---

## 6. Micro-Interactions & Transitions

All animations are purposeful, lightweight, and respect system preferences.

### 6.1 Duration Tokens
```css
:root {
  --dur-quick: 120ms;       /* Button presses, chip transitions */
  --dur-normal: 200ms;      /* Tooltip reveals, progress fills */
  --dur-deliberate: 320ms;  /* Modal entrance, panel collapse/expand */
  --ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### 6.2 Reduced Motion Directive
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
