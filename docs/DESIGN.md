# Astro Phosphor — Design System Specification (`DESIGN.md`)

> A photorealistic 1990s beige CRT monitor resting on a time-of-day lit desk, running a high-contrast monochrome phosphor OS that pairs Classic Macintosh striped window chrome with a Windows 95/98-style bottom taskbar, Start Menu, and tactile 3D pixel keycaps.

**Theme:** `dark` (monochrome phosphor inside the CRT) framed by `warm-analog` (five-scene daylit/nocturnal physical desk & beige plastic bezel)
**Primary Aesthetic:** 1990s Retro Desktop OS × Single-Hue Phosphor CRT × Editorial Pixel Display

---

## 1. Visual Metaphor & Core Recipe

- **Two Physical Worlds (+ Fullscreen Surface):**
  1. **Outer Hardware Space (`@media (min-width: 1000px) and (min-aspect-ratio: 6/5)`)**: Photorealistic 1990 Macintosh LC desk environment with five automatic time-of-day lighting scenes (`morning`, `noon`, `afternoon`, `dusk`, `night`), matte beige CRT bezel, glowing hardware power LED, and floating bottom-left monitor controls supporting 3 states:
     - **Far / Room (`room`, default)**: Shows the monitor centered in the sunlit desk composition; controls offer `Zoom in (+)`, `Enter fullscreen (F)`, and `Power`.
     - **Close (`close`)**: Zooms tightly onto the CRT bezel with zero horizontal drift; controls offer `Zoom out (−)`, `Enter fullscreen (F)`, and `Power`.
     - **Fullscreen (`fullscreen`)**: Bezel-free 1:1 full-viewport deep-charcoal (`--ground-fullscreen: #121418`) workspace maximizing reading/editing space; CRT curvature and tube aperture mask smoothly flatten over `0.95s`; bottom-left control offers `Exit fullscreen (F)`.
  2. **Inner CRT Screen (`1545 : 1087` aspect ratio, `1120px` virtual stage width)**: Deep blue-black phosphor tube (`#020B14`) illuminated by a **single primary phosphor hue** (`--lit`, default Amber `#FFB648`), layered beneath scanlines, edge vignette, phosphor bloom, tube curvature, and subtle window reflection.
- **Single-Hue Derivation Law:** Every screen ink, translucent border, surface tint, 3D keycap bevel highlight, extruded key shadow, glow halo, Shiki syntax token, Canvas arcade sprite, and custom SVG pixel cursor MUST derive mathematically from `--lit` and `--ground`. Swapping `--lit` alone recolors the entire OS instantaneously.
- **Controlled Nostalgia for Real Reading:** Keep windows, keys, inputs, and pixel icons uncompromisingly crisp (`0px` radius, `2px` pixel edges, `steps(1)` cursor blink), while offering one-click **Reading Mode** (`data-reading="on"`) that dials back scanlines, vignette, glare, glow, and flicker for long-form Latin and CJK essays.

---

## 2. Colors & Single-Hue Token Architecture

### 2.1 Base & Derived Screen Tokens

All inner-screen tokens derive from `--lit` and `--ground` via `color-mix(in srgb, ...)` in [`src/styles/tokens.css`](../src/styles/tokens.css):

| Semantic Name | Amber Resolved | CSS Token | Formula / Exact Value | Role & Usage Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Phosphor Ink (Lit)** | `#FFB648` | `--lit` | Theme base color | Primary text, icons, focused titlebar fill, primary key face, focus outlines, cursor fill. |
| **Screen Ground** | `#020B14` | `--ground` | `#020B14` (`#121418` fullscreen) | Deep blue-black CRT canvas (NEVER pure `#000000`), window body fill, inverse text on lit fills, cursor outline. |
| **Rule (28%)** | `#FFB64847` | `--lit-28` | `color-mix(in srgb, var(--lit) 28%, transparent)` | Inactive window borders, list row dividers, table grid lines, secondary hairlines. |
| **Tint (10%)** | `#FFB6481A` | `--lit-10` | `color-mix(in srgb, var(--lit) 10%, transparent)` | Input fields, table `<thead>`, code blocks, subtle hover fills. |
| **Muted Ink (72%)** | `#FFB648B8` | `--lit-72` | `color-mix(in srgb, var(--lit) 72%, transparent)` | Excerpts, timestamps, metadata, captions, inactive taskbar tabs. |
| **Bevel Highlight** | `#FFDBA4` | `--hi` | `color-mix(in srgb, var(--lit) 50%, white)` | 2px top/left highlight on 3D pixel keys (`ButtonBase`), SVG cursor specular pixel, syntax keywords. |
| **Extruded Shadow** | `#74582B` | `--side` | `color-mix(in srgb, var(--lit) 45%, var(--ground))` | 3D keycap extruded shadow (`2px` + `4px` offset), dimmed accents, cursor shadow. |

### 2.2 Switchable Phosphor Theme Presets (`<html data-theme="...">`)

| Theme Key | `--lit` Hex | Character |
| :--- | :--- | :--- |
| `amber` *(Default)* | `#FFB648` | Warm 1980s/90s amber monochrome CRT monitor. |
| `green` | `#4AF626` | Classic P1/P39 green phosphor terminal. |
| `blue` | `#5CC8FF` | Cool cyan-blue phosphor workstation. |
| `white` | `#E8ECF2` | Paper-white monochrome Macintosh / NeXT display. |

### 2.3 Outer Hardware & Five-Scene Room Tokens (Invariant Across Screen Themes)

| Name | Value | Token | Role |
| :--- | :--- | :--- | :--- |
| **Room Fallback** | `#6B5846` (varies by scene) | `--room-bg` | Ambient fallback before room plate decodes (`morning`, `noon`, `afternoon`, `dusk`, `night`). |
| **Hardware Bezel** | `#BBAE96` / `#E7DBC4` / `#504738` | `--hardware-base/hi/shadow` | Compact plastic bezel gradients and power switch accents on narrow viewports. |
| **Power-Off Tube** | `#010306` | `--crt-off` | Unlit CRT glass overlay when powered off. |
| **Wake Prompt Ink** | `rgba(255, 255, 255, 0.32)` | `--crt-wake` | Subtle wake prompt when screen power is switched off. |
| **Power LED (On / Standby)** | `rgb(93,255,155)` / `rgb(255,171,61)` | `--crt-led` / `--crt-led-standby` | Bezel indicator LED glow (`green` on, `amber` standby). |
| **Zoom Pill Surface** | `rgba(2, 11, 20, 0.72)` | `--zoom-bg` | Floating bottom-left hardware camera controls. |

---

## 3. Typography & Responsive Type Scale

### 3.1 Self-Hosted Font Families

- **Display Pixel Font (`--font-display`)**: `"Jersey 10"` (self-hosted via `@fontsource/jersey-10`, weight `400`).
  - Stack: `"Jersey 10", "PingFang SC", "Noto Sans SC", sans-serif`
- **UI & Body Monospace (`--font-mono`)**: `"Chivo Mono Variable"` (self-hosted via `@fontsource-variable/chivo-mono`, normal & italic).
  - OpenType features: `font-feature-settings: "blwf" on, "cv03" on, "cv04" on, "cv09" on, "cv11" on;`
  - Stack: `"Chivo Mono Variable", "Sarasa Mono SC", "LXGW WenKai Mono", "PingFang SC", "Noto Sans SC", monospace`
- **Tabular Numerals:** Enforced via `font-variant-numeric: tabular-nums` on the taskbar clock, journal dates, project years, tables, arcade LEDs, and lightbox counters.

### 3.2 Exact 13-Style Responsive Type Scale

Breakpoints: **Desktop** `>= 1200px` | **Tablet** `810px – 1199px` | **Phone** `<= 809px`

| Role | Family | Desktop | Tablet | Phone | Line Height (D / T / P) | Usage |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Heading 1** | `Jersey 10` | `180px` | `190px` | `100px` | `0.80 / 0.80 / 0.82` | Desktop wallpaper hero display name. |
| **Heading 2** | `Jersey 10` | `100px` | `76px` | `60px` | `0.85 / 0.85 / 0.85` | Window page titles (`Work`, `About`, `Journal`, article `h1`). |
| **Heading 3** | `Jersey 10` | `52px` | `44px` | `38px` | `0.90 / 0.90 / 0.90` | Section titles, next-project heading. |
| **Article H2** | `Jersey 10` | `46px` | `40px` | `34px` | `0.95 / 0.95 / 0.95` | `h2` inside MDX prose. |
| **Article H3** | `Jersey 10` | `32px` | `30px` | `26px` | `1.00 / 1.00 / 1.00` | `h3` inside MDX prose. |
| **Article H4** | `Jersey 10` | `24px` | `24px` | `22px` | `1.05 / 1.05 / 1.05` | `h4` inside MDX prose. |
| **Body Large** | `Chivo Mono` | `20px` | `19px` | `17px` | `1.45 / 1.45 / 1.45` | `TypedText` intro, article lead paragraph, page intros. |
| **Body** | `Chivo Mono` | `17px` | `17px` | `16px` | `1.50 / 1.45 / 1.45` | Prose, titlebar, breadcrumbs, status bar, keys, inputs, tables. |
| **Label** | `Chivo Mono` | `15px` | `15px` | `14px` | `1.25 / 1.25 / 1.25` | Desktop icon labels, dates, metadata, clock. |
| **Quote** | `Chivo Mono` | `19px` | `18px` | `17px` | `1.45 / 1.45 / 1.45` | `blockquote` (`2px` solid `--lit` left bar, `padding-inline-start: 22px`). |
| **Nav** | `Chivo Mono` | `15px` | `15px` | `14px` | `1.25 / 1.25 / 1.25` | Sidebar TOC links, breadcrumbs, taskbar tabs. |
| **Quiet** | `Chivo Mono` | `15px` | `15px` | `14px` | `1.40 / 1.40 / 1.40` | Captions, footnotes, muted helper hints (`color: var(--lit-72)`). |
| **Table** | `Chivo Mono` | `16px` | `15px` | `14px` | `1.40 / 1.40 / 1.40` | Spec & MDX tables (`border: 1px solid var(--lit-28)`, `thead` `--lit-10`). |

### 3.3 CJK Long-Form Prose & Monochrome Code Blocks

- **Chinese / CJK Entries (`lang="zh-CN"`):**
  - Increase body `line-height` to **`1.75`** (`16px–17px`), keep prose measure within `max-width: 68ch`.
  - Scale down massive Latin `Jersey 10` display headers proportionally (`h1` `48px–64px`, `h2` `32px–36px`, `h3` `24px–26px`) so Hanzi titles stay crisp and scannable.
- **Code Blocks (`pre > code`):**
  - Uses Astro Shiki `theme: 'css-variables'` mapped strictly to `--hi`, `--lit`, `--lit-72`, and `color-mix(in srgb, var(--lit) 55%, transparent)` over `--lit-10` fill with `1px solid var(--lit-28)` and `0px` radius. **NEVER** apply multi-color syntax themes.

---

## 4. Layout, Breakpoints & Spatial Geometry

### 4.1 Breakpoints & Container Queries

| Breakpoint | Media / Container Query | Behavior |
| :--- | :--- | :--- |
| **Desktop** | `>= 1200px` | Full desktop scale, draggable/maximizable windows, 2-column journal reading view, flyout Start Menu submenus. |
| **CRT Room View** | `@media (min-width: 1000px) and (min-aspect-ratio: 6/5)` | Activates 5-scene room photography (`1672×941` coordinate grid), curved tube aperture mask, hardware LED, and floating Zoom/Fullscreen/Power controls. |
| **Tablet / Narrow** | `810px – 1199px` (or `< 1000px` / aspect `< 6:5`) | Switches cleanly to compact full-viewport bezel (`--crt-bz: 30px`) tinted by the active time-of-day scene. |
| **Phone** | `<= 809px` | Thin bezel (`--crt-bz: 12px`), desktop icons arrange into a centered **3×2 grid**, taskbar hides status ticker, windows fill viewport with Maximize hidden, sidebars stack vertically. |
| **Component Container** | `@container (max-width: 520px)` | Switches `SetupWizard` and `FAQPanel` from horizontal/split layout to vertical accordion regardless of viewport width. |

### 4.2 Reference Dimensions (`1120px` Virtual Stage Space)

- **Base Grid Unit:** `4px` (`4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64px`).
- **Inner Border Radius:** **`0px`** on EVERY element inside the OS. Only the outer CRT glass aperture uses physical tube curvature.
- **Desktop Icon Rail:** 6 icons arranged in 2 columns × 3 rows at top-left (`3×2` centered on phone). Default open windows leave `>= 24px` horizontal clearance from the icon rail.
- **Maximized Window (`>= 810px`):** `inset: 28px 28px var(--wmax-bottom, 80px) 28px`.
- **Error Dialog (`/404`):** Compact `461 × 290px` centered modal.

---

## 5. CRT Optical Stack & Hardware Motion

All optical overlays live inside `CRTScreen.tsx` / `TubeOptics.tsx` with **`pointer-events: none`**.

### 5.1 Optical Layers

1. **Progressive Tube Curvature & Aperture Mask (`TubeGlass.astro`, `TubeOptics.tsx`)**: SVG displacement filter (`@supports (filter: url("#tube-curvature"))`) plus calibrated `glassPath` / `rasterPath` clipping and inverse pointer-projection (`signal-lens.ts`) so clicks and window drags remain pixel-accurate across curved glass. Automatically flattens smoothly in Fullscreen and Reading Mode.
2. **Inner Tube Contour & Phosphor Bloom**: Subtle dark inner bezel contour + radial `--lit` ambient screen glow.
3. **Horizontal Scanlines**: `repeating-linear-gradient(to bottom, rgb(0 0 0 / var(--scanline-alpha)) 0 1px, transparent 1px 3px)` (`0.16` default -> `0.04` Reading Mode).
4. **Edge Vignette**: Radial edge darkening (`0.60` default -> `0.28` Reading Mode).
5. **Micro-Flicker**: Dual jitter + breath layers (hidden in Reading Mode and `prefers-reduced-motion: reduce`).
6. **Window Glass Reflection**: Time-of-day tinted window reflection mask (`macintosh-lc-window-reflection.webp`) hidden at night and in Reading Mode / Fullscreen.
7. **Phosphor Text Glow**: Soft dual-layer text shadow derived from `currentColor` (dialed down to `2px / 25%` in Reading Mode for crisp CJK strokes).

### 5.2 Motion Curves

| Animation | Properties | Duration & Easing | Trigger |
| :--- | :--- | :--- | :--- |
| **CRT Power-On / Entry Ignition** | Filament pre-heat -> horizontal flyback strike -> vertical unfold -> focus lock | `1.9s` (`1.75s` initial entry) | Power toggle ON or first session visit (never on route swaps). |
| **CRT Power-Off Collapse** | HV flash -> vertical collapse -> horizontal dot -> phosphor afterglow | `1.65s` + afterglow | Power toggle OFF or `Menu -> Turn Off`. |
| **Camera State Transition** | `@property --crt-zoom`, `--crt-full`, `--ground` | `0.95s cubic-bezier(0.65, 0, 0.35, 1)` | Bottom-left camera buttons or `+` / `-` / `F` keys. |
| **3D Pixel Key Press** | `translate(4px, 4px)` + shadow collapse | `35ms linear` | `:active` on all `.pixel-key` buttons. |
| **TypedText Cursor Blink** | `opacity: 1` / `0` | `1.06s steps(1) infinite` | Hard on/off step — NEVER eased. |

---

## 6. Signature Components

- **3D Tactile Pixel Key (`ButtonBase.tsx`)**: Primary (`--lit` face, `--ground` ink) and Secondary/Icon (`--ground` face, `--lit` ink) sharing `inset 2px 2px 0 var(--hi), inset 0 0 0 2px var(--lit), 2px 2px 0 var(--side), 4px 4px 0 var(--side)`. Collapses cleanly by `(4px, 4px)` on `:active`.
- **Draggable Window (`Window.tsx`)**: Classic Mac striped focused titlebar, breadcrumb path bar (`pathEnd` slot for `JournalFilter`), scrollable pane with thin phosphor scrollbar, status bar, focus elevation, double-click titlebar maximize, viewport clamping, and `Escape` close.
- **Taskbar & Start Menu (`Taskbar.tsx`, `StartMenu.tsx`, `Clock.tsx`, `AfternoonSound.tsx`)**: Pinned bottom rail with Win95-style cascading Start Menu (keyboard arrow & `Escape` navigable), quick-launch pixel keys, focused/parent window tabs, live `HH:MM` tabular clock, and mute toggle for synthesized Web Audio game cues.
- **Dynamic Pixel Cursors (`PixelCursors.tsx`)**: Injects crisp SVG data-URI cursors (`arrow`, `hand`, `text`, `grab`, `grabbing`) recolored live whenever `--lit` changes.
- **True-Color Lightbox (`GalleryLightbox.tsx`)**: Renders above scanlines/curvature so portfolio and journal images can be inspected in 100% true color with keyboard navigation.
- **Offline Monochrome Arcade Games**: Canvas games read live CSS tokens via `readPhosphorPalette()` and use distinct pixel textures (not multi-color palettes) so every game stays legible across all four monochrome themes.

---

## 7. Strict Do's and Don'ts

### Do
- Keep every inner-OS border radius strictly **`0px`**.
- Use color inversion (`--lit` background + `--ground` text) and `4px` pixel key depression for tactile feedback.
- Use `shape-rendering="crispEdges"` on all custom pixel SVGs and cursors.
- Bind every component color to CSS variables so all 4 themes work automatically.
- Strip native `<select>` arrows (`appearance: none`) before adding a single `<PixelIcon name="chevron" />`.

### Don't
- **NEVER** use rounded corners (`rounded-*`), glassmorphism (`backdrop-blur`), soft diffused drop shadows (`shadow-lg`), or multi-stop gradients inside the CRT screen.
- **NEVER** use pure `#000000` for `--ground` — always use `#020B14` (or `#121418` in fullscreen).
- **NEVER** install anti-aliased icon packs (`lucide-react`, `heroicons`, FontAwesome) for OS chrome.
- **NEVER** use multi-color syntax themes or unprompted accent colors inside the monochrome tube.
- **NEVER** let CRT optical layers capture pointer events (`pointer-events: none` is mandatory).
- **NEVER** replay the CRT warm-up blur on regular page navigation.
