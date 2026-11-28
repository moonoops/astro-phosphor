---
name: add-os-style
description: Add a new peer pluggable desktop OS style (`data-os="<id>"`) to Astro Phosphor with an independent DESIGN.md spec, isolated tokens/chrome modules, dynamic cursor & CRT optics config, registry wiring, and Playwright visual/regression verification.
---

# Add a Peer OS Style (`data-os="<id>"`)

Use this skill whenever adding a brand-new peer desktop OS aesthetic alongside the built-in 5 peer OSes (`rainbow`, `phosphor`, `coffee`, `cli`, `pixel`) — or when building out a custom OS theme.

> **Before starting:** Read [AGENTS.md](../../../AGENTS.md), [docs/DESIGN.md](../../../docs/DESIGN.md), and [docs/os/hardware.md](../../../docs/os/hardware.md) to verify every token in the Shared Semantic Token Contract and Hardware Optics Contract.

---

## Step 1: Author the Independent OS Specification

Create **`docs/os/<id>/DESIGN.md`** before writing CSS so the design tokens and rules are explicit and auditable:

1. **Visual Metaphor & Palette:** Exact hex/rgba tokens for desktop wallpaper/pattern, window surfaces (`--os-surface`, `--os-surface-alt`, `--os-surface-elevated`), primary/muted/inverse inks, accents, borders, hard/soft shadows, and switchable sub-themes (`themes[]`).
2. **Typography & CJK Fallback:** Display, UI sans, and monospace font families, weights, responsive type scale (Desktop `>= 1200px` / Tablet `810–1199px` / Phone `<= 809px`), and CJK pairing.
3. **OS Chrome Layout:** Whether `.os-topbar` (`hasTopBar`), `.taskbar` (`hasBottomBar`), and `.os-desktop-widget` (`hasDesktopWidget`) are shown (obeying the zero-duplication chrome law in `docs/DESIGN.md`), plus styling specs for `.desktop-icons` (6 shortcuts), `.os-window`, `.taskbar`, `.start-menu`, `.pixel-key`, inputs, scrollbars, and `/404` dialog.
4. **CRT Optics & Cursors:** Recommended `--crt-screen-blend` (`normal` for light/opaque OSes, `screen` for dark glowing tubes), `--crt-bloom-opacity`, `--crt-contour-opacity`, `--scanline-alpha`, `--crt-grille-alpha`, `--crt-aging-tint`, `--vignette-alpha`, `--crt-vignette-rgb`, `--flicker-display`, `--glass-glare-opacity`, `--text-glow-*`, `flatOptics`, and `cursorStyle`.
5. **Legacy Bridge Mapping:** Explicit mapping for `--ground`, `--ground-fullscreen`, `--lit`, `--lit-10`, `--lit-28`, `--lit-72`, `--hi`, `--side`, `--astro-code-*`, and optional game overrides in `src/styles/game-themes.css`.
6. **OS-Scoped Do's & Don'ts.**

Register the new spec in the routing tables of [AGENTS.md](../../../AGENTS.md) and [docs/DESIGN.md](../../../docs/DESIGN.md).

---

## Step 2: Fonts & Local Assets

- Prefer **self-hosted `@fontsource/*` packages** installed in `package.json` and imported in `src/layouts/DesktopLayout.astro` (avoid external hotlinks or fragile third-party CDNs).
- Keep any custom SVG textures/patterns inline as lightweight CSS data URIs or under `src/assets/`.

---

## Step 3: Create the Isolated OS Module (`src/os/<id>/`)

Create three strictly scoped files under `src/os/<id>/`:

### 3.1 `src/os/<id>/meta.ts`

```ts
import type { OsDefinition } from '../types';

export const myOsMeta: OsDefinition = {
  id: 'my-os',
  name: 'MyOS',
  label: 'MyOS Label',
  tagline: 'Short one-line description shown in Design System UI.',
  defaultTheme: 'default',
  themes: [
    { id: 'default', label: 'Default', swatch: '#XXXXXX' },
  ],
  cursorStyle: 'classic-ink', // 'phosphor-bevel' | 'classic-ink' | 'soft-pointer' | 'pixel-retro' | 'terminal-mono'
  hasTopBar: true,            // true if styling/showing .os-topbar
  hasBottomBar: false,        // false for top-only OSes (hides .taskbar); true when using bottom dock/taskbar
  hasDesktopWidget: false,    // true if styling/showing .os-desktop-widget on /
  flatOptics: false,          // true to disable SVG #tube-curvature barrel distortion
};
```

### 3.2 `src/os/<id>/tokens.css`

Scope **every** rule to `html[data-os="<id>"]` (and `html[data-os="<id>"][data-theme="<subtheme>"]` for sub-themes). Provide:

1. **All Shared Semantic Tokens (`--os-*`)**: surfaces, inks, borders/shadows/radii, accents, titlebar, typography, and dynamic cursor colors (`--os-cursor-*`).
2. **Hardware CRT Optics Tokens**: `--crt-bloom-opacity`, `--crt-contour-opacity`, `--crt-screen-blend` (**use `normal` for light/paper/vibrant-color OSes!**), `--scanline-alpha`, `--crt-grille-alpha`, `--crt-aging-tint`, `--vignette-alpha`, `--crt-vignette-rgb`, `--flicker-display`, `--glass-glare-opacity`, `--text-glow-body`, `--text-glow-heading`, plus `html[data-os="<id>"][data-reading="on"]`.
3. **Legacy App Compatibility Bridge**: `--ground`, `--ground-fullscreen`, `--lit`, `--lit-10`, `--lit-28`, `--lit-72`, `--hi`, `--side`, and `--astro-code-*`.

### 3.3 `src/os/<id>/chrome.css`

Scope **every** selector to `html[data-os="<id>"]`. Style OS chrome cleanly without altering hardware geometry variables:

- Desktop background & pattern (`.screen-stage`, `.desktop-space`)
- `.os-topbar` (if `hasTopBar: true`) and `.os-desktop-widget` (if `hasDesktopWidget: true`)
- `.desktop-icons` / `.desktop-icon` (verify balanced 6-icon layout on desktop and `3×2` on phone)
- `.os-window`, `.window-titlebar`, `.window-actions`, `.window-path`, `.window-scroll`, `.window-status`, `.os-window--error`
- `.taskbar`, `.taskbar-menu-button`, `.taskbar-key`, `.taskbar-tab`, `.start-menu`, `.start-submenu`
- `.pixel-key` / `.pixel-key--primary`
- Responsive phone refinements (`@media (max-width: 809px)` and `@container screen (max-width: 580px)`)

---

## Step 4: Register in `src/os/types.ts`, `src/os/registry.ts` & `src/os/index.css`

1. **`src/os/types.ts`**: Add `'<id>'` to `osIds` (updates `OsId` automatically).
2. **`src/os/registry.ts`**: Import `myOsMeta` from `./<id>/meta` and add it to `osRegistry`.
3. **`src/os/index.css`**: Append `@import "./<id>/tokens.css";` and `@import "./<id>/chrome.css";`.
4. **`src/styles/game-themes.css`** *(optional)*: Add game stage / Minesweeper / 2048 / Magic Tower palette overrides if your OS has custom surface polarity.
5. **`DesktopLayout.astro` / `osStore.ts`**: Reads `osBootstrapConfig` dynamically from `src/os/registry.ts` — verify `?os=<id>` and `localStorage` restore `data-os`, `data-theme`, and `data-os-flat-optics` synchronously pre-paint.

---

## Step 5: Verify Build, Subpath Output & Visual Quality

```sh
npm run check
npm run build
SITE_URL=https://example.github.io SITE_BASE=/astro-phosphor/ npm run build
npm run test:browser
```

### Mandatory Acceptance Checklist
- [ ] **Zero Regression on Peer OSes:** Existing Playwright checks pass across `rainbow`, `phosphor`, `coffee`, `cli`, and `pixel`.
- [ ] **Zero Cross-OS Leakage:** Switching `rainbow` -> `<id>` -> `phosphor` -> `<id>` leaves zero stray styles or broken cursors, and restores each OS's saved sub-theme (`osThemes`).
- [ ] **All 3 Camera Modes:** Inspect `/?os=<id>` in `room`, `close`, and `fullscreen` at `1440×900` — crisp contrast, zero washed-out paper (`--crt-screen-blend: normal` for light OSes).
- [ ] **Responsive & Mobile (`390×844` & `900×900`):** Zero horizontal overflow, balanced 6-icon grid, accessible `>= 40px` touch targets.
- [ ] **Shared App Compatibility & Static Purity:** Open `/work`, `/work/field-guide`, `/journal`, `/about`, `/contact`, `/games`, `/games/mota`, `/design-system`, and `/404` under `?os=<id>` with **zero `/api/` calls**.
- [ ] **Accessibility & Reduced Motion:** WCAG AA contrast, visible `:focus-visible`, `Escape` closes windows, `prefers-reduced-motion: reduce` disables flicker and animations.
