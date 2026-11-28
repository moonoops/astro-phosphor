# Phosphor CRT OS — Design System Specification (`data-os="phosphor"`)

> The flagship 1990s high-contrast monochrome phosphor desktop OS for this platform: Classic Macintosh striped window chrome paired with a Windows 95/98-style bottom taskbar, Win95 Start menu, and tactile 3D extruded pixel keycaps inside the physical CRT monitor.

**OS ID:** `phosphor` (`html[data-os="phosphor"]`)
**Sub-Themes (`data-theme`):** `amber` *(default)* | `green` | `blue` | `white`
**Primary Aesthetic:** 1990s Retro Desktop OS × Single-Hue Phosphor CRT × Editorial Pixel Display
**Related Specs:** [Master Design Index & Token Contract](../../DESIGN.md) · [Physical Hardware & CRT Shell](../hardware.md)

---

## 1. Visual Metaphor & Core Recipe

- **Monochrome Phosphor Tube Inside Physical Hardware:**
  - Inside the physical Macintosh LC CRT aperture (`1120px` virtual design width, `1545 : 1087` aspect ratio; see [hardware.md](../hardware.md)), Phosphor renders a deep midnight-black phosphor tube (`#020B14`, never pure `#000000`) lit by a **single primary phosphor hue** (`--lit`, default Amber `#FFB648`).
  - In **Fullscreen (`data-zoom="fullscreen"`)**, the tube ground transitions smoothly to deep charcoal (`--ground-fullscreen: #121418`) while keeping the crisp single-hue phosphor UI and independent Reading Mode control.
- **Single-Hue Derivation Law (Mandatory for `phosphor`):**
  - Every screen ink, translucent border, subtle surface tint, 3D button bevel highlight, extruded key shadow, glow halo, Shiki code token, and custom pixel cursor MUST derive mathematically from `--lit` and `--ground` via `color-mix(in srgb, ...)`.
  - Swapping ONE color (`--lit`) recolors the entire Phosphor OS instantaneously across all 4 presets (`amber`, `green`, `blue`, `white`).
- **Controlled Nostalgia for Real Reading:**
  - Keep the desktop, window chrome, buttons, and icons uncompromisingly crisp and retro (`0px` border radius everywhere inside the OS, `2px` pixel edges, `steps(1)` hard cursor blink).
  - Provide a one-click **Reading Mode** (`data-reading="on"`) that dials back scanlines, edge vignette, micro-flicker, glass glare, and body text glow during long-form `/journal` reading.
- **Chrome Slots:**
  - `hasTopBar: false` (`--topbar-height: 0px`; `.os-topbar` is hidden in `phosphor`).
  - `hasDesktopWidget: false` (`.os-desktop-widget` is hidden in `phosphor`; the desktop stays clean with the 2-column icon rail, `TypedText` intro, and giant `Jersey 10` hero title).

---

## 2. Colors & Single-Hue Token Architecture

### 2.1 Base & Derived Screen Tokens

All Phosphor screen tokens derive from `--lit` and `--ground` via `color-mix(in srgb, ...)`:

| Semantic Name | Amber Resolved | CSS Token | Formula / Exact Value | Role & Usage Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Color (Lit)** | `#FFB648` | `--lit` | Theme base color | Primary text, icons, active titlebar fill, primary key face, focused borders, cursor fill. |
| **Screen Ground** | `#020B14` | `--ground` | `#020B14` (`#121418` fullscreen) | Deep blue-black CRT background (NEVER pure `#000000`), window body fill, inverse text on lit fills, cursor outline. |
| **Brand 28% (Rule)** | `#FFB64847` | `--lit-28` | `color-mix(in srgb, var(--lit) 28%, transparent)` | Inactive window borders, list row dividers, table grid lines, secondary dividers. |
| **Brand 10% (Tint)** | `#FFB6481A` | `--lit-10` | `color-mix(in srgb, var(--lit) 10%, transparent)` | Input field backgrounds, table `<thead>` fills, subtle row hover fills, code block backgrounds. |
| **Lit Highlight** | `#FFDBA4` | `--hi` | `color-mix(in srgb, var(--lit) 50%, white)` | 2px top & left bevel highlight on 3D pixel keys (`ButtonBase`), SVG cursor specular pixel, bright Shiki keywords/constants. |
| **Key Side / Shadow** | `#74582B` | `--side` | `color-mix(in srgb, var(--lit) 45%, var(--ground))` | 3D extruded keycap side shadow (`2px` + `4px` offset), Start menu drop shadow, dimmed phosphor accents, cursor shadow. |
| **Muted Ink** | `#FFB648B8` | `--lit-72` | `color-mix(in srgb, var(--lit) 72%, transparent)` | Excerpts, timestamps, secondary metadata, inactive hints, code comments. |

### 2.2 Switchable Phosphor Theme Presets (`html[data-os="phosphor"][data-theme="..."]`)

| Theme Key | `--lit` Hex | Character |
| :--- | :--- | :--- |
| `amber` *(Default)* | `#FFB648` | Warm 1980s/90s amber CRT monitor (flagship Phosphor look). |
| `green` | `#4AF626` | Classic P1/P39 green phosphor terminal. |
| `blue` | `#5CC8FF` | Cool cyan-blue phosphor workstation. |
| `white` | `#E8ECF2` | Paper-white monochrome Macintosh / NeXT feel. |

---

## 3. Typography & Responsive Type Scale

### 3.1 Font Families & OpenType Configuration

Both primary fonts are self-hosted via Fontsource (`@fontsource/jersey-10` and `@fontsource-variable/chivo-mono`):

- **Display Pixel Font (`--font-display`)**: `"Jersey 10"` (weight `400`). Tall, condensed, high-impact pixel display face used for hero name, page titles, section headers, Start menu vertical spine, and article headings (`h1`–`h4`).
  - *CJK Fallback:* `"Jersey 10", "PingFang SC", "Noto Sans SC", sans-serif`.
- **UI & Body Monospace (`--font-mono`, also `--font-sans` in `phosphor`)**: `"Chivo Mono Variable"` (weights `400`, `500`, `700`, normal & italic).
  - OpenType features: `font-feature-settings: "blwf" on, "cv03" on, "cv04" on, "cv09" on, "cv11" on;`
  - Tracking: `letter-spacing: 0em;`
  - *CJK Fallback:* `"Chivo Mono Variable", "Sarasa Mono SC", "LXGW WenKai Mono", "PingFang SC", "Noto Sans SC", monospace`.
- **Tabular Numerals:** Enforce `font-variant-numeric: tabular-nums` on taskbar clock, journal dates, project years, table numbers, and lightbox counters (`1 / 13`).

### 3.2 Exact 13-Style Responsive Type Scale

Breakpoints: **Desktop** `>= 1200px` | **Tablet** `810px – 1199px` | **Phone** `<= 809px`

| Role | Token | Family | Weight | Desktop | Tablet | Phone | Line Height (D / T / P) | Usage |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Heading 1** | `--type-h1` | `Jersey 10` | 400 | `180px` | `190px` | `100px` | `0.80 / 0.80 / 0.82` | Home desktop hero display name & wallpaper title. |
| **Heading 2** | `--type-h2` | `Jersey 10` | 400 | `100px` | `76px` | `60px` | `0.85 / 0.85 / 0.85` | Window Page Titles (`Work`, `About`, `Article`, etc.). |
| **Heading 3** | `--type-h3` | `Jersey 10` | 400 | `52px` | `44px` | `38px` | `0.90 / 0.90 / 0.90` | Major section titles, next-project heading. |
| **Article H2** | `--type-article-h2` | `Jersey 10` | 400 | `46px` | `40px` | `34px` | `0.95 / 0.95 / 0.95` | `h2` inside MDX articles and case studies. |
| **Article H3** | `--type-article-h3` | `Jersey 10` | 400 | `32px` | `30px` | `26px` | `1.00 / 1.00 / 1.00` | `h3` inside MDX articles. |
| **Article H4** | `--type-article-h4` | `Jersey 10` | 400 | `24px` | `24px` | `22px` | `1.05 / 1.05 / 1.05` | `h4` inside MDX articles. |
| **Body Large** | `--type-lead` | `Chivo Mono` | 400 | `20px` | `19px` | `17px` | `1.45 / 1.45 / 1.45` | Home `TypedText` intro, article lead paragraph, page intros. |
| **Body** | `--type-body` | `Chivo Mono` | 400 | `17px` | `17px` | `16px` | `1.50 / 1.45 / 1.45` | Prose, window titlebar, breadcrumbs, status bar, buttons, chips, tabs, inputs, tables. |
| **Label** | `--type-label` | `Chivo Mono` | 500 | `15px` | `15px` | `14px` | `1.25 / 1.25 / 1.25` | Desktop icon labels, dates, meta labels, taskbar clock. |
| **Quote** | `--type-quote` | `Chivo Mono` | 400 | `19px` | `18px` | `17px` | `1.45 / 1.45 / 1.45` | `blockquote` (`padding: 2px 0 2px 22px`, `2px` solid `--lit` left bar). |
| **Nav** | `--type-nav` | `Chivo Mono` | 500 | `15px` | `15px` | `14px` | `1.25 / 1.25 / 1.25` | Sidebar TOC links, Start menu items, taskbar tabs. |
| **Quiet** | `--type-quiet` | `Chivo Mono` | 400 | `15px` | `15px` | `14px` | `1.40 / 1.40 / 1.40` | Captions, footnotes, muted helper hints (`color: var(--lit-72)`). |
| **Table** | `--type-table` | `Chivo Mono` | 400 | `16px` | `15px` | `14px` | `1.40 / 1.40 / 1.40` | Structured spec & MDX comparison tables (`border: 1px solid var(--lit-28)`, `thead` fill `--lit-10`). |

### 3.3 CJK Long-Form Prose & Monochrome Code Block Rules

- **Chinese / Mixed CJK Articles (`/journal/[slug]`):**
  - Body size `16px–17px`, increase `line-height` to **`1.75`** (`1.50` is tuned for Latin and feels tight for dense Hanzi).
  - Restrict prose measure to `max-width: 68ch` (`~640px–784px` when maximized).
  - Dial down massive `Jersey 10` CJK display headings proportionally (`h1` `48px–64px`, `h2` `32px–36px`, `h3` `24px–26px`) so Chinese headlines never wrap into dense walls.
- **Code Blocks (`pre > code`):**
  - Background `var(--lit-10)`, border `1px solid var(--lit-28)`, `border-radius: 0px`, padding `16px`, font `14px / 1.6 var(--font-mono)`, `text-shadow: none`.
  - **Monochrome Syntax Rule (Phosphor-only):** Style Astro/Shiki tokens exclusively via opacity/weight tiers of `--lit` and `--hi` (`--astro-code-token-keyword: var(--hi)`, `--astro-code-token-constant: var(--hi)`, `--astro-code-token-comment: var(--lit-72)`, `--astro-code-token-punctuation: color-mix(in srgb, var(--lit) 55%, transparent)`). **NEVER** inject multi-color syntax themes into `phosphor`.

---

## 4. Layout & Virtual Screen Coordinates (`1120px` Design Space)

- **Base Grid Unit:** `4px` (`4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64px`).
- **Border Radius:** Strictly **`0px`** on EVERY element inside the OS (windows, buttons, Start menu, inputs, chips, cards, tables, code blocks, scrollbars). Only the outer physical CRT glass mask uses tube curvature.
- **Desktop Icon Rail (`.desktop-icons`):**
  - Positioned at `left: var(--rail-left, 84px); top: var(--rail-top, 48px);`, 2 columns of `80px` (`gap: 4px 2px`), `60×60px` crisp pixel SVG icons with `drop-shadow(0 0 6px color-mix(in srgb, var(--lit) 55%, transparent))`.
  - Hover/focus inverts the label chip (`background: var(--lit); color: var(--ground); text-shadow: none;`).
  - Phone (`<= 809px`): rearranges to centered multi-column grid.
- **Standard Open Window (`.os-window`):**
  - Default insets in `1120px` virtual stage: `--window-left: 270px; --window-top: 40px; --window-right: 64px; --window-bottom: 82px;` — guaranteeing a generous clear horizontal gutter (`> 24px`) to the right of the 2-column desktop icon rail (`84 + 162 = 246px`).
- **Stacked Child Window (`.os-window--child`):**
  - Offset over parent: `--frame-x: 350px; --frame-y: 76px; --frame-right: 24px; --frame-bottom: 76px;`.
- **Maximized Window (`>= 810px`):**
  - `inset: 28px 28px max(8px, calc(var(--wmax-bottom) - var(--taskbar-height)))` where `--taskbar-height: 70px` (desktop stage) and `--wmax-bottom: calc(var(--taskbar-height) + 10px)`.
- **Error Dialog (`/404`, `.os-window--error`):**
  - `min(461px, calc(100% - 20px)) × min(290px, calc(100% - 16px))` centered (`top: 50%; left: 50%; transform: translate(-50%, -50%)`), `28×28px` titlebar close key.
- **Window Titlebar Controls (`□`, `×`):** `32 × 32px` on regular windows (`28 × 28px` on `/404` dialog).
- **Taskbar Keys (Quick-launch, Start button, Speaker):** `40 × 40px` base tactile key height.

---

## 5. Phosphor CRT Optical Profile

Phosphor uses the **full 7-layer CRT optical stack** documented in [hardware.md](../hardware.md):

| Optical Token | Normal Mode (`data-reading="off"`) | Reading Mode (`data-reading="on"`) |
| :--- | :--- | :--- |
| `--crt-bloom-opacity` | `1` | `1` (softened naturally) |
| `--crt-contour-opacity` | `1` | `1` |
| Tube Curvature (`#tube-curvature`) | Enabled (progressive enhancement) | Disabled |
| `--scanline-alpha` | `0.16` | `0.04` |
| `--vignette-alpha` | `0.6` | `0.28` |
| `--flicker-display` | `block` (`none` under `prefers-reduced-motion`) | `none` |
| `--glass-glare-opacity` | `1` | `0` |
| `--text-glow-body` | `0 0 3px color-mix(in srgb, currentColor 60%, transparent), 0 0 14px color-mix(in srgb, currentColor 40%, transparent)` | `0 0 2px color-mix(in srgb, currentColor 25%, transparent)` |
| `--text-glow-heading` | `0 0 2px color-mix(in srgb, currentColor 90%, white), 0 0 16px color-mix(in srgb, currentColor 72%, transparent), 0 0 52px color-mix(in srgb, currentColor 38%, transparent)` | `var(--text-glow-body)` |

---

## 6. Signature Components & Interaction Specs

### 6.1 3D Tactile Pixel Key (`ButtonBase.tsx` / `.pixel-key`)

Used for primary/secondary buttons, taskbar quick-launch icons, Start menu button, speaker key, share buttons, wizard actions, and window titlebar buttons:

- **Default State:**
  - Primary (`.pixel-key--primary`): `background: var(--lit); color: var(--ground);`
  - Secondary / Icon Key: `background: var(--ground); color: var(--lit);`
  - Extruded tactile bevel + 4px hard pixel shadow:
    `box-shadow: inset 2px 2px 0 var(--hi), inset 0 0 0 2px var(--lit), 2px 2px 0 var(--side), 4px 4px 0 var(--side);`
- **Hover State:** Subtle tint shift (`color-mix(in srgb, var(--lit) 10%, var(--ground))` on secondary; `var(--hi)` on primary) with zero blurred drop shadows.
- **Active / Pressed State (`35ms linear`):**
  - `transform: translate(4px, 4px);`
  - `box-shadow: inset 2px 2px 0 var(--hi), inset 0 0 0 2px var(--lit);` (extruded side collapses cleanly as the key presses down).
- **Disabled State:** `opacity: 0.4; pointer-events: none;`.

### 6.2 Draggable OS Window (`Window.tsx` / `.os-window`)

1. **Titlebar (`.window-titlebar`):**
   - Focused (`data-wfocus="on"`): solid `var(--lit)` background, `var(--ground)` text, `text-shadow: none`, right-aligned `32×32px` Maximize (`□`) and Close (`×`) `ButtonBase` keys.
   - Unfocused (`data-wfocus="off"`): `var(--ground)` background, `inset 0 -1px var(--lit-28)` bottom rule, `var(--lit)` text, `0.55` action button opacity.
   - Dragging (`>= 810px` fine pointer): `cursor: var(--cursor-grab, grab)` -> active drag sets `html.pc-drag` (`cursor: var(--cursor-grabbing, grabbing) !important`), uses `pointerThroughGlass()` inverse displacement mapping so cursor sticks to the curved glass, and clamps `(x, y)` inside the stage.
2. **Breadcrumb Path Bar (`.window-path`):** `inset 0 -1px var(--lit-28)` bottom rule, clickable ancestor links (`Desktop` -> `/`), optional right-aligned `pathEnd` slot.
3. **Scrollable Body Pane (`.window-scroll`):** Independent vertical scroll, thin custom phosphor scrollbar (`6px`, `--lit-28` thumb, `--lit` hover).
4. **Status Bar (`.window-status`):** Fixed bottom strip (`inset 0 1px var(--lit-28)` top rule), left context label + right live status (`role="status"`).
5. **Perimeter Border:** Overlaid via `.os-window::after` (`1px solid var(--frame-ink)`) so pane heights never shift by 1px.

### 6.3 Taskbar, Start Menu & Clock (`Taskbar.tsx`, `StartMenu.tsx`, `Clock.tsx`)

- **Taskbar (`.taskbar`):** Pinned to bottom of `.screen-stage` (`height: var(--taskbar-height)`), `inset 0 1px var(--lit-28)` top rule, `background: var(--ground)`.
  - Left: **Start Menu button** (`.taskbar-menu-button`, depressed solid `--lit` fill when `aria-expanded="true"`), quick-launch pixel icon keys (`.taskbar-launch`), active/parent window tabs (`.taskbar-tab`).
  - Right: OS Style switcher, `40px` Speaker toggle (`AfternoonSound.tsx`), live tabular `HH:MM` clock (`Clock.tsx`).
- **Start Menu (`.start-menu`):**
  - Classic vertical Win95-inspired **34px solid `--lit` spine** (`.start-menu-spine`) with `Jersey 10` rotated brand title, `1px solid var(--lit)` border, `4px 4px 0 var(--side)` hard shadow.
  - Cascading submenus (`System`, `Documents`, `Games`) that collapse into inline indented accordions below `580px` container width (`@container screen (max-width: 580px)`).
  - Hover/focus/open rows use clean color inversion (`background: var(--lit); color: var(--ground); text-shadow: none;`).

### 6.4 Dynamic Beveled Pixel Cursors (`PixelCursors.tsx`)

Phosphor uses `cursorStyle: 'phosphor-bevel'` — crisp SVG data-URI cursors (`shape-rendering="crispEdges"`) dynamically recolored from `--os-cursor-fill` (`--lit`), `--os-cursor-stroke` (`--ground`), `--os-cursor-hi` (`--hi`), and `--os-cursor-side` (`--side`):

- **Default (`--cursor-arrow`):** `22×30` (`viewBox="0 0 11 15"`), hotspot `0 0`.
- **Pointer (`--cursor-hand`):** `30×32` (`viewBox="0 0 15 16"`), hotspot `10 2`.
- **Text (`--cursor-text`):** `18×32` (`viewBox="0 0 9 16"`), hotspot `7 14`.
- **Grab (`--cursor-grab`):** `32×32` (`viewBox="0 0 16 16"`), hotspot `14 12`.
- **Grabbing (`--cursor-grabbing`):** `30×32` (`viewBox="0 0 15 16"`), hotspot `14 12`.

### 6.5 TypedText (`TypedText.tsx`)

- Renders homepage intro once per session (`sessionStorage` flag `astro-phosphor-intro`); reveals characters progressively using transparent placeholder layout (`.typed-h { color: transparent; text-shadow: none; }`) so **CLS = 0**.
- Trailing block cursor (`.typed-marker::after`): `0.6em × 1em`, `background: currentColor`, `box-shadow: 0 0 8px currentColor`, `animation: typed-blink 1.06s steps(1) infinite` (hard on/off step — NEVER ease/fade).

### 6.6 AfternoonSound (`AfternoonSound.tsx`)

- `40×40px` tactile speaker key in the taskbar toggling global sound mute (`data-sound-muted`, synced to arcade/dungeon game audio and room prop cues) with a compact auto-dismissing phosphor toast (`"Sound on."` / `"Sound muted."`). No ambient background room-tone noise is played.

### 6.7 True-Color Gallery Lightbox (`GalleryLightbox.tsx`) & Phosphor Photos (`PhosphorPicture.astro`)

- **Gallery Lightbox:** Portals outside the CRT scanline/curvature stack (`z-[100]`, deep dark backdrop) so photography and project media render in **100% true color without scanlines or glare**, with `1 / N` tabular counter, keyboard `ArrowLeft`/`ArrowRight`/`Escape`, and thumbnail strip.
- **Phosphor Photos:** Inside CRT windows, images apply subtle monochrome contrast (`filter: brightness(1.05) contrast(1.15); transition: filter 120ms linear;`) and revert to `filter: none` on `:hover` (always `filter: none` on touch devices and inside `GalleryLightbox`).

### 6.8 Interactive Page Widgets (`SetupWizard`, `FAQPanel`, `Contents`, `ShareButtons`, `ContactComposer`)

- **`SetupWizard`:** Container-query (`@container (max-width: 520px)`), `--sw-title: 46px`, `--sw-step: 23px`, `--sw-text: 17px`, `--sw-small: 15px`, step progress bar (`1px` border + solid `--lit` fill) + Back/Next `ButtonBase` keys.
- **`FAQPanel`:** `--fq-title: 38px`, `--fq-q: 17px`, `--fq-pq: 23px` (mobile accordion); wide windows show 2-column question list + answer pane; narrow containers collapse to accordion.
- **`Contents` & `ShareButtons`:** Sticky left sidebar TOC on `/journal/[slug]` tracking active headings via `IntersectionObserver`, plus `All entries` back button and tactile `.sb-key` share keys.
- **`ContactComposer`:** Retro email client form (`To`, `From`, `Email`, `About` select with `appearance-none` + single custom pixel chevron, `Message`, `Send`). Inputs use `--lit-10` background, `1px solid var(--lit-28)` border, focusing to `1px solid var(--lit)`.

---

## 7. Surfaces & Elevation (`phosphor`)

| Level | Surface | Value | Border / Elevation |
| :--- | :--- | :--- | :--- |
| **L0** | Physical Desk Room | Room photograph over `--room-bg` | Ambient natural lighting only. |
| **L1** | CRT Screen Canvas | `--ground` (`#020B14`) | Inner tube aperture mask + 7 optical layers. |
| **L2** | OS Window / Dialog | `--ground` (`#020B14`) | `1px solid var(--lit)` (focused) or `1px solid var(--lit-28)` (inactive). No blurred drop shadows. |
| **L3** | Inset Panels / Inputs / Table Headers / Code | `--lit-10` (`#FFB6481A`) | `1px solid var(--lit-28)` hairline border. |
| **L4** | Tactile Pixel Keys / Start Menu | `--lit` (primary) or `--ground` (secondary) | `inset 2px 2px 0 var(--hi)` + `2px` rim + `4px` hard pixel side (`--side`). |
| **L5** | Gallery Lightbox Modal | Dark backdrop over viewport | Above CRT overlay; Lightbox is true color with zero scanlines. |

---

## 8. Strict Do's and Don'ts (Phosphor OS Only)

> **Scope note:** These prohibitions apply strictly to **`data-os="phosphor"`** (not to other peer OSes like `coffee`, `rainbow`, `cli`, or `pixel`, which have their own independent design specs).

### Do
- Keep every inner-OS border radius strictly **`0px`** across all windows, buttons, menus, inputs, cards, tables, and code blocks.
- Use **color inversion** (`--lit` background + `--ground` text) and crisp **4px pixel key depression** (`translate(4px, 4px)`) for interactive feedback.
- Use `shape-rendering="crispEdges"` on all custom pixel SVGs (`PixelIcon.tsx`) and pixel cursors (`PixelCursors.tsx`).
- Keep 100% of screen colors mathematically bound to `--lit` / `--ground` / `color-mix()` so all 4 phosphor presets (`amber`, `green`, `blue`, `white`) update simultaneously.
- Maintain at least `24px` clear horizontal gutter between the desktop icon rail and default open window placement on desktop (`--window-left: 270px` vs rail right edge `246px`).
- Strip native `<select>` arrows (`appearance: none`) before adding a single custom pixel chevron.

### Don't
- **NEVER** use `rounded-sm/md/lg/xl/full`, `backdrop-blur` glassmorphism, modern multi-stop color gradients, or soft diffused `shadow-md/lg/xl` inside the Phosphor CRT screen.
- **NEVER** use pure `#000000` for the Phosphor screen ground — always use `#020B14` (`#121418` in fullscreen).
- **NEVER** use anti-aliased vector icon libraries (`lucide-react`, `heroicons`, FontAwesome) for Phosphor OS chrome.
- **NEVER** introduce multi-color badges, rainbow syntax highlighting, or unprompted neon accents inside the Phosphor monochrome screen (only photography/video/external embeds retain natural color).
- **NEVER** use bouncy spring animations (`> 300ms` elastic ease) on UI controls or smooth fade-in/out on the blinking terminal cursor (`steps(1)` only).
- **NEVER** let CRT optical layers block pointer events (`pointer-events: none` is mandatory).
- **NEVER** replay the 1.9s CRT warm-up blur during regular route navigation.

---

## 9. Reference Token Block (`src/os/phosphor/tokens.css`)

```css
:root,
html[data-os="phosphor"],
html[data-os="phosphor"][data-theme="amber"] {
  --lit: #ffb648;
  --ground: #020b14;
  --ground-fullscreen: #121418;
}

html[data-os="phosphor"][data-theme="green"] { --lit: #4af626; }
html[data-os="phosphor"][data-theme="blue"]  { --lit: #5cc8ff; }
html[data-os="phosphor"][data-theme="white"] { --lit: #e8ecf2; }

:root,
html[data-os="phosphor"] {
  /* Single-hue derivations */
  --lit-28: color-mix(in srgb, var(--lit) 28%, transparent);
  --lit-10: color-mix(in srgb, var(--lit) 10%, transparent);
  --lit-72: color-mix(in srgb, var(--lit) 72%, transparent);
  --hi: color-mix(in srgb, var(--lit) 50%, white);
  --side: color-mix(in srgb, var(--lit) 45%, var(--ground));

  /* Semantic OS contract mapping */
  --os-desktop-bg: var(--ground);
  --os-desktop-pattern: none;
  --os-desktop-pattern-size: auto;
  --os-surface: var(--ground);
  --os-surface-alt: var(--lit-10);
  --os-surface-elevated: var(--ground);
  --os-taskbar-bg: var(--ground);
  --os-topbar-bg: transparent;
  --topbar-height: 0px;

  --os-ink: var(--lit);
  --os-ink-muted: var(--lit-72);
  --os-ink-inverse: var(--ground);

  --os-border: var(--lit-28);
  --os-border-strong: var(--lit);
  --os-window-shadow: none;
  --os-menu-shadow: 4px 4px 0 var(--side);
  --os-radius-window: 0px;
  --os-radius-control: 0px;
  --os-radius-pill: 0px;

  --os-accent: var(--lit);
  --os-accent-hover: var(--hi);
  --os-accent-ink: var(--ground);
  --os-status-ok: var(--lit);

  --os-titlebar-bg: var(--lit);
  --os-titlebar-ink: var(--ground);
  --os-titlebar-pattern: none;
  --os-titlebar-inactive-bg: var(--ground);
  --os-titlebar-inactive-ink: var(--lit);

  /* Dynamic cursors */
  --os-cursor-fill: var(--lit);
  --os-cursor-stroke: var(--ground);
  --os-cursor-hi: var(--hi);
  --os-cursor-side: var(--side);

  /* Typography */
  --font-display: "Jersey 10", "PingFang SC", "Noto Sans SC", sans-serif;
  --font-sans: "Chivo Mono Variable", "Sarasa Mono SC", "LXGW WenKai Mono", "PingFang SC", "Noto Sans SC", monospace;
  --font-mono: "Chivo Mono Variable", "Sarasa Mono SC", "LXGW WenKai Mono", "PingFang SC", "Noto Sans SC", monospace;
  --os-font-body: var(--font-mono);
  --os-font-features: "blwf" on, "cv03" on, "cv04" on, "cv09" on, "cv11" on;

  /* Full CRT optics */
  --crt-bloom-opacity: 1;
  --crt-contour-opacity: 1;
  --crt-screen-blend: screen;
  --scanline-alpha: 0.16;
  --vignette-alpha: 0.6;
  --flicker-display: block;
  --glass-glare-opacity: 1;
  --text-glow-body:
    0 0 3px color-mix(in srgb, currentColor 60%, transparent),
    0 0 14px color-mix(in srgb, currentColor 40%, transparent);
  --text-glow-heading:
    0 0 2px color-mix(in srgb, currentColor 90%, white),
    0 0 16px color-mix(in srgb, currentColor 72%, transparent),
    0 0 52px color-mix(in srgb, currentColor 38%, transparent);
}
