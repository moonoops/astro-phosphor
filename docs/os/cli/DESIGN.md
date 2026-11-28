# CLI OS (`data-os="cli"`) — Design System Specification

> A calm, developer-first interactive terminal OS inspired by **Prompt OS** (by Creative Dima, Claude Code CLI lineage) rendered in pure `IBM Plex Mono` on warm charcoal obsidian (`#1B1A17`) with terracotta prompt accents (`#D97757`) and sage tool-call indicators (`#7FB069`) — living seamlessly inside the physical Macintosh LC CRT monitor and full-viewport desktop modes of **Astro Phosphor**.

**OS Key:** `cli` (`<html data-os="cli">`)
**Factory Presets (`data-theme` under `data-os="cli"`):** `claude` *(default — Warm Charcoal)* · `light` *(Warm Parchment)* · `dark` *(Pure Jet Black)* · `matrix` *(CRT Phosphor Green)*
**Primary Aesthetic:** Modern Agentic CLI Shell × Warm Editorial Monospace × Minimal Hairline Terminal Panes
**Registry Metadata (`src/os/cli/meta.ts`):** `cursorStyle: 'terminal-mono'`, `hasTopBar: false`, `hasDesktopWidget: true`, `flatOptics: false`
**Reference Audit Sources:**
- Framer Marketplace Listing: `https://www.framer.com/marketplace/templates/prompt-os/`
- Live Reference Preview (inspected at `1440×900`, `900×900`, and `390×844` across all 4 `/theme` presets & interactive commands): `https://prompt-os.framer.website/`

---

## 1. Visual Metaphor, Aesthetic DNA & Hardware Integration

### 1.1 Core Design Philosophy
Unlike `phosphor` (1990s Classic Mac + Win95 3D extruded pixel keycaps and heavy amber bloom), **CLI OS** evokes a quiet, razor-sharp **modern command-line workstation** modeled after agentic terminal tools (`claude-code` / Prompt OS's `mika-code`):
- **Single-Font Monospace Discipline:** Content sits inside a calm, structured monospaced rhythm (`14px / 1.65`) where hierarchy comes from **weight (`400` / `500` / `600` / `700`), scale, tight negative display tracking (`-0.03em`), indentation rails, and disciplined 4-tone color semantics** — never gradients, drop shadows, or ornamental chrome.
- **Flat Tactile Geometry (`4px / 6px / 8px / 10px` Radii):**
  - `4px` on prompt pills, list hover rows, KPI metric cards, inline code, titlebar buttons, and framed media.
  - `6px` on the terracotta-bordered Welcome Box (`.os-desktop-widget`), flat buttons, cards, and code blocks.
  - `8px` on the pinned command dock bar (`.taskbar::before`), slash-command palette (`.start-menu` / `.taskbar-os-menu`), form inputs, and OS window panes (`.os-window`).
  - `10px` on mobile touch command chips.
- **Tool-Call & Transcript Grammar:** Navigation and system chrome speak in terminal grammar — shell prompts (`~/astro-phosphor $ ls apps/`), green checkmarks (`✓`), terracotta welcome asterisks (`✻`), status dots (`●`), tree connectors (`⎿`), and `./app` / `/command` tokens.
- **Zero Drop Shadows, Pure 1px Borders:** Depth is signaled exclusively through step luminance (`#1B1A17` canvas → `#262420` elevated surface) and crisp `1px solid` hairline borders (`#77715F` neutral → `#D97757` focused). The **only** glow in the entire OS belongs to the optional `matrix` preset (`0 0 14px rgba(61, 255, 110, 0.55)`).

### 1.2 Two Physical Worlds (+ Fullscreen Workspace)
1. **Outer Hardware Space (`room` & `close` views, `@media (min-width: 1000px) and (min-aspect-ratio: 6/5)`):**
   - Shares the invariant Macintosh LC desk photograph, matte beige bezel, hardware power LED, and floating bottom-left camera controls documented in [docs/os/hardware.md](../hardware.md).
   - Declares `flatOptics: false` so CLI OS bends authentically inside the physical `#tube-curvature` CRT aperture in `room` and `close` views (flattening cleanly in Reading Mode and Fullscreen), layered with crisp horizontal scanlines, fine gray vertical aperture-grille micro-stripes, deep recessed bezel contour, edge vignette, physical glass glare, and extra curved-corner safe padding on the bottom command dock.
   - Uses `--crt-screen-blend: normal` on `claude`, `light`, and `dark` presets so opaque warm charcoal (`#1B1A17`) and warm parchment (`#FAF9F5`) never wash out against the underlying tube glass.
2. **Fullscreen Mode (`data-zoom="fullscreen"`):**
   - Unwinds bezel clipping, scanlines, and vignette to `0` (`--crt-full: 1`).
   - `--ground-fullscreen` matches the active CLI canvas verbatim (`#1B1A17` for `claude`, `#FAF9F5` for `light`, `#000000` for `dark`/`matrix`) for an authentic edge-to-edge terminal workstation.
3. **Narrow / Tablet (`810px – 1199px`) & Phone (`<= 809px`):**
   - Uses the standard thin synthetic bezel (`30px` tablet / `12px` phone), collapses the left app command rail into a compact 3×3 bordered command tile grid on Phone above the Welcome Box and hero transcript, hides desktop taskbar quick-launch icons to prevent crowding, and guarantees zero horizontal overflow.

---

## 2. Extracted Color Palette & Factory Presets

Prompt OS defines **7 core semantic color variables** (`--bg`, `--bgx`, `--fg`, `--dim`, `--ac`, `--bd`, `--ok`) plus optional `--glow`. Every value below was extracted verbatim from `https://prompt-os.framer.website/`.

### 2.1 Default Factory Preset: `claude` (Warm Obsidian Charcoal × Terracotta)

| Semantic Role | Exact Hex | RGB | Prompt OS Var | CLI Token | Contrast vs `--cli-bg` | Usage & Constraints |
| :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| **Terminal Canvas** | `#1B1A17` | `rgb(27, 26, 23)` | `--bg` | `--cli-bg` | `1.0:1` | Screen canvas, window body fill, dock bar fill, popover background. |
| **Elevated Surface** | `#262420` | `rgb(38, 36, 32)` | `--bgx` | `--cli-surface` | `1.18:1` | Prompt pills, active window titlebar fill, list/menu hover fills, code blocks, table `<thead>`, inset panels. |
| **Primary Ink** | `#E9E6DC` | `rgb(233, 230, 220)` | `--fg` | `--cli-fg` | **`13.6:1` (AAA)** | Display headings, primary body prose, typed input text, active tab text, blinking block cursor. |
| **Muted / Secondary Ink** | `#9D9789` | `rgb(157, 151, 137)` | `--dim` | `--cli-dim` | **`5.9:1` (AA)** | Shell path prefix, `./` command prefix, placeholders, timestamps, excerpts, `⎿` tree rail, status labels. |
| **Primary Accent (Terracotta)** | `#D97757` | `rgb(217, 119, 87)` | `--ac` | `--cli-accent` | **`5.3:1` (AA)** | Welcome Box border, focused window & dock/input border, `caret-color`, slash links, `01`–`09` indices, `✻` badge, primary CTA fill, focus ring, pulsing clock dot. |
| **Accent Hover** | `#E4896B` | `rgb(228, 137, 107)` | *(derived)* | `--cli-accent-hover` | `6.5:1` | Primary CTA hover fill. |
| **Ink on Accent** | `#1B1A17` | `rgb(27, 26, 23)` | *(derived)* | `--cli-accent-ink` | **`5.3:1` on `--ac`** | Primary button label text, active selection ink on terracotta fills. |
| **Hairline Border** | `#77715F` | `rgb(119, 113, 95)` | `--bd` | `--cli-border` | `3.4:1` | Default `1px` border on command dock, buttons, inputs, inactive windows, cards, and media frames. |
| **Subtle Divider** | `#77715F73` | `color-mix(45%)` | *(derived)* | `--cli-border-subtle` | — | Internal list dividers, titlebar/breadcrumb/status hairlines (`color-mix(in srgb, var(--cli-border) 45%, transparent)`). |
| **Success / Tool Indicator** | `#7FB069` | `rgb(127, 176, 105)` | `--ok` | `--cli-ok` | **`7.1:1` (AAA)** | `✓` checkmarks, focused window titlebar `●` dot, status indicators, active menu dots, code strings. |
| **Error / Alert Accent** | `#E06C58` | `rgb(224, 108, 88)` | *(derived)* | `--cli-danger` | `5.1:1` | `/404` dialog titlebar dot and alert states. |
| **Glow** | `transparent` | — | `--glow` | `--cli-glow` | — | Disabled on `claude` for razor-sharp typography. |

### 2.2 All 4 Built-In Factory Presets (`src/os/cli/meta.ts`)

| Token | `claude` *(Default)* | `light` *(Warm Paper)* | `dark` *(Jet Black)* | `matrix` *(CRT Green)* |
| :--- | :---: | :---: | :---: | :---: |
| **`--cli-bg`** (`--bg`) | `#1B1A17` | `#FAF9F5` | `#000000` | `#000000` |
| **`--cli-surface`** (`--bgx`) | `#262420` | `#F0EDE3` | `#111111` | `#03140A` |
| **`--cli-fg`** (`--fg`) | `#E9E6DC` | `#2B2822` | `#E8E8E8` | `#3DFF6E` |
| **`--cli-dim`** (`--dim`) | `#9D9789` | `#675F52` | `#8C8C8C` | `#22B04F` |
| **`--cli-accent`** (`--ac`) | `#D97757` | `#B04629` | `#FF7A59` | `#8DFFA9` |
| **`--cli-accent-hover`** | `#E4896B` | `#973A21` | `#FF9479` | `#B4FFCA` |
| **`--cli-accent-ink`** | `#1B1A17` | `#FAF9F5` | `#000000` | `#000000` |
| **`--cli-border`** (`--bd`) | `#77715F` | `#8A8372` | `#5C5C5C` | `#16863C` |
| **`--cli-ok`** (`--ok`) | `#7FB069` | `#3F7D2C` | `#6FCF97` | `#3DFF6E` |
| **`--cli-glow`** (`--glow`) | `transparent` | `transparent` | `transparent` | `rgba(61, 255, 110, 0.55)` |
| **Polarity (`color-scheme`)** | `dark` | `light` | `dark` | `dark` |
| **FG / BG Contrast** | `13.6:1` (AAA) | `14.1:1` (AAA) | `17.0:1` (AAA) | `14.9:1` (AAA) |

### 2.3 4-Hue Syntax Palette (Shiki Code Blocks)
Keep code highlighting strictly within Prompt OS's 4-hue ceiling (`--cli-fg`, `--cli-accent`, `--cli-ok`, `--cli-dim`):
- **Text / Identifiers / Functions / Parameters:** `var(--cli-fg)`
- **Keywords / Constants / Links:** `var(--cli-accent)`
- **Strings / String Expressions:** `var(--cli-ok)`
- **Comments / Punctuation:** `var(--cli-dim)`

---

## 3. Typography System

### 3.1 Bundled Self-Hosted Font Family
Imported globally in `src/layouts/DesktopLayout.astro` via `@fontsource/ibm-plex-mono` (SIL Open Font License 1.1):
- **Exact `@font-face` Family Name:** `'IBM Plex Mono'`
- **Bundled Weights:** `latin-400`, `latin-400-italic`, `latin-500`, `latin-600`, `latin-700`
- **Unified Stack (`--font-display`, `--font-sans`, `--font-mono`, `--os-font-body`):**
  ```css
  "IBM Plex Mono", "Sarasa Mono SC", "LXGW WenKai Mono", "PingFang SC", "Noto Sans SC", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
  ```
- **OpenType & Numerals:** `--os-font-features: normal` (resets Phosphor's Chivo Mono stylistic sets); `font-variant-numeric: tabular-nums` enforced on indices, dates, stats, tables, and clock.

### 3.2 Responsive Type Scale (Desktop / Tablet / Phone)

Breakpoints: **Desktop** `>= 1200px` | **Tablet** `810px – 1199px` | **Phone** `<= 809px`

| Role / CSS Token | Family | Weight | Tracking | Desktop | Tablet | Phone | Line Height | Usage |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Hero H1 (`--type-h1`)** | `IBM Plex Mono` | `600` | `-0.03em` | `46px` | `36px` | `24px` | `1.10` | Desktop terminal hero heading (`Phosphor`) with terracotta `●` lead marker. |
| **Page Title (`--type-h2`)** | `IBM Plex Mono` | `600` | `-0.025em` | `30px` | `26px` | `22px` | `1.15` | Window page titles (`Work`, `About`, Article `h1`). |
| **Section Title (`--type-h3`)** | `IBM Plex Mono` | `600` | `-0.025em` | `22px` | `20px` | `18px` | `1.25` | Major section headers, KPI stat numbers, next-project heading. |
| **Article H2 (`--type-article-h2`)** | `IBM Plex Mono` | `600` | `-0.025em` | `24px` | `22px` | `20px` | `1.25` | `h2` inside MDX articles & case studies. |
| **Article H3 (`--type-article-h3`)** | `IBM Plex Mono` | `600` | `-0.025em` | `18px` | `17px` | `16px` | `1.35` | `h3` inside MDX articles. |
| **Article H4 (`--type-article-h4`)** | `IBM Plex Mono` | `600` | `-0.01em` | `15px` | `15px` | `15px` | `1.40` | `h4` inside MDX articles. |
| **Body Large (`--type-lead`)** | `IBM Plex Mono` | `400` | `0em` | `16px` | `15px` | `15px` | `1.60` | Page leads & comfortable mobile text input size. |
| **Body (`--type-body`)** | `IBM Plex Mono` | `400` | `0em` | `14px` | `14px` | `14px` | `1.65` | Primary terminal prose, lists, buttons, form controls (`23.1px` computed line height). |
| **Label (`--type-label`)** | `IBM Plex Mono` | `500` | `0em` | `13px` | `13px` | `13px` | `1.35` | Desktop command labels, metadata chips, taskbar clock. |
| **Quote (`--type-quote`)** | `IBM Plex Mono` | `400` | `0em` | `15px` | `15px` | `14px` | `1.60` | `blockquote` (`2px solid var(--cli-accent)` left rule, muted ink). |
| **Nav (`--type-nav`)** | `IBM Plex Mono` | `500` | `0em` | `13.5px` | `13.5px` | `13px` | `1.35` | Command palette items, TOC links, breadcrumbs, tabs. |
| **Quiet (`--type-quiet`)** | `IBM Plex Mono` | `400` | `0em` | `12.5px` | `12.5px` | `12px` | `1.50` | Status strip, footnotes, captions (`color: var(--cli-dim)`). |
| **Table (`--type-table`)** | `IBM Plex Mono` | `400` | `0em` | `13.5px` | `13px` | `12.5px` | `1.50` | Structured spec & MDX comparison tables. |

### 3.3 CJK Prose Overrides
- Chinese/mixed-CJK `:lang(zh)` prose keeps `1.75`–`1.80` line-height, `max-width: 68ch`, and tightens heading tracking to `-0.01em` so Hanzi strokes stay clear and never collide.

---

## 4. OS Chrome & Shared DOM Hook Mapping

All visual rules live strictly under `html[data-os="cli"]` in `src/os/cli/chrome.css` using the shared platform DOM hooks (zero component forks):

### 4.1 Top Bar (`.os-topbar`)
- Hidden (`display: none; --topbar-height: 0px;`, `hasTopBar: false`), matching Prompt OS's direct-to-terminal full-canvas design.

### 4.2 Desktop `/` Layout (`.desktop-icons`, `.os-desktop-widget`, `.desktop-home-wallpaper`, `.desktop-home-footer`)
- **Left Command Rail (`.desktop-icons`):**
  - Desktop: `left: 44px; top: 30px; width: 204px;` (clear of `--window-left: 276px` by `28px`), single-column directory with `~/astro-phosphor $ ls apps/` header, CSS-counter terracotta indices `01`–`06`, `16px` crisp monochrome icons, and `./<label>` command names. Hover/current highlights the row with `var(--cli-surface)` and accents text in `var(--cli-accent)`.
  - Phone (`<= 809px`): Compact 3×3 bordered command tile grid (`border: 1px solid var(--cli-border); border-radius: 6px; background: var(--cli-surface);`) at `top: 14px`.
- **Welcome Box (`.os-desktop-widget`):**
  - Styled verbatim like Prompt OS `.box`: `border: 1px solid var(--cli-accent); border-radius: 6px; background: var(--cli-bg);` positioned at `top: 30px; left: 288px; max-width: 560px;` (`top: 174px` on Phone).
  - Header displays `✻ Welcome · NOW.txt` + pulsing green `●` dot (`.os-widget-badge`); body shows `✓ cwd: ~/astro-phosphor · Astro Phosphor // ...`, site title, and 4 subtle dark tag pills (hides `.os-widget-note` so `home.intro` isn't duplicated); footer displays terracotta `/About me`, `/Browse work`, `/Get in touch` command links with dotted hover underlines.
- **Hero Transcript (`.desktop-home-wallpaper`):**
  - Positioned cleanly below the Welcome Box (`top: 228px; left: 288px; max-width: 660px;` desktop; `top: 360px` Phone).
  - Prepends a Prompt OS prompt pill (`> whoami && ls ~/desk` on `var(--cli-surface)` with `4px` radius), followed by the `46px` weight `600` `-0.03em` `IBM Plex Mono` hero heading (`● Phosphor`) and `TypedText` bio in `var(--cli-dim)` with a flat `steps(1)` blinking block cursor.
- **Desktop Footer (`.desktop-home-footer`):**
  - Aligned to `left: 288px; bottom: 18px;`, pairing muted `12.5px` hint text with a flat `1px`-bordered like counter button.

### 4.3 Flat Terminal Pane Windows (`.os-window`)
- **Frame:** `border-radius: 8px; background: var(--cli-bg); box-shadow: none;` (`0 0 14px var(--cli-glow)` in `matrix`). Focused border uses `1px solid var(--cli-accent)`; unfocused uses `1px solid var(--cli-border)` at `0.94` opacity.
- **Titlebar (`.window-titlebar`):** `min-height: 38px; background: var(--cli-surface);` with bottom hairline `var(--cli-border-subtle)`. `.window-title::before` renders an `8px` circle status bullet (`var(--cli-ok)` focused, `var(--cli-dim)` unfocused, `var(--cli-danger)` on `/404`). `.window-actions .pixel-key` buttons are flat `26×26px` `4px`-radius bordered squares with zero 3D bevels.
- **Breadcrumb Bar (`.window-path`):** `12.5px` muted terminal rail prepending Prompt OS's `⎿` tree connector before `<ol>`, with dotted-underline terracotta hover links. On Phone (`<= 809px`), resets mobile `.window-path` and `.journal-filter-toggle` ink to `var(--cli-fg)` for clean contrast on the dark/light CLI titlebar.
- **Scrollbar & Status Bar:** `6px` rounded flat thumb (`var(--cli-border)` → `var(--cli-accent)` hover) and `12.5px` bottom status strip with `var(--cli-accent)` live right status.

### 4.4 Bottom Command Dock (`.taskbar`) & Slash-Command Palette (`.start-menu`, `.taskbar-os-menu`)
- **Pinned Dock (`.taskbar`):** `66px` desktop (`62px` tablet, `60px` phone) with a top fade collar (`linear-gradient(transparent, var(--cli-bg) 14px)`) and an inner Prompt OS `.inbox` rounded `8px` `1px solid var(--cli-border)` frame (`::before`, shifting to `var(--cli-accent)` on `:focus-within`; shifts `left: 68px` in fullscreen to clear the bottom-left camera button).
- **Dock Controls:** Flat `30px` `Menu` trigger (`background: var(--cli-surface); color: var(--cli-accent);`), flat `30×30px` quick-launch & OS-switcher icons (hidden on Phone `<= 809px` for zero crowding), flat `5px`-radius open-window tabs, compact music strip (`border-color: var(--cli-ok)` while playing), and terracotta tabular clock prefixed by a pulsing `●` indicator.
- **Slash-Command Palette (`.start-menu` / `.start-submenu` / `.taskbar-os-menu`):** Hides `.start-menu-spine`; uses `1px solid var(--cli-border-strong)`, `8px` radius, zero drop shadow, and calm `var(--cli-surface)` hover lift with `var(--cli-accent)` text and green `●` active dots.

### 4.5 Interactive Controls, Cards, 404 Dialog & Dynamic Cursors
- **Buttons (`.pixel-key`):** Flat `6px` radius, `1px solid var(--cli-border)` secondary (`hover` → `var(--cli-surface)` + `var(--cli-accent)`), solid `var(--cli-accent)` / `var(--cli-accent-ink)` primary, subtle `scale(0.97)` press (zero `4px` 3D keycap extrusion).
- **Inputs / Forms:** `8px` radius, `1px solid var(--cli-border)` → `var(--cli-accent)` on focus, `caret-color: var(--cli-accent)`.
- **Cards, KPI Boxes & Media:** `4px`–`6px` radii, crisp `1px` hairlines, zero offset shadows, and `filter: none` on all photographs.
- **404 Error Pane (`.os-window--error`):** `1px solid var(--cli-accent)` `8px` terminal dialog with `404 · ` terracotta prefix, danger titlebar dot, and flat recovery actions.
- **Dynamic Cursors (`cursorStyle: 'terminal-mono'` in `PixelCursors.tsx`):** Flat 1px-stroked geometric terminal pointer, accent-tipped hand, terracotta I-beam, and grab cursors driven by `--os-cursor-{fill,stroke,hi,side}`.

---

## 5. CRT Optics Profile & Motion Rules

| Optical Layer | `claude` / `dark` | `light` | `matrix` | `reading="on"` / `fullscreen` |
| :--- | :---: | :---: | :---: | :---: |
| **`flatOptics` (`#tube-curvature`)** | `false` *(curved CRT)* | `false` *(curved CRT)* | `false` *(curved CRT)* | Flat (`data-reading="on"` / `data-crt-flat="on"`) |
| **`--crt-screen-blend`** | `normal` | `normal` | `screen` | `normal` |
| **`--crt-contour-opacity`** | `0.95` | `0.88` | `0.95` | `0.10` / `0` |
| **`--scanline-alpha`** | `0.15` | `0.12` | `0.15` | `0` |
| **`--crt-grille-alpha`** | `0.055` | `0.05` | `0.055` | `0` |
| **`--crt-aging-tint`** | `transparent` | `rgb(36 32 26 / 0.04)` | `transparent` | `transparent` |
| **`--vignette-alpha`** | `0.26` / `0.28` | `0.15` | `0.30` | `0.08` / `0` |
| **`--crt-bloom-opacity`** | `0.14` / `0.12` | `0` | `0.52` | `0` |
| **`--flicker-display`** | `none` | `none` | `none` | `none` |
| **`--glass-glare-opacity`** | `1` | `1` | `1` | `0` |
| **`--text-glow-body` / `-heading`** | `none` | `none` | `0 0 7px` / `10px var(--cli-glow)` | `none` |

- **Motion:** Subtle `cli-pulse` (`2.4s ease-in-out infinite`) on status dots and `cli-blink` (`1s steps(1) infinite`) on the typing block cursor. All animations disable cleanly under `@media (prefers-reduced-motion: reduce)`.

---

## 6. Strict Do's and Don'ts

### Do
- Keep every text role inside `data-os="cli"` strictly in **`IBM Plex Mono`** (plus CJK monospace fallbacks).
- Keep all windows, popovers, buttons, and cards **flat** (`box-shadow: none`, except subtle `0 0 14px var(--cli-glow)` in `matrix`) with crisp `1px solid` borders and `4px / 6px / 8px / 10px` radii.
- Keep `caret-color: var(--cli-accent)` on text inputs and `outline: 2px solid var(--cli-accent)` on `:focus-visible`.
- Preserve `flatOptics: false` (physical CRT curvature in `room`/`close`, flat in Reading Mode & Fullscreen), `--flicker-display: none`, and `filter: none` on photographs.
- Ensure every CSS selector in `src/os/cli/tokens.css` and `src/os/cli/chrome.css` starts with `html[data-os="cli"]`.

### Don't
- **NEVER** mix serif, geometric sans, or `Jersey 10` pixel display fonts into `data-os="cli"`.
- **NEVER** render 3D extruded pixel keycap bevels, Classic Mac titlebar stripes, or Win95 Start Menu spines inside `data-os="cli"`.
- **NEVER** use heavy drop shadows, glassmorphism blur, or rainbow IDE syntax themes.
- **NEVER** apply phosphor text glow on `claude`, `light`, or `dark` presets (glow belongs strictly to `matrix`).
- **NEVER** replace warm charcoal `#1B1A17` on `claude` with pure `#000000`, or warm parchment `#FAF9F5` on `light` with pure `#FFFFFF`.

---

## 7. Implementation Files

- **OS Metadata & 4 Factory Presets:** [src/os/cli/meta.ts](../../../src/os/cli/meta.ts)
- **Tokens & Semantic Bridge (`--os-*`, `--crt-*`, `--ground`/`--lit-*`, `--astro-code-*`):** [src/os/cli/tokens.css](../../../src/os/cli/tokens.css)
- **Chrome & Responsive Layout Overrides:** [src/os/cli/chrome.css](../../../src/os/cli/chrome.css)
