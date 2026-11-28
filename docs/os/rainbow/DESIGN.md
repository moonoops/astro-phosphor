# Rainbow OS — Design System Specification (`docs/os/rainbow/DESIGN.md`)

> A sunlit, playful **Creative Canvas OS** running inside Astro Phosphor's beige 1990s Macintosh LC CRT monitor (and bezel-free fullscreen studio), faithfully inspired by **Amara Makes**. It fuses Classic Color Macintosh warmth with a Figma-style multi-tab design workspace: warm cream drafting graph paper, razor-sharp `1px solid #000000` vector ink outlines, generous squircle corners, satin light chrome pills, and bold CMY-Pop color blocking (`#FF54DD` Magenta, `#FFCB2E` Marigold, `#8CBCFF` Sky Blue, `#F7AA45` Tangerine).

**OS Theme Key:** `data-os="rainbow"` (default OS; one of 5 peer OS styles: `phosphor`, `coffee`, `rainbow`, `cli`, `pixel`)
**Polarity:** `light` daylight graphic surface inside curved CRT glass (zero dark phosphor haze)
**Primary Aesthetic:** Classic Color Macintosh LC CRT × Creative Design-Tool Canvas (`*.fig` Browser OS) × Pop-Zine Vector Crispness

---

## 1. Visual Metaphor, Aesthetic DNA & Hardware Integration

### 1.1 Aesthetic DNA
- **Two Historical Anchors United:**
  1. **1990 Macintosh LC ("Low-Cost Color") Hardware Anchor:** The Framer Marketplace presentation showcases *Amara Makes* running inside a classic beige CRT Macintosh wearing the six-color Rainbow Apple emblem. Inside our workspace's sunlit physical Macintosh LC desk (`room` and `close` camera views), `data-os="rainbow"` transforms the monitor from a nocturnal amber terminal into an afternoon creative studio workstation.
  2. **Figma-Meets-Zine Creative OS:** Every route behaves like an open `.fig` studio document living on a tactile `15px` architectural graph-paper desk. Windows have per-section CMY-Pop titlebars with three black-outlined macOS-style traffic-light dots, a single persistent **top-only** browser tab strip (`*.fig` tabs + pull-down Figma Start Menu + system tray, with no bottom taskbar so studio windows & games maximize vertical canvas space), magenta `#FF54DD` selection marquees with crisp outlines, slightly tilted sticky-note cards, and crisp `1px solid #000000` print-comic vector borders.
- **Pop-Color Restraint Law:** Surfaces stay calm (`#FAF4E3` warm paper cream and `#FFFFFF` pure white); typography and structural outlines stay pure `#000000` ink; color arrives exclusively in deliberate **CMY-Pop blocks** (titlebars, active tabs, primary CTAs, category pills, sticky notes, folders, selection handles) so every surface exceeds WCAG AAA/AA legibility (`7.9:1` to `21:1` contrast with `#000000` ink).

### 1.2 Three Camera Modes (`room`, `close`, `fullscreen`)
- **Far / Room (`data-zoom="room"`) & Close (`data-zoom="close"`):**
  - `src/os/rainbow/meta.ts` sets `flatOptics: false` so the beige Macintosh LC CRT keeps subtle curved tube glass optics in `room` and `close` views (echoing the Marketplace Macintosh CRT hero).
  - Crucially, `--crt-screen-blend: normal` overrides phosphor's `screen` blend mode so daylight `#FAF4E3`/`#FFFFFF` paper and `#FF54DD`/`#FFCB2E`/`#8CBCFF` pop fills stay saturated and crisp inside the aperture without muddy washout.
  - CRT overlays use the calibrated **Daylight Color CRT Profile** (Section 5): tighter `#tube-raster-tight` smoked-glass lip, directional warm plastic-lip `.crt-contour`, curved `0.12` horizontal scanlines paired with `0.05` fine gray aperture-grille micro-stripes, subtle `rgb(32 30 26 / 0.035)` vintage tube-glass patina, gentle warm charcoal (`rgb(28 24 20 / 0.15)`) edge vignette, full glass reflection sheen, zero text-glow halation, and zero dark-tube flicker.
- **Fullscreen (`data-zoom="fullscreen"`):**
  - Bezel, tube curvature, scanlines, and vignette smoothly unwind (`0.95s cubic-bezier(.65, 0, .35, 1)`).
  - `--ground-fullscreen` resolves to **`#FAF4E3`** (warm paper cream), expanding the `15px` drafting-grid canvas edge-to-edge at 1:1 sharpness for reading, writing, browsing, and games.

---

## 2. Extracted Color Palette & Token Architecture

All values below are extracted verbatim from `amara-ate.framer.website` `:root` Framer design tokens, inspector swatches (`about.fig` / `contact.fig`), and computed DOM rules.

### 2.1 Surfaces, Paper Canvas & Satin Chrome

| Semantic Role | Exact Value | CSS Token | Observed Source / Usage |
| :--- | :--- | :--- | :--- |
| **Pure Surface White** | `#FFFFFF` | `--rb-white` | Top tab bar, elevated cards, window breadcrumb/status bars, circular window controls, white status pills, inputs. |
| **Warm Paper Cream** | `#FAF4E3` | `--rb-cream` | Primary desktop drafting canvas & window interior (`work.fig`, `about.fig`, `final_FNAL.fig`, `contact.fig`, `search.fig`), fullscreen ground. |
| **Warm Paper Alt (Selection Swatch)** | `#F5EFDD` | `--rb-cream-deep` | Listed in `contact.fig` Selection Colours; recessed panels, code block surface, secondary paper fills. |
| **Soft Ivory Highlight** | `#FFFBF0` | `--rb-ivory` | Warm card sheen and Reading Mode crisp paper (`#FFFDF7`). |
| **Warm Sand Neutral** | `#EAE6DD` / `#EEE9DB` | `--rb-sand` | Unfocused window titlebar fill, inactive inspector pills, muted neutral wells. |
| **Satin Light Chrome Gradient** | `linear-gradient(180deg, #FFFFFF 0%, #E2E2E2 100%)` | `--rb-chrome-grad` | Centered floating dock pill & tactile retro toolbar chrome. |
| **Graph-Paper Grid Line** | `rgba(87, 72, 42, 0.17)` | `--rb-grid-line` | `15px × 15px` drafting grid drawn over the desktop canvas (`.ate-grid-y1xfqj`). |

### 2.2 Ink & Calibrated Black Alpha Ramp

| Semantic Role | Exact Value | CSS Token | Contrast on `#FAF4E3` | Usage |
| :--- | :--- | :--- | :---: | :--- |
| **Primary Ink & Vector Outline** | `#000000` | `--rb-ink` | `19.2 : 1` | Primary text, headings, icons, and mandatory `1px solid #000000` outlines on windows, tabs, pills, dock, cards, dots, buttons. |
| **Ink 80% (Strong Body)** | `#000000CC` (`rgba(0,0,0,0.80)`) | `--rb-ink-80` | `12.6 : 1` | Long-form prose, lead intros. |
| **Ink 72% (Secondary)** | `#000000B8` (`rgba(0,0,0,0.72)`) | `--rb-ink-72` | `10.1 : 1` | Subtitles, card excerpts, captions (bridges `--lit-72`). |
| **Ink 56% (Muted Meta)** | `#0000008F` (`rgba(0,0,0,0.56)`) | `--rb-ink-56` | `6.1 : 1` | Timestamps, inactive tab labels, inspector section headers, status bar metadata. |
| **Ink 46% (Quiet / Placeholder)** | `#00000075` (`rgba(0,0,0,0.46)`) | `--rb-ink-46` | `4.5 : 1` | Input placeholders, disabled states, micro-hints. |
| **Ink 30% (Hairline Rule)** | `#0000004D` (`rgba(0,0,0,0.30)`) | `--rb-ink-30` | — | Internal list dividers, table gridlines, resting input borders (bridges `--lit-28`). |
| **Ink 6%–10% (Surface Tint)** | `rgba(0, 0, 0, 0.055)` / `0.08` | `--rb-ink-10` | — | Subtle table `<thead>`, inactive row hover, recessed panel tint (bridges `--lit-10`). |

### 2.3 CMY-Pop Signature Accents & Accessible Ink Pairing

| Accent Name | Exact Hex | CSS Token | Black Ink Contrast | Primary Roles |
| :--- | :--- | :--- | :---: | :--- |
| **Hot Magenta / Bubblegum Pink** | `#FF54DD` | `--rb-pink` | `7.9 : 1` (AAA) | Brand mark tile, OS switcher CTA pill, Work / About / Contact / System titlebars, Figma selection marquees (`1px solid #FF54DD`), focus rings. |
| **Marigold / Sunshine Yellow** | `#FFCB2E` | `--rb-yellow` | `14.1 : 1` (AAA) | Active `.fig` browser tab, `NOW.txt` widget header, Article / Journal / 404 titlebars, active dock pills, primary CTA buttons, sticky notes. |
| **Sky / Periwinkle Blue** | `#8CBCFF` | `--rb-blue` | `10.8 : 1` (AAA) | Info pills, tag badges, inline text `::selection` highlight (`rgba(140, 188, 255, 0.65)`), hover states. |
| **Tangerine / Warm Amber** | `#F7AA45` | `--rb-orange` | `10.7 : 1` (AAA) | Games Hub & 5 Offline Arcade / Magic Tower titlebars, progress accents. |
| **Action Cobalt** *(Utility)* | `#0099FF` | `--rb-cobalt` | `6.6 : 1` (black) | High-emphasis publish/confirm badge; use `#0057C2` for small links/code tokens on light paper (`6.4 : 1` AA). |
| **Apple Leaf Green** *(Status / 6-Color)* | `#61BB46` | `--rb-green` | `8.2 : 1` (AAA) | Online/live status dot (`--os-status-ok`) and `classic` Six-Color preset accent. |
| **Print Magenta Ink (`--hi` bridge)** | `#C7158D` | `--rb-pink-ink` | `4.9 : 1` on `#FAF4E3` | Accessible dark-magenta bridge for legacy `color: var(--hi)` usages (arcade highlights, active bars, code keywords). |

### 2.4 Curated Presets (`src/os/rainbow/meta.ts`)

| Preset Key (`data-theme`) | Swatch | Accent Lead | Character |
| :--- | :---: | :--- | :--- |
| **`studio`** *(Default)* | `#FF54DD` | Full CMY-Pop triad (`#FF54DD` / `#FFCB2E` / `#8CBCFF` / `#F7AA45`) | Canonical **Amara Makes** studio workspace with per-section CMY titlebar rotation. |
| **`marigold`** | `#FFCB2E` | Marigold Yellow lead (`#FFCB2E` primary, `#FF54DD` hover) | Warm sunshine editorial studio variation. |
| **`sky`** | `#8CBCFF` | Sky Periwinkle lead (`#8CBCFF` primary, `#FFCB2E` hover) | Calm architectural blueprint artboard (`work.fig` mood). |
| **`classic`** | `#61BB46` | 1984 6-Color Macintosh Rainbow (`#61BB46`, `#FFCB2E`, `#F7AA45`, `#FF54DD`, `#8CBCFF`) | Classic Rainbow Apple homage over the exact same cream graph-paper & black-outline system. |

---

## 3. Typography System & Responsive Type Scale

### 3.1 Bundled `@fontsource` Families (Aligned with `DesktopLayout.astro`)

All fonts are bundled locally with zero third-party CDN hotlinks:

1. **Primary Display, UI & Body Font (`--font-display`, `--font-sans`, `--os-font-body`):**
   - **Bundled Package:** `@fontsource-variable/outfit/wght.css` -> exact CSS family **`"Outfit Variable"`** (weights `300`–`900`, SIL OFL).
   - **Reference Alignment:** *Amara Makes* uses `Outfit` (`300–900`) across all UI chrome, tabs, buttons, cards, forms, and body copy, paired with geometric display headings. Using `"Outfit Variable"` (`font-weight: 700–800`, tight `-0.02em` tracking) for display headlines delivers 100% geometric harmony and zero external licensing issues.
   - **Stack with CJK Pairing:**
     `"Outfit Variable", "Outfit", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", system-ui, sans-serif`
2. **Code, Spec & Tabular Monospace Font (`--font-mono`):**
   - **Bundled Package:** `@fontsource-variable/chivo-mono/wght.css` -> exact CSS family **`"Chivo Mono Variable"`**.
   - **Stack with CJK Pairing:**
     `"Chivo Mono Variable", "Sarasa Mono SC", "LXGW WenKai Mono", "PingFang SC", ui-monospace, monospace`
   - **Usage:** MDX code blocks, hex swatches, coordinates, arcade scoreboards, `NOW.txt` widget header, and `tabular-nums` clocks.

### 3.2 Responsive Type Scale (Desktop `>= 1200px` | Tablet `810–1199px` | Phone `<= 809px`)

| Role | Family | Weight | Desktop | Tablet | Phone | Line Height (D / T / P) | Usage |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Hero H1 (`--type-h1`)** | `Outfit Variable` | 800 | `80px` | `68px` | `44px` | `0.98 / 1.00 / 0.98` | Desktop home hero wordmark framed inside Figma selection box (`ls: -0.03em`). |
| **Page Title H2 (`--type-h2`)** | `Outfit Variable` | 800 | `52px` | `44px` | `34px` | `1.05 / 1.05 / 1.05` | Window page titles (`Work`, `Journal`, `About`, `Contact`, Article `h1`). |
| **Section H3 (`--type-h3`)** | `Outfit Variable` | 700 | `30px` | `26px` | `22px` | `1.10 / 1.12 / 1.15` | Major section headers, next-project title. |
| **Article H2 / H3 / H4** | `Outfit Variable` | 700 / 600 | `32 / 24 / 19px` | `28 / 22 / 18px` | `24 / 20 / 17px` | `1.15 / 1.20 / 1.25` | MDX article & case-study headings. |
| **Lead (`--type-lead`)** | `Outfit Variable` | 400 | `18px` | `17px` | `15.5px` | `1.45 / 1.45 / 1.45` | Home `TypedText` intro, article lead, page intros. |
| **Body (`--type-body`)** | `Outfit Variable` | 400 | `16px` | `15px` | `15px` | `1.50 / 1.48 / 1.48` | Prose, forms, cards, window titles (`500`). |
| **Table (`--type-table`)** | `Outfit Variable` | 400–500 | `14px` | `14px` | `13.5px` | `1.40 / 1.40 / 1.40` | Spec tables, journal list rows, inspector rows. |
| **Nav / Tabs (`--type-nav`)** | `Outfit Variable` | 500 | `13px` | `13px` | `13px` | `1.20 / 1.20 / 1.20` | Top `.fig` tabs, Start menu rows, breadcrumbs, TOC links. |
| **Label (`--type-label`)** | `Outfit Variable` | 600 | `12.5px` | `12px` | `12px` | `1.20 / 1.20 / 1.20` | Desktop icon labels, status pills, clock, badge pills. |
| **Quiet (`--type-quiet`)** | `Outfit Variable` | 400 | `13px` | `12.5px` | `12px` | `1.35 / 1.35 / 1.35` | Captions, footnotes, muted metadata (`--os-ink-muted`). |

### 3.3 CJK Reading Rules
- CJK articles (`:lang(zh)`) increase body line-height to **`1.75`** (`max-inline-size: 68ch`) and clamp CJK `h1` to `clamp(34px, 5cqw, 48px)` with crisp bold `Outfit Variable` + `PingFang SC` / `Noto Sans SC`.
- `font-variant-numeric: tabular-nums` is enforced on `.os-topbar-clock`, `.taskbar-clock`, dates, counts, and game telemetry.

---

## 4. Shared DOM Hooks & OS Chrome Specifications

Every selector in `src/os/rainbow/chrome.css` is strictly scoped to `html[data-os="rainbow"]` and hooks directly into the shared Layer 2 DOM without altering shared components:

### 4.1 Desktop Drafting Canvas & Icons
- **Wallpaper (`.screen-stage`):** `#FAF4E3` warm paper cream layered with `15px × 15px` drafting graph paper (`rgba(87, 72, 42, 0.17)` at `0.5px` crisp hairlines).
- **Desktop Icon Rail (`.desktop-icons`):** Left 2-column grid (`--rail-left: 34px; --rail-top: 18px; grid-template-columns: repeat(2, 84px); gap: 8px 10px;`), leaving `>= 32px` clear horizontal gutter before default windows (`--window-left: 248px`).
  - Each `.desktop-icon` renders its SVG inside a `46×46px` colorful rounded folder/app badge (`border: 1px solid #000000; border-radius: 12px; box-shadow: 0 2px 0 #000000;`) rotating cleanly through CMY-Pop tints (`#FF54DD`, `#FFCB2E`, `#8CBCFF`, `#F7AA45`, `#FFFFFF`).
  - Hover / Focus: Crisp symmetrical `#FF54DD` Figma selection frame on `.desktop-icon` (`background: rgba(255, 84, 221, 0.08); box-shadow: inset 0 0 0 1.5px var(--rb-pink);` with `2px` on `:focus-visible`) wrapping both the lifted icon (`-2px` + `0 3px 0 #000` shadow, zero shadow-vs-outline collision) and the `#FFCB2E` Marigold label pill (`border: 1px solid #000000; border-radius: 100px;`).
- **Desktop Status Widget (`.os-desktop-widget` on `/`):**
  - Styled as a compact Amara Makes studio card pinned top-right (`top: 18px; right: 44px; width: min(312px, calc(100% - 268px));`, well above the bottom-right hero so they never overlap!).
  - `#FFCB2E` Marigold header (`NOW.txt` + `#61BB46` outlined live dot), `#FFFFFF` crisp card body, CMY-rotated `.os-widget-tags` pills (`#FF54DD`, `#FFCB2E`, `#8CBCFF`, `#F7AA45`), and pill footer links (`#FAF4E3` -> `#FFCB2E` on hover).
- **Desktop Hero & Footer (`/`):**
  - `.desktop-home-wallpaper`: Framed `.hero-title` with crisp `#FF54DD` Figma selection marquee outline + corner dots (`::before`/`::after`), clean `Outfit Variable` `TypedText` with `#FF54DD` hard-blink block cursor (`steps(1)`).
  - `.desktop-home-footer`: Soft cream pill hint strip anchored cleanly above the bottom CRT rim.

### 4.2 Top-Only `*.fig` Browser Tab Bar (`.os-topbar`, `hasTopBar: true`, `hasBottomBar: false`, `height: 46px` / `52px` CRT)
- Full-width `#FFFFFF` strip with `1px solid #000000` bottom border (`--topbar-height: 46px` fullscreen, `52px` CRT room/close with curved-corner safe padding, `48px` phone).
- Bottom `.taskbar` is completely hidden (`display: none !important; --taskbar-height: 0px; --window-bottom: 18px; --wmax-bottom: 18px;`) so windows, creative apps, and games enjoy maximum vertical studio canvas space with zero duplicated navigation controls.
- **`.os-topbar-left`:**
  - `.os-topbar-brand`: `24×24px` `#FF54DD` rounded square `.os-topbar-mark` (`border: 1px solid #000; border-radius: 7px;` with centered `✦`) + bold `.os-topbar-site`.
  - **Top-anchored `<StartMenu placement="top" />`**: `.os-topbar-menu-btn` compact `#FAF4E3` rounded pill (`1px solid #000`, hover/open `#FFCB2E`) opening `#topbar-start-menu-panel` downward as a Figma-styled rounded white popover (`border-radius: 18px`, hot-pink spine, marigold hover, rightward flyout submenus, and inline accordion submenus on phone `<= 580px`).
  - `.os-topbar-links` (`display: inline-flex; align-self: flex-end;`): Renders the 5 primary routes (`Work`, `Article`, `Journal`, `About`, `Contact`) as bottom-flush `.fig` browser tabs (`border-radius: 10px 10px 0 0;`, `::after { content: ".fig"; }`). The active tab (`aria-current="page"`) fills **`#FFCB2E` Marigold** with `1px solid #000` top/side borders merging seamlessly over the bottom border rule!
- **`.os-topbar-center`:**
  - `.os-topbar-tab[data-section]` + `.os-topbar-tab-ext` (`display: inline;` showing `.fig`): Displays the active document file tab in `#FFCB2E` Marigold ONLY when viewing a route outside the 5 quick links (`Design System.fig`, `Magic Tower.fig`, `Minesweeper.fig`, `Tetris.fig`) or a child detail route (`/work/[slug]`, `/journal/[slug]`), and renders a soft cream tagline pill on `/` (no duplicate `Work.fig` next to `Work.fig`; on `<= 960px` where `.os-topbar-links` collapse, the active `.fig` tab stays visible!).
- **`.os-topbar-right`:**
  - `.os-topbar-sound`: Circular sound mute/unmute button (`28×28px`, `1px solid #000`).
  - `.os-topbar-sound`: Circular `28×28px` sound mute toggle (`#FFFFFF`, hover `#8CBCFF`, muted `#EEE9DB`).
  - `.os-topbar-os-btn`: Signature **`#FF54DD` Hot Pink** right-side pill CTA (`1px solid #000`, `radius 100px`), opening `#os-topbar-menu` crisp white `14px`-rounded popover.
  - `.os-topbar-clock`: `tabular-nums` local clock pill (`Chivo Mono 600 12px`).
  - `.os-topbar-status`: Hidden so `OS ▾` isn't duplicated by a redundant status chip.

### 4.3 Fullscreen Hardware Control & Zero Bottom Bar
- With `.taskbar` hidden (`--taskbar-height: 0px`), fullscreen `.camera` sits neatly at bottom-left (`bottom: 12px; left: 12px`) clear of `--window-left: 248px`, maximized windows (`inset: 14px 16px 16px 68px`), and `.desktop-home-footer` (`--hint-start: 72px`).
- On phone (`<= 809px`), `.os-topbar` retains Brand mark (`✦`), `Menu` pill, active yellow `.fig` tab, compact Sound toggle, `OS ▾` switcher, and live Clock with zero horizontal overflow.

### 4.4 Squircle Windows & Per-Section CMY Titlebars (`.os-window`)
- **Frame:** `border-radius: var(--os-radius-window)` (`22px`, upgrading to `28px` superellipse via `@supports (corner-shape: superellipse(2))`; `16px` on phone), `1px solid #000000` hairline outline (`.os-window::after`), `#FAF4E3` warm paper interior, soft warm studio shadow `0 14px 36px rgba(34, 22, 10, 0.16), 0 2px 6px rgba(0, 0, 0, 0.08)`, `overflow: hidden`.
- **Per-Section CMY Titlebar Color Coding (via `.screen-stage[data-section="..."]`):**

| Section(s) | Focused Titlebar Fill | Traffic Dots (`.window-titlebar-dots > i`) |
| :--- | :--- | :--- |
| `work`, `about`, `contact`, `system` | **`#FF54DD` Hot Pink** | White `#FFF` · Yellow `#FFCB2E` · Blue `#8CBCFF` |
| `article`, `journal`, `error` (`/404`) | **`#FFCB2E` Marigold Yellow** | White `#FFF` · Pink `#FF54DD` · Blue `#8CBCFF` |
| `browser`, `chat`, `message-board` | **`#8CBCFF` Sky Blue** | White `#FFF` · Yellow `#FFCB2E` · Pink `#FF54DD` |
| `music`, `video`, `spd`, `mota`, `minesweeper`, `tetris`, `snake`, `game2048` | **`#F7AA45` Tangerine** | White `#FFF` · Pink `#FF54DD` · Blue `#8CBCFF` |
| Stacked Child (`.os-window--child`) | Contrasting `#FFCB2E` (over pink parent) or `#FF54DD` (over yellow parent) | High-contrast triad |
| Unfocused (`[data-wfocus="off"]`) | `#EEE9DB` Warm Sand | Muted (`opacity: 0.55`) |

- **Titlebar Controls:**
  - Left: `.window-titlebar-dots` (`display: inline-flex; gap: 6px;`), 3 `12×12px` circles with `1px solid #000000` outlines.
  - Center/Left: `.window-title` (`Outfit Variable`, `font-weight: 600`, `14.5px`, `#000000`).
  - Right: `.window-actions .pixel-key` (`28×28px` circular `#FFFFFF` buttons with `1px solid #000000` outline; hover `#FFCB2E` for maximize, `#FF54DD` for close).
- **Breadcrumb Bar (`.window-path`) & Status Bar (`.window-status`):** Crisp `#FFFFFF` strips with `1px` borders, pill hover links, and custom rounded pill scrollbar (`rgba(0,0,0,0.24)` thumb -> `#FF54DD` hover).

### 4.5 Dynamic Vector Cursors (`cursorStyle: 'soft-pointer'`)
Wired through `PixelCursors.tsx`:
- `--os-cursor-fill: #ffffff` (crisp white macOS/Figma studio vector arrow, pointing hand, open grab hand, grabbing fist, and I-beam halo)
- `--os-cursor-stroke: #000000` (sharp `1.6px` pure black outline and interior finger/knuckle divider strokes)
- `--os-cursor-hi: #ff54dd` (theme accent)
- `--os-cursor-side: #ff54dd` (vibrant theme-matched CMY wrist cuff on hand cursors + subtle offset shadow behind arrow)

---

## 5. Daylight Color CRT Optics Profile

Directly modeled on Amara Makes' `[data-ate-screen]` daylight CRT overlay so vibrant CMY colors remain crisp inside the beige Macintosh LC glass:

| Optical Layer / Token | Rainbow Default (`room` / `close`) | Reading Mode (`data-reading="on"`) | Fullscreen (`data-zoom="fullscreen"`) |
| :--- | :--- | :--- | :--- |
| `meta.flatOptics` | `false` *(physical Macintosh CRT barrel curve)* | Flat (`data-reading="on"`) | Flat (`data-crt-flat="on"`) |
| `--crt-screen-blend` | **`normal`** *(prevents cream/white washout)* | `normal` | `normal` |
| `--scanline-alpha` | **`0.12`** curved horizontal scanlines (`3px` pitch) | **`0.02`** | `0` |
| `--crt-grille-alpha` | **`0.05`** fine gray vertical aperture-grille micro-stripes (`3px` pitch) | **`0`** | `0` |
| `--crt-aging-tint` | **`rgb(32 30 26 / 0.035)`** subtle aged tube glass patina | **`transparent`** | `transparent` |
| `--vignette-alpha` | **`0.15`** warm charcoal `rgb(28 24 20 / ...)` | **`0.05`** | `0` |
| `--crt-bloom-opacity` | **`0`** *(never muddy light paper with dark bloom)* | `0` | `0` |
| `--crt-contour-opacity` | **`0.85`** recessed curved bezel contour | `0.15` | `0` |
| `--flicker-display` | **`none`** *(no black pulse over daylight paper)* | `none` | `none` |
| `--glass-glare-opacity` | **`1`** full curved dome & window reflection sheen | `0` | `0` |
| `--text-glow-body` / `-heading` | **`none`** *(razor-sharp black ink)* | `none` | `none` |
| `.phosphor-picture img` | `filter: none` *(100% true-color photography)* | `filter: none` | `filter: none` |

---

## 6. Strict Do's and Don'ts

### Do
- Keep every primary frame, active tab, window dot, pill, card, and dock outlined with crisp **`1px solid #000000`**.
- Pair `#000000` ink on `#FFFFFF`, `#FAF4E3`, `#FF54DD`, `#FFCB2E`, `#8CBCFF`, and `#F7AA45` for effortless `7.9:1 – 21:1` readability.
- Use `#C7158D` for `--hi` so legacy app selectors using `color: var(--hi)` on `#FAF4E3` maintain `4.9:1` WCAG AA contrast.
- Keep `html[data-os="rainbow"]` scoping on every rule in `src/os/rainbow/{tokens,chrome}.css` so peer OSes (`phosphor`, `coffee`, `cli`, `pixel`) have zero leakage.
- Keep `.desktop-home` on phone (`<= 809px`) positioned cleanly below the 3×3 icon grid (`inset: 248px 0 0`) so `.os-desktop-widget` and `.desktop-home-wallpaper` stack vertically with zero overlap and clickable icons.

### Don't
- **NEVER** apply dark phosphor `text-shadow` glow, `--crt-screen-blend: screen`, or black flicker layers (`.crt-fl1`/`.crt-fl2`) inside `data-os="rainbow"`.
- **NEVER** put `#FFFFFF` body text on `#FFCB2E` Yellow, `#8CBCFF` Sky Blue, `#F7AA45` Tangerine, or `#FF54DD` Hot Pink.
- **NEVER** leave Phosphor's 4px stepped `::before` pixel-keycap extrusions visible on Rainbow's floating dock, Start menu button, or circular window buttons.
- **NEVER** hotlink `framerusercontent.com` fonts or images; consume locally bundled `@fontsource-variable/outfit` and `@fontsource-variable/chivo-mono`.
- **NEVER** override Layer 1 hardware geometry variables (`--photo-*`, `--aperture-*`, `--crt-zoom`, `--crt-full`).
