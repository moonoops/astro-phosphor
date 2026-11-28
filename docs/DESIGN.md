# Astro Phosphor — Master Design System Index & Peer OS Token Contract

> **Master specification** governing the 3-layer design architecture of **Astro Phosphor**: one OS-agnostic **Physical Hardware Shell** (Layer 1), **5 Peer Pluggable Desktop OS Styles** (Layer 2), and **Shared Pure-Static Apps & Routes** (Layer 3) connected by a single Semantic CSS Token Contract.

---

## 1. Design Specification Index

Read the document(s) matching the layer or OS you are modifying:

| Layer / OS | `data-os` Value | Default Theme / Sub-Themes | Chrome Bar Topology · Widget | Specification |
| :--- | :--- | :--- | :--- | :--- |
| **Layer 1: Physical Hardware Shell** | *(all OSes)* | 5 room scenes (`morning`, `noon`, `afternoon`, `dusk`, `night`) · 3 camera views (`room`, `close`, `fullscreen`) | Hardware shell | [docs/os/hardware.md](os/hardware.md) |
| **Rainbow** *(Default)* | `rainbow` | `studio` *(default)*, `marigold`, `sky`, `classic` | Top `*.fig` bar only (no bottom taskbar) · `NOW.txt` card | [docs/os/rainbow/DESIGN.md](os/rainbow/DESIGN.md) |
| **Phosphor CRT** | `phosphor` | `amber` *(default)*, `green`, `blue`, `white` | Bottom taskbar only · No widget | [docs/os/phosphor/DESIGN.md](os/phosphor/DESIGN.md) |
| **Coffee** | `coffee` | `roast` *(default)*, `matcha`, `indigo`, `oat` | Passive top status bar + interactive bottom dock · `NOW.txt` sticky | [docs/os/coffee/DESIGN.md](os/coffee/DESIGN.md) |
| **CLI** | `cli` | `claude` *(default)*, `light`, `dark`, `matrix` | Bottom command dock only · Welcome box | [docs/os/cli/DESIGN.md](os/cli/DESIGN.md) |
| **Pixel** | `pixel` | `paper` *(default)*, `slate`, `mint`, `sky` | Top Classic Mac menu bar only (no bottom taskbar) · `NOW.txt` card | [docs/os/pixel/DESIGN.md](os/pixel/DESIGN.md) |

### Related Skills & Contracts
- **Repo Engineering Contract:** [AGENTS.md](../AGENTS.md)
- **Add Another Peer OS Style:** [.agents/skills/add-os-style/SKILL.md](../.agents/skills/add-os-style/SKILL.md)
- **Replace / Calibrate Desk Hardware Backdrop:** [.agents/skills/room-backdrop/SKILL.md](../.agents/skills/room-backdrop/SKILL.md)

---

## 2. Shared Semantic CSS Token Contract

Every peer OS MUST define this complete contract on `html[data-os="<id>"]` in `src/os/<id>/tokens.css` (while `phosphor` also attaches to `:root, html[data-os="phosphor"]` as the safe first-paint fallback).

### 2.1 Surfaces & Layout Chrome

| Token | Role | Phosphor Default |
| :--- | :--- | :--- |
| `--os-desktop-bg` | Base desktop wallpaper background color inside `.screen-stage` / `.desktop-space` | `var(--ground)` (`#020b14`) |
| `--os-desktop-pattern` | Optional desktop background-image pattern (dots, grid, gradient, texture, or `none`) | `none` |
| `--os-desktop-pattern-size` | `background-size` for `--os-desktop-pattern` | `auto` |
| `--os-surface` | Primary window body & dialog interior background | `var(--ground)` |
| `--os-surface-alt` | Secondary inset surface: toolbars, inputs, table `<thead>`, code blocks, subtle hover fills | `var(--lit-10)` |
| `--os-surface-elevated` | Cards, sticky notes, popovers, Start menu, modals | `var(--ground)` |
| `--os-taskbar-bg` | Bottom taskbar / dock container fill | `var(--ground)` |
| `--os-topbar-bg` | Optional `.os-topbar` bar fill | `transparent` |
| `--topbar-height` | Height of `.os-topbar`; shifts `.desktop-space { top: var(--topbar-height, 0px); }` | `0px` *(hidden in `phosphor`)* |
| `--taskbar-height` | Height of `.taskbar` (`70px` desktop stage / `56px` phone default) | `70px` (`56px` phone) |

### 2.2 Inks

| Token | Role | Phosphor Default |
| :--- | :--- | :--- |
| `--os-ink` | Primary body copy, icons, headings, and interactive labels | `var(--lit)` |
| `--os-ink-muted` | Secondary metadata, timestamps, captions, disabled/quiet text | `var(--lit-72)` |
| `--os-ink-inverse` | High-contrast text placed over solid `--os-accent` or focused titlebar fills | `var(--ground)` |

### 2.3 Borders, Shadows & Radii

| Token | Role | Phosphor Default |
| :--- | :--- | :--- |
| `--os-border` | Subtle hairline dividers, inactive borders, table grid rules, input borders | `var(--lit-28)` |
| `--os-border-strong` | Active window frame border, focused inputs, emphasized rules | `var(--lit)` |
| `--os-window-shadow` | Outer drop shadow on `.os-window` (e.g., hard offset shadow in Coffee/Pixel, `none` in Phosphor) | `none` |
| `--os-menu-shadow` | Shadow on `.start-menu`, `.start-submenu`, and floating popovers | `4px 4px 0 var(--side)` |
| `--os-radius-window` | Corner radius for `.os-window` and top-layer modals | `0px` |
| `--os-radius-control` | Corner radius for buttons, inputs, tabs, cards, code blocks | `0px` |
| `--os-radius-pill` | Corner radius for badges, status chips, floating dock pills | `0px` |

### 2.4 Accents & Status

| Token | Role | Phosphor Default |
| :--- | :--- | :--- |
| `--os-accent` | Primary brand/action fill, selection highlight, active indicators | `var(--lit)` |
| `--os-accent-hover` | Hover fill for primary actions | `var(--hi)` |
| `--os-accent-ink` | Text/icon color on `--os-accent` surfaces (MUST meet WCAG AA contrast) | `var(--ground)` |
| `--os-status-ok` | Positive/online status dot (e.g., live availability indicator in `.os-topbar`) | `var(--lit)` |

### 2.5 Window Titlebar

| Token | Role | Phosphor Default |
| :--- | :--- | :--- |
| `--os-titlebar-bg` | Focused `.window-titlebar` background fill | `var(--lit)` |
| `--os-titlebar-ink` | Focused `.window-titlebar` title & icon color | `var(--ground)` |
| `--os-titlebar-pattern` | Optional titlebar texture (e.g., Classic Mac horizontal stripes/dots, or `none`) | `none` |
| `--os-titlebar-inactive-bg` | Unfocused (`data-wfocus="off"`) `.window-titlebar` background | `var(--ground)` |
| `--os-titlebar-inactive-ink` | Unfocused `.window-titlebar` text color | `var(--lit)` |

### 2.6 Typography

| Token | Role | Phosphor Default |
| :--- | :--- | :--- |
| `--font-display` | Hero title, window page titles (`h1`–`h3`), article headings | `"Jersey 10", "PingFang SC", "Noto Sans SC", sans-serif` |
| `--font-sans` | UI sans-serif / editorial UI font (for OSes that separate UI sans from mono) | `var(--font-mono)` |
| `--font-mono` | Code blocks, timestamps, tabular data, terminal text | `"Chivo Mono Variable", "Sarasa Mono SC", ...` |
| `--os-font-body` | Default `font-family` applied to `body` / `.screen-stage` | `var(--font-mono)` |
| `--os-font-features` | OpenType `font-feature-settings` for body typography (`normal` or custom features) | `"blwf" on, "cv03" on, "cv04" on, "cv09" on, "cv11" on` |

### 2.7 Dynamic Cursors (`PixelCursors.tsx`)

`PixelCursors.tsx` watches both `os` and `theme`, reads these four computed tokens, and generates crisp SVG data-URI cursors matching the OS's declared `cursorStyle`:

| Token | Role | Phosphor Default |
| :--- | :--- | :--- |
| `--os-cursor-fill` | Main cursor interior fill | `var(--lit)` |
| `--os-cursor-stroke` | Outer 1px cursor outline | `var(--ground)` |
| `--os-cursor-hi` | Specular/bevel highlight pixel (used by `phosphor-bevel`) | `var(--hi)` |
| `--os-cursor-side` | Extruded shadow pixel (used by `phosphor-bevel` / `pixel-retro`) | `var(--side)` |

### 2.8 Hardware CRT Optics Override Tokens (`src/styles/crt.css` & `tube-shape.css`)

| Token / Attribute | Role | Phosphor Default | Opaque / Light Peer OS Profile |
| :--- | :--- | :--- | :--- |
| `--crt-bloom-opacity` | Opacity of central `.crt-bloom` phosphor glow (`0` – `1`) | `1` | `0` – `0.14` (`0.52` on `cli/matrix`) |
| `--crt-contour-opacity` | Opacity of `.crt-contour` inner curved bezel rim shadow (`0` – `1`) | `1` | `0.85` – `0.95` (`0.1` – `0.22` reading) |
| `--crt-screen-blend` | `mix-blend-mode` on `.screen-plane` in room view (`screen` vs `normal`) | `screen` | **`normal`** *(required for light/opaque backgrounds so cream/white paper isn't washed out!)* |
| `--scanline-alpha` | Darkness of 3px horizontal scanline grooves (`0` – `0.2`) | `0.16` (`0.04` reading) | `0.12` – `0.15` (`0` – `0.02` reading) |
| `--crt-grille-alpha` | Opacity of 3px vertical gray CRT aperture-grille micro-stripes (`0` – `0.08`) | `0` | `0.05` – `0.055` (`0` reading / fullscreen) |
| `--crt-aging-tint` | Subtle vintage glass patina tint over bright opaque CRT surfaces | `transparent` | `rgb(28..36 30..32 26..34 / 0.035..0.045)` (`transparent` on dark themes / reading / fullscreen) |
| `--vignette-alpha` | Edge vignette intensity (`0` – `0.65`) | `0.6` (`0.28` reading) | `0.15` – `0.16` light / `0.26` – `0.30` dark (`0.05` – `0.08` reading) |
| `--crt-vignette-rgb` | Edge vignette RGB tint channel | `0 0 0` | `28 24 20` light / `0 0 0` dark |
| `--flicker-display` | `block` or `none` for `.crt-fl1` / `.crt-fl2` | `block` | `none` |
| `--glass-glare-opacity` | Window glass & curved dome reflection intensity (`0` – `1`) | `1` (`0` reading) | `1` (`0` reading / fullscreen) |
| `--text-glow-body` | `text-shadow` on UI & body text inside `.screen-plane` | Phosphor double halo | `none` |
| `--text-glow-heading` | `text-shadow` on `h1, h2` inside `.screen-plane` | Phosphor triple halo | `none` |
| `html[data-os-flat-optics="on"]` | Optional opt-out (`meta.flatOptics === true`) that bypasses `#tube-curvature` barrel warp | `false` *(unset)* | `false` across all 5 built-in peer OSes (flattens automatically in Reading Mode & Fullscreen) |

---

## 3. Legacy App Compatibility Bridge & Game Themes (Mandatory for All Peer OSes)

Shared app stylesheets (`work.css`, `journal.css`, `information.css`, `arcade-games.css`, `mota.css`, `design-system.css`) reference the original 8 core variables (`--ground`, `--ground-fullscreen`, `--lit`, `--lit-10`, `--lit-28`, `--lit-72`, `--hi`, `--side`), Astro Shiki `--astro-code-*` variables, and polarity-aware arcade tokens in `src/styles/game-themes.css`.

Every `src/os/<id>/tokens.css` MUST map these bridge tokens on `html[data-os="<id>"]`:

| Bridge Variable | Required Semantic Mapping | Example: Light Paper OS (`coffee`) | Example: Dark Terminal OS (`cli`) |
| :--- | :--- | :--- | :--- |
| `--ground` | Window interior / primary canvas background (`--os-surface`) | Warm cream paper (`#FAF6EE`) | Deep terminal charcoal (`#1B1A17`) |
| `--ground-fullscreen` | Fullscreen outer canvas background (often matches `--os-desktop-bg` or `--os-surface`) | Warm desk slate / linen | Deep terminal charcoal |
| `--lit` | Primary foreground ink (`--os-ink`) — high contrast against `--ground` | Deep espresso ink (`#1E2629`) | Crisp warm stone (`#E9E6DC`) |
| `--lit-72` | Secondary / muted ink (`--os-ink-muted`) | Muted warm umber | Muted terminal gray |
| `--lit-28` | Borders, dividers, grid rules (`--os-border`) | Soft warm ink hairline | Subtle terminal rule |
| `--lit-10` | Subtle inset surface / input / `<thead>` / hover tint (`--os-surface-alt`) | Warm stone tint | Subtle elevated panel fill |
| `--hi` | Light specular / hover highlight (buttons, active accents, bright code tokens) | Warm accent or light paper highlight | Bright accent highlight |
| `--side` | Hard offset shadow / extruded edge color | Solid ink/umber offset shadow | Deep shadow / border edge |
| `--astro-code-*` | Optional Shiki syntax tokens (`--astro-code-color-text`, `-background`, `-token-*`) | High-contrast ink + muted accent syntax | Syntax-highlighted terminal palette |

> **Contrast Rule:** Whenever an app uses inverted states (`background: var(--lit); color: var(--ground);`), mapping `--lit` to primary dark ink and `--ground` to light paper automatically preserves crisp contrast across both light and dark OSes!

---

## 4. Peer OS Integration Contract (`src/os/`)

### 4.1 Directory & Registry Structure

```text
src/os/
├── types.ts           # osIds, OsId, OsCursorStyle, OsThemePreset, OsDefinition
├── registry.ts        # DEFAULT_OS, osRegistry, osList, getOsDefinition(), resolveOsTheme(), osBootstrapConfig
├── index.css          # Imports all 5 peer OS tokens.css & chrome.css (imported by src/styles/global.css)
├── phosphor/          # meta.ts, tokens.css, chrome.css
├── coffee/            # meta.ts, tokens.css, chrome.css
├── rainbow/           # meta.ts, tokens.css, chrome.css
├── cli/               # meta.ts, tokens.css, chrome.css
└── pixel/             # meta.ts, tokens.css, chrome.css
```

### 4.2 `OsDefinition` Contract (`src/os/types.ts`, re-exported by `src/os/registry.ts`)

```ts
export const osIds = ['phosphor', 'coffee', 'rainbow', 'cli', 'pixel'] as const;
export type OsId = (typeof osIds)[number];

export type OsCursorStyle =
  | 'phosphor-bevel'
  | 'classic-ink'
  | 'soft-pointer'
  | 'pixel-retro'
  | 'terminal-mono';

export interface OsThemePreset {
  readonly id: string;
  readonly label: string;
  readonly swatch: string;
}

export interface OsDefinition {
  readonly id: OsId;
  readonly name: string;
  readonly label: string;
  readonly tagline: string;
  readonly defaultTheme: string;
  readonly themes: ReadonlyArray<OsThemePreset>;
  readonly cursorStyle?: OsCursorStyle;
  readonly hasTopBar?: boolean;
  readonly hasBottomBar?: boolean;
  readonly hasDesktopWidget?: boolean;
  readonly flatOptics?: boolean;
}
```

### 4.3 Zero-FOUC Chrome Extension Slots & Zero-Duplication Law

Every peer OS MUST expose **strictly one** visible Menu launcher, **one** OS Switcher, **one** Sound toggle, and **one** Clock — never duplicating navigation/system chrome between top and bottom bars:

1. **Optional Top Bar (`OsTopBar.tsx`, `transition:persist="os-topbar"`):**
   - Mounted inside `.screen-stage` above `.desktop-space` with `.os-topbar-left`, `.os-topbar-center`, and `.os-topbar-right`.
   - Hidden via CSS (`display: none`) and `--topbar-height: 0px` on bottom-only OSes (`phosphor`, `cli`, where `hasTopBar: false, hasBottomBar: true`).
   - On **top-only OSes** (`pixel`, `rainbow`, where `hasTopBar: true, hasBottomBar: false`): `.taskbar` is hidden (`display: none !important; --taskbar-height: 0px;`), and `.os-topbar` hosts the sole top-anchored `<StartMenu placement="top" />` (opening downward with distinct `#topbar-start-menu-panel` IDs), quick navigation links (`Work`, `Journal`, `About`, `Contact`, `Games`), non-redundant active window tab, Sound toggle, `OS ▾` Switcher, and live Clock.
   - On **split-role OSes** (`coffee`, where `hasTopBar: true, hasBottomBar: true`): `.os-topbar` is strictly a **passive editorial status strip** (brand + active route + status dot, zero interactive controls), while the bottom floating `.taskbar` dock owns `StartMenu` (`placement="bottom"`), Quick Launch, Active Window tabs, OS Switcher, Sound, and Clock.
2. **Optional Desktop Widget Slot (`.os-desktop-widget` on `/`):**
   - Rendered in `src/pages/index.astro` using `pageCopy` / `site.ts` data, hidden by default in `phosphor`, and revealed/styled by OSes that feature a desktop sticky note, studio card, or terminal welcome box.

### 4.4 CSS Isolation Rules

- **Never** write un-scoped global selectors inside `src/os/<id>/tokens.css` or `src/os/<id>/chrome.css` (only `phosphor/tokens.css` may include `:root` alongside `html[data-os="phosphor"]` as the initial fallback).
- Every selector in `src/os/<id>/chrome.css` MUST begin with `html[data-os="<id>"]` so switching OSes guarantees **zero visual leakage** into `phosphor` or any other peer OS.
- Never override hardware geometry rules (`--photo-width`, `--aperture-*`, `--far-unit`, `--close-unit`, `--crt-zoom`, `--crt-full`) from an OS stylesheet.
