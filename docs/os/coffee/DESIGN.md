# Coffee OS (`data-os="coffee"`) — Design System Specification

> A warm, tactile 1990s editorial paper-and-ink desktop OS inspired by **Vintage OS** and a **1933 Japanese color dictionary** (Sanzo Wada's *Haishoku Sōkan*), pairing a deep petrol-slate dot-matrix desktop (`#34454C`) with archival cream paper windows (`#F7F0E1`), caramel stippled titlebars (`#BB7125`), hard offset espresso shadows (`#1E2629`), and refined `Instrument Serif` × `DM Sans Variable` × `DM Mono` typography.

**OS Key:** `data-os="coffee"` (one of 5 peer OS styles: `phosphor`, `coffee`, `rainbow`, `cli`, `pixel`)  
**Theme Polarity:** Hybrid — **Dark Petrol-Slate Desktop** (`#34454C`) × **Warm Archival Paper Windows** (`#F7F0E1` / `#FFFDF7`) framed by the physical beige Macintosh LC CRT monitor  
**Primary Aesthetic:** 1933 Japanese Print Palette × 1990s Paper-and-Ink Desktop OS × Editorial Serif Typography  
**Reference Sources:** `framer.com/marketplace/templates/vintage-os/` & live preview `portfolioboss.framer.website`

---

## 1. Visual Metaphor, Aesthetic DNA & Hardware Integration

### 1.1 Aesthetic DNA (`Paper & Ink 256K`)
Unlike `phosphor`'s dark glowing monochrome CRT terminal, **Coffee OS** treats the screen as an **architect's drafting mat and editorial print studio**:
- **Dark Drafting-Mat Desktop (`#34454C`):** A calm, low-saturation petrol slate canvas patterned with a subtle `24×24px` warm-sand dot matrix (`rgba(235, 211, 162, 0.12)`). Desktop typography (`Instrument Serif`) and tilted sticky notes (`#EBD3A2`) stand out through tonal print contrast rather than neon glow.
- **Physical Paper Windows (`#F7F0E1` / `#EDE3CC` / `#FFFDF7`):** Every open application reads as heavyweight archival cream stock bound by crisp espresso ink (`#1E2629`) frames and anchored by solid, zero-blur offset drop shadows (`6px 6px 0 #1E2629` on windows; `4px 4px 0 #1E2629` on cards, buttons, and sticky notes).
- **1933 Color Dictionary Restraint:** Only **three chromatic accents** punctuate the cream-and-espresso paper system:
  1. **Burnt Caramel (`#BB7125`)** — Primary CTAs, titlebar stippled dot grip bar, brand mark accent, active progress bars.
  2. **Deep Roast (`#8A4F14`)** — Hyperlinks, underlines, hover/pressed roast state for caramel controls.
  3. **Muted Olive (`#6B7140`)** — Top-bar availability LED dot, online indicators, positive status & code strings.
- **Tactile Print Micro-Details:** A caramel stippled dot-matrix grip bar (`.window-titlebar-grip`) inside every window titlebar, chunky `14px` framed cream scrollbars on latte tracks, `+1.5deg` tilted sand sticky note (`NOW.txt`), and a floating centered bottom cream dock pill with `3px` espresso bottom-inset active window underlines.

### 1.2 Living Inside Hardware & Fullscreen Views
1. **Macintosh LC CRT Monitor (`data-zoom="room"` and `data-zoom="close"`):**
   - The sunlit beige cabinet (`#BBAE96` / `#E7DBC4`) harmonizes naturally with Coffee OS's cream (`#F7F0E1`), sand (`#EBD3A2`), and caramel (`#BB7125`) surfaces.
   - The deep petrol-slate wallpaper (`#34454C`) sits cleanly inside the rounded tube aperture without harsh white-glare washout, while opened cream paper windows pop as tactile sheets.
   - `flatOptics: false` enables full physical CRT `#tube-curvature` barrel distortion in `room` and `close` views (flattening cleanly in Reading Mode and Fullscreen), paired with `#tube-raster-tight` warm smoked-glass lip, `0.12` horizontal scanlines, `0.05` fine gray aperture-grille micro-stripes, gentle `rgb(36 32 26 / 0.04)` warm tube glass patina, directional `0.88` recessed bezel contour, gentle warm `0.16` perimeter vignette, full glass reflection sheen, and generous curved-corner safe padding on `.os-topbar` and the floating `.taskbar`.
2. **Fullscreen Reading View (`data-zoom="fullscreen"`):**
   - CRT bezel, scanlines, and vignette unwind smoothly over `0.95s cubic-bezier(0.65, 0, 0.35, 1)`.
   - The outer full-viewport background displays the exact petrol-slate dot-matrix wallpaper (`#34454C`) edge-to-edge while keeping `--ground` (`#F7F0E1`) intact inside windows and apps.
   - The bottom-left `Exit fullscreen` control pill adapts to warm cream (`#F7F0E1`) with `1.5px solid #1E2629` framing and `3px 3px 0 #1E2629` shadow.

---

## 2. Extracted Color Palette & Sub-Theme Presets

### 2.1 Canonical Palette (`roast` — Exact Vintage OS 1933 Extraction)

| Semantic Role | Swatch Name | Exact Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| **Desktop Wallpaper** | Petrol Slate | `#34454C` | `.screen-stage` / fullscreen desktop canvas (`--os-desktop-bg`). |
| **Wallpaper Dot Matrix** | Sand 12% | `rgba(235, 211, 162, 0.12)` | `radial-gradient(... 1px, transparent 1.4px)` on `24px × 24px` grid. |
| **Window Surface** | Warm Cream | `#F7F0E1` | Window body, titlebar, `.os-topbar`, floating `.taskbar` dock, scrollbar thumb (`--os-surface`). |
| **Secondary Chrome** | Latte Parchment | `#EDE3CC` | Window path & status bars, clock badge, scrollbar track, code blocks, table `<thead>` (`--os-surface-alt`). |
| **Elevated Card / Paper** | Warm Ivory | `#FFFDF7` | Elevated cards, About 2×2 specs grid, secondary buttons, Start menu, popover panels (`--os-surface-elevated`). |
| **Crisp Input / Pill Fill** | Pure White | `#FFFFFF` | Inputs, textareas, inactive filter pills, text on `#BB7125` CTA buttons (`--os-accent-ink`). |
| **Sand Highlight / Sticky** | Warm Sand | `#EBD3A2` | `NOW.txt` sticky note, desktop hero `h1`/subtitle, dock Menu button, desktop icon hover pill, scrollbar/dock hover. |
| **Primary Ink & Frame** | Espresso Charcoal | `#1E2629` | All text inside windows/chrome, borders, hard offset drop shadows, active pills, taskbar active underline (`--os-ink`). |
| **Muted Ink (60%)** | Muted Espresso | `rgba(30, 38, 41, 0.60)` | Timestamps, secondary metadata, dock clock text, eyebrows, placeholders (`--os-ink-muted`). |
| **Primary Accent** | Burnt Caramel | `#BB7125` | Primary buttons (`.pixel-key--primary`), titlebar stippled dots, brand mark, progress fill (`--os-accent`). |
| **Deep Accent / Links** | Deep Roast | `#8A4F14` | Hyperlinks, underlines, hover state for caramel CTAs (`--os-accent-hover`). |
| **Status Accent** | Muted Olive | `#6B7140` | `.os-topbar-dot` availability LED, online status dots, code string tokens (`--os-status-ok`). |
| **Error Ink** | Editorial Vermilion | `#D92121` | `/404` status badge and validation errors. |
| **Recessed Arcade Stage** | Deep Roasted Obsidian | `#171310` | Recessed dark arcade & dungeon `<canvas>` stages inside cream windows (`src/styles/game-themes.css`) so pixel art stays crisp and high-contrast. |
| **Desktop Icon Hover Plate** | Sand Wash 14% | `rgba(235, 211, 162, 0.14)` | Translucent hover tile plate behind desktop icons on `#34454C`. |

### 2.2 Hard Solid Offset Shadow Scale
- **Focused Window:** `6px 6px 0 #1E2629` (unfocused: `4px 4px 0 rgba(30, 38, 41, 0.45)`)
- **Cards, Sticky Note, Floating Dock, Start Menu & Primary CTAs:** `4px 4px 0 #1E2629`
- **Secondary Paper Buttons & Game Tiles:** `3px 3px 0 #1E2629` (compact icon controls: `2px 2px 0 #1E2629`)
- **Open Dock Item Indicator:** `inset 0 -3px 0 #1E2629`

### 2.3 Factory Presets (`src/os/coffee/meta.ts`)

| `data-theme` ID | Label & Swatch | Wallpaper | Cream Paper | Latte Alt | Sand | Accent / Deep |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `roast` *(Default)* | **Vintage Roast** (`#bb7125`) | `#34454C` | `#F7F0E1` | `#EDE3CC` | `#EBD3A2` | `#BB7125` / `#8A4F14` |
| `matcha` | **Matcha Study** (`#5b6e3d`) | `#2D3D35` | `#F4F2E6` | `#E5E3D2` | `#DCE0B8` | `#5B6E3D` / `#3F4F28` |
| `indigo` | **Indigo Press** (`#3b6289`) | `#2A3647` | `#F3F1EC` | `#E5E1D8` | `#D7DFEA` | `#3B6289` / `#274463` |
| `oat` | **Oat Paper** (`#8a4f14`) | `#4A4640` | `#FAF7F0` | `#EEE8DC` | `#E8DFCF` | `#8A4F14` / `#62360B` |

---

## 3. Typography System

### 3.1 Bundled `@fontsource` Font Families (Imported in `DesktopLayout.astro`)

| CSS Variable | Bundled `@font-face` Family | Bundled Weights / Styles | Full Stack (with CJK Fallbacks) |
| :--- | :--- | :--- | :--- |
| `--font-display` | **`'Instrument Serif'`** | `400` normal & italic | `'Instrument Serif', 'Noto Serif SC', 'Songti SC', 'STSong', Georgia, serif` |
| `--font-sans` | **`'DM Sans Variable'`** | Variable `wght` normal & italic | `'DM Sans Variable', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', system-ui, sans-serif` |
| `--font-mono` | **`'DM Mono'`** | `400` & `500` normal | `'DM Mono', 'Sarasa Mono SC', 'LXGW WenKai Mono', 'PingFang SC', monospace` |

- `body` uses `--os-font-body: var(--font-sans)` and `--os-font-features: normal`.
- `Instrument Serif` headings enable `"blwf" on, "cv03" on, "cv04" on, "cv09" on, "cv11" on`.
- Clocks, dates, item counts, metadata tables, and game scores enforce `font-variant-numeric: tabular-nums`.
- For `:lang(zh)` editorial headings, disable faux oblique (`font-style: normal`) and increase prose `line-height` to `1.75` (`max-width: 65ch`).

### 3.2 Responsive 11-Style Type Scale

Breakpoints: **Desktop** `>= 1200px` | **Tablet** `810px – 1199px` | **Phone** `<= 809px`

| Role | Family | Weight / Style | Desktop | Tablet | Phone | Line Height | Tracking | Usage |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Hero Display (`H1`)** | `Instrument Serif` | `400` normal | `124px` (`132px` FS) | `96px` | `54px` | `0.95` | `-0.04em` | Desktop hero title (`#EBD3A2`). |
| **Window Title (`H2`)** | `Instrument Serif` | `400` normal | `44px` | `40px` | `34px` | `1.00` | `-0.01em` | Window page titles & `/404` heading. |
| **Editorial Italic (`H3`)** | `Instrument Serif` | `400` *italic* | `32px` | `26px` | `20px` | `1.05` | `0em` | Hero subtitle & article/case section titles (`h2`/`h3`). |
| **Serif Lead / Sticky** | `Instrument Serif` | `400` normal | `22px` | `22px` | `20px` | `1.15` | `-0.02em` | `NOW.txt` sticky title & `h4`. |
| **Body Large / Prose** | `DM Sans Variable` | `400` / `700` | `16px` | `16px` | `15px` | `1.60` | `0em` | Article prose, About bio, spec values. |
| **Body / Dialog & CTA** | `DM Sans Variable` | `400` / `600` | `15px` | `15px` | `14px` | `1.55` | `0em` | Standard app body, form inputs, CTA buttons (`14px/600`). |
| **UI Card / Top Brand** | `DM Sans Variable` | `400` / `500` | `13px` | `13px` | `13px` | `1.40` | `-0.02em` (brand) | Card descriptions, top-bar brand name. |
| **Compact UI / Pill** | `DM Sans Variable` | `400` / `500` | `12px` | `12px` | `12px` | `1.30` | `0em` | Filter pills, skill chips, sticky tags. |
| **OS Chrome Mono** | `DM Mono` | `400` / `500` | `12px` | `12px` | `12px` | `1.40` | `0em` | Window titlebars (`500`), top-bar path, toolbar path, dock clock, links (`↗`). |
| **Micro Mono / Icon** | `DM Mono` | `400` | `12px` | `11.5px` | `11px` | `1.35` | `0em` | Desktop icon labels, window status footers, `NOW.txt` filename. |
| **Tracked Eyebrow** | `DM Mono` | `400` | `11px` | `11px` | `11px` | `1.30` | `+0.12em` (`uppercase`) | Section kickers, form labels, spec headers, `HTTP 404`. |

---

## 4. OS Chrome Specifications & Shared Hook Wiring

All Coffee OS chrome rules live strictly under `html[data-os="coffee"]` in `src/os/coffee/chrome.css` using the shared hooks established by the platform:

1. **Passive Top Status Bar (`.os-topbar`, `hasTopBar: true`, `hasBottomBar: true`, `--topbar-height: 32px` / `40px` CRT):**
   - Full-width `#F7F0E1` cream strip with `1.5px solid #1E2629` bottom border — strictly a **passive editorial status strip** with zero duplicated controls (Menu, OS Switcher, Sound, and Clock live exclusively in the bottom dock!).
   - `.os-topbar-left`: Split-circle brand emblem (`.os-topbar-mark`, `14×14px` dual-tone `#F7F0E1`/`#BB7125` circle with `1.5px solid #1E2629` border) + `DM Sans Variable 13px/500` site name link (`/`).
   - `.os-topbar-center`: `DM Mono 12px` active route path or home tagline (`#1E262999`, hidden on phone).
   - `.os-topbar-right`: Olive `#6B7140` ringed `.os-topbar-dot` + active OS label (`● Coffee`) only — visible cleanly on desktop, tablet, and phone.
2. **Desktop `NOW.txt` Sticky Note (`.os-desktop-widget`, `hasDesktopWidget: true`):**
   - Top-right of `/` (`top: 18px; right: 44px; width: 248px;`), `#EBD3A2` warm sand fill, `1.5px solid #1E2629`, `border-radius: 4px`, `box-shadow: 4px 4px 0 #1E2629`, **`transform: rotate(1.5deg)`** on desktop (flat `rotate(0deg)` and full-width on phone `<= 809px` below the 3×3 icon grid).
   - Header shows `NOW.txt` in `DM Mono 11px` + olive status dot; body displays `DM Mono` kicker, `Instrument Serif 22px` title, concise note, compact `#F7F0E1` tag pills, and deep roast `#8A4F14` quick links.
3. **Desktop Canvas, Hero & Icon Rail:**
   - `.screen-stage` renders `#34454C` with `radial-gradient(rgba(235, 211, 162, 0.12) 1px, transparent 1.4px)` at `24px 24px`.
   - Left 2-column icon rail (`--rail-left: 36px; --rail-top: 18px; grid-template-columns: repeat(2, 96px);`) leaves `>= 30px` horizontal gutter clear of default windows (`--window-left: 270px`). Icons render crisp cream/sand strokes with `#1E2629` drop shadows; hovering adds `rgba(235, 211, 162, 0.14)` plate, `-2px` lift, and a solid `#EBD3A2` / `#1E2629` label pill.
   - Right-aligned hero (`h1.hero-title` + italic `TypedText`) renders in `#EBD3A2` warm sand with zero phosphor blur.
4. **Floating Centered Bottom Dock (`.taskbar`):**
   - Centered floating pill (`bottom: 12px; left: 50%; transform: translateX(-50%); height: 58px; border-radius: 10px; border: 2px solid #1E2629; background: #F7F0E1; box-shadow: 4px 4px 0 #1E2629; padding: 6px 10px;`).
   - Left `#EBD3A2` sand Menu pill (`1.5px solid #1E2629`, `6px` radius) separated by `2px solid #1E2629` vertical dividers; hover turns quick-launch dock keys `#EBD3A2`; active app/window tab displays Vintage OS's signature **`box-shadow: inset 0 -3px 0 #1E2629`** underline; right tray holds mini-music pill, OS switcher trigger, speaker key, and boxed `#EDE3CC` live clock (`1.5px solid #1E2629`, `6px` radius).
   - Responsive cleanly on tablet (`900×900`) and phone (`390×844` full-width floating pill with `0px` horizontal overflow).
5. **Archival Paper Windows (`.os-window`):**
   - `#F7F0E1` cream frame, `2px solid #1E2629` outer hairline (via `.os-window::after`), hard `6px 6px 0 #1E2629` shadow (`4px 4px 0 rgba(30,38,41,0.45)` unfocused).
   - `34px` titlebar (`border-bottom: 1.5px solid #1E2629`): `DM Mono 12px/500` left filename (`flex: 0 1 auto`), center `.window-titlebar-grip` (`display: block; flex: 1; height: 12px;` with burnt caramel `#BB7125` `3×3px` stippled dot pattern), right **`22×22px`** square `4px`-radius `#F7F0E1` buttons (`1px solid #1E2629`, hover `#EBD3A2`, close hover `#BB7125`/`#FFFFFF`).
   - Secondary `.window-path` and `.window-status` bars use `#EDE3CC` latte parchment with crisp `#1E2629` dividers and `DM Mono` text.
   - `.window-scroll` applies the exact `14px` framed retro scrollbar (`#EDE3CC` track with `1.5px solid #1E2629` left border, `#F7F0E1` thumb with `1.5px solid #1E2629` border, `#EBD3A2` thumb hover).
6. **Buttons, Inputs, Cards, Code Blocks & Recessed Hardware Screens:**
   - Primary CTAs (`.pixel-key--primary`): `#BB7125` fill, `#FFFFFF` ink, `1px solid #1E2629`, `4px` radius, `3px 3px 0 #1E2629` shadow, hover `#8A4F14`, active `translate(2px, 2px)`.
   - Secondary buttons (`.pixel-key`): `#FFFDF7` ivory fill, `#1E2629` ink, `1px solid #1E2629`, `4px` radius, `3px 3px 0 #1E2629` shadow, hover `#EBD3A2`.
   - Inputs/textareas/selects: `#FFFFFF` background, `1px solid #1E2629`, focus `#BB7125` border + subtle warm caramel halo.
   - Archival print displays & cinema screen: `.music-screen` and `.arcade-canvas-wrap` render warm latte/cream archival displays matching `readPhosphorPalette(hostRef)` (`#F7F0E1` ground, `#1E2629` ink, `#8A4F14` deep roast `--hi` peaks/accents); `.video-screen` stays `#0F1416` dark slate for full-color video playback contrast.
   - Editorial print Shiki code blocks (`--astro-code-*`): `#EDE3CC` background, `1px solid #1E2629` + `3px` `#BB7125` left accent bar, `#8A4F14` keywords, `#6B7140` strings, `#BB7125` constants, `#1E262999` comments.

---

## 5. Hardware CRT Optics Calibration

| Token / Setting | Coffee Value (`reading="off"`) | Coffee Reading (`reading="on"`) | Purpose |
| :--- | :---: | :---: | :--- |
| `meta.flatOptics` | **`false`** | Flat (`data-reading="on"`) | Preserves authentic physical CRT `#tube-curvature` in `room`/`close` views and flattens in Reading Mode & Fullscreen. |
| `--crt-screen-blend` | **`normal`** | `normal` | Prevents `screen` blend mode from washing out opaque `#F7F0E1` paper windows in room view. |
| `--crt-bloom-opacity` | **`0.06`** | `0` | Eliminates dark/amber fog over cream paper. |
| `--crt-contour-opacity` | **`0.88`** | `0.2` | Frames the recessed curved bezel shadow cleanly around the screen perimeter. |
| `--scanline-alpha` | **`0.12`** | `0` | Visible analog CRT scanlines curving with the tube raster. |
| `--crt-grille-alpha` | **`0.05`** | `0` | Fine vertical gray CRT aperture-grille micro-stripes producing authentic phosphor-mesh texture. |
| `--crt-aging-tint` | **`rgb(36 32 26 / 0.04)`** | `transparent` | Subtle warm vintage tube-glass patina so `#F7F0E1`/`#FFFDF7` paper sits naturally behind aged CRT glass. |
| `--vignette-alpha` | **`0.16`** | `0.05` | Gentle warm charcoal curved tube corner shading (`--crt-vignette-rgb: 28 24 20`). |
| `--flicker-display` | **`none`** | `none` | Eliminates eye-fatiguing strobe on bright paper surfaces. |
| `--glass-glare-opacity` | **`1`** | `0` | Full curved CRT dome & window reflection sheen. |
| `--text-glow-body` / `-heading` | **`none`** | `none` | Razor-sharp editorial print ink rendering. |

---

## 6. Strict Do's and Don'ts

### Do
- Keep the **hybrid polarity**: dark petrol-slate dot-matrix desktop (`#34454C`) + archival cream/ivory paper windows (`#F7F0E1` / `#FFFDF7`).
- Keep `--ground` and `--ground-fullscreen` mapped to `#F7F0E1` cream paper (so `html[data-zoom="fullscreen"]` never turns app interiors dark!) while explicitly setting `.screen-stage` and fullscreen outer `.crt-bezel` to `#34454C` (`--os-desktop-bg`).
- Use hard, zero-blur offset drop shadows (`6px 6px 0`, `4px 4px 0`, `3px 3px 0` `#1E2629`) and crisp `#1E2629` borders.
- Keep `.window-titlebar-grip` rendering the signature `#BB7125` caramel stippled dot strip.
- Scope **100%** of selectors in `src/os/coffee/{tokens,chrome}.css` under `html[data-os="coffee"]`.

### Don't
- **NEVER** use soft blurred shadows, `backdrop-filter: blur()`, or neon multi-stop gradients.
- **NEVER** apply phosphor `text-shadow` glow, strobe flicker, or `mix-blend-mode: screen` over Coffee OS paper windows.
- **NEVER** let `:lang(zh)` headings render faux italic (`font-style: italic`) or let windows overlap the left icon rail (`--window-left: 270px`), top `32px` bar, or floating bottom dock.
- **NEVER** hotlink third-party CDN assets (`framerusercontent.com`); use bundled `@fontsource` fonts and pure CSS patterns.
