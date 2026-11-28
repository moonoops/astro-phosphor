# Physical Hardware Shell & CRT Optics Specification

> **Layer 1 (OS-Agnostic Hardware Shell):** Photorealistic 1990s Macintosh LC desk environment, calibrated CRT screen aperture, 5 time-of-day lighting scenes, 3 camera views, cathode-ray power physics, and OS-aware optical overlays shared by all 5 peer OS styles (`rainbow`, `phosphor`, `coffee`, `cli`, `pixel`).

**Master Index:** [docs/DESIGN.md](../DESIGN.md)
**Room Backdrop Replacement Skill:** [.agents/skills/room-backdrop/SKILL.md](../../.agents/skills/room-backdrop/SKILL.md)

---

## 1. Architecture & Responsibility Boundary

Layer 1 owns **everything outside the OS desktop pixels** plus the physical glass/optical filters mounted over the tube. It MUST remain **100% OS-agnostic** — switching `data-os` never alters the room geometry, camera equations, or power-cycle timing, while allowing each peer OS to tune its preferred CRT optical intensities via CSS custom properties.

### Primary Source Files

| File | Responsibility |
| :--- | :--- |
| `src/geometry/room-crop.js` | Master coordinate grid (`1672 × 941`) and `closeCrop` box (`{ left: 294, top: 170, width: 1056, height: 520 }`). |
| `src/geometry/tube.ts` | Screen `aperture`, power `indicator`, `virtualScreen`, `overscan`, `rasterInset`, `glassPath`, `rasterPath`, and `rasterMaskTransform()`. |
| `src/geometry/cabinet.js` | Outer plastic casing polygon (`cabinetOutline`) and piecewise warp projection (`project(x, y)`). |
| `src/geometry/signal-lens.ts` | Computes the 256×256 inverse barrel-displacement texture (`createPhotographedLens`) and maps DOM pointer events back through curved glass (`pointerThroughGlass`). |
| `src/room-scenes.ts` | Media query `roomMedia` and responsive `srcset` map (`roomSources`) across all 5 WebP lighting scenes. |
| `src/components/ui/RoomArtwork.astro` | `<room-photograph>` custom element: lazy scene loading, decode gating (`data-room-ready`), `0.65s` cross-fades, and no-JS daylight fallback. |
| `src/components/ui/TubeGlass.astro` | Inline SVG `<clipPath id="tube-aperture">`, `<mask id="tube-raster">` + `<filter id="phosphor-rolloff">` (`stdDeviation="0.72"`, Phosphor), and `<mask id="tube-raster-tight">` + `<filter id="phosphor-rolloff-soft">` (`stdDeviation="1.05"`, non-phosphor tighter ~2–3px glass lip). |
| `src/components/os/CRTScreen.tsx` | Optical layer DOM (`.crt-optics`, `.crt-blank`, `.crt-signal`, `.crt-start-glow`, `.crt-beam`, `.crt-afterglow`, `.crt-glass`, `.crt-off-screen`) + `CRTScreenControls` (zoom/fullscreen/power buttons, keyboard shortcuts, click-to-close auto-zoom, bezel power LED). |
| `src/components/os/TubeOptics.tsx` | High-precision 4-tap bilinear SVG `<filter id="tube-curvature">` displacement pipeline and smooth `fullscreen` curvature unwinding. |
| `src/styles/crt.css` | Base hardware layout, 3 camera equations, cathode-ray power-off/on/entry animations, compact bezel fallback, and `prefers-reduced-motion` overrides. |
| `src/styles/tube-shape.css` | Desktop room-view aperture clipping (`clip-path: url("#tube-aperture")`), raster masking (`#tube-raster` for `phosphor`, `#tube-raster-tight` + seamless overscan bleed for non-phosphor OSes), scene-aware smoked glass edge on `.crt-bezel::after`, directional recessed plastic-lip `.crt-contour`, `mix-blend-mode: screen`, and flat-fullscreen override (`data-crt-flat="on"`). |
| `src/styles/room-scenes.css` | Per-scene `--room-bg`, compact bezel lighting (`--case-*`), window reflection tints (`--window-light`, `--window-return`), and scene cross-fade rules. |

---

## 2. Coordinate Space, Aperture & Virtual Stage Geometry

All hardware measurements live in a single resolution-independent **1672 × 941** coordinate space (`src/geometry/room-crop.js` & `src/geometry/tube.ts`), injected onto `<html>` as inline CSS custom properties by `DesktopLayout.astro`:

| Quantity | Source Constant | Exact Value | CSS Variable | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Plate Coordinate Size** | `roomCoordinateSize` | `1672 × 941` | `--photo-width`, `--photo-height` | Exact 16:9-ish desk master plate coordinate system. |
| **Runtime Asset Density** | `macintosh-lc-*-desk-details.webp` | Up to `5016 × 2823` (3×) | — | High-DPI / close-zoom WebP (`-standard.webp` is `2508 × 1412`, 1.5×). |
| **Close Crop Reference** | `closeCrop` | `left: 294, top: 170, width: 1056, height: 520` | — | Reference monitor close-up framing rectangle. |
| **Screen Aperture** | `aperture` | `x: 632, y: 290, width: 380, height: 285` | `--aperture-x`, `--aperture-y`, `--aperture-width`, `--aperture-height` | Exact 4:3 glass opening (`380 / 285 = 1.3333`). |
| **Power LED / Switch** | `indicator` | `x: 635, y: 604.6` | `--switch-photo-x`, `--switch-photo-y` | Physical bezel power indicator below lower-left of screen (`44×40px` hit target). |
| **Virtual Desktop Stage** | `virtualScreen` | `1120 × 788.01px` (`1120 * 1087 / 1545`) | `--stage-layout-width`, `--stage-layout-height` | Internal CSS design width for all OS layouts inside `.screen-stage`. |
| **Tube Overscan** | `overscan` | `5` (plate units) | `--raster-overscan` | Extra bleed around aperture so curved displacement never reveals blank edges. |
| **Raster Inset** | `rasterInset` | `4.2` (plate units) | `--raster-inset` | Dark glass shoulder between phosphor coating (`rasterPath`) and plastic bezel (`glassPath`). |
| **Approved Room Framing** | `crt.css` | `(73, 10)` to `(1593, 893)` (`1520 × 883`) | `--far-unit` | Keeps Venetian blinds (`x >= 1515`) visible on taller viewports and desk/keyboard (`y = 735..825`) framed at bottom. |

---

## 3. Breakpoints & Physical Bezel Modes

| Mode | Media Query | Presentation |
| :--- | :--- | :--- |
| **Desktop Room View** | `@media (min-width: 1000px) and (min-aspect-ratio: 6/5)` | Renders the full Macintosh LC desk photograph (`<RoomArtwork />`), curved SVG aperture clipping (`#tube-aperture`), bezel power LED hotspot, and floating bottom-left monitor controls (`Zoom in/out`, `Enter/Exit fullscreen`, `Power`). |
| **Tablet / Narrow Bezel** | `< 1000px` or aspect ratio `< 6/5` (`min-width: 810px`) | Hides room photograph and zoom button (never downloads room plates); fills viewport with synthetic directional-lit dark casing bezel (`--crt-bz: 30px`, `--tube-radius: clamp(18px, 6vmin, 56px)`, stage inset `6px`) and lower-right hardware power button. |
| **Phone Compact Bezel** | `@media (max-width: 809px)` | Thins bezel to `--crt-bz: 12px`; hides room photograph and desktop camera pill (fullscreen exit button still appears if already in fullscreen). |

---

## 4. Three Camera Modes (`html[data-zoom]`)

Camera transitions animate smoothly over **`0.95s cubic-bezier(0.65, 0, 0.35, 1)`** using registered CSS `@property` numbers (`--crt-zoom`, `--crt-full`) and `@property --ground`:

| State | `data-zoom` | `--crt-zoom` / `--crt-full` | Behavior & Controls |
| :--- | :--- | :---: | :--- |
| **Far / Room** *(Default)* | `room` | `0` / `0` | Centers the CRT horizontally near `50vw` (`--room-focus-x/y`), framing the desktop keyboard (`y = 735..818`) cleanly at bottom. Clicking active screen content (not a drag or outside click) smoothly auto-zooms to `close`. |
| **Close** | `close` | `1` / `0` | Scales monitor to `min(90dvh / aperture.height, 78vw / aperture.width)` centered at `(50vw, 50dvh)` with zero horizontal drift, automatically requesting the detail WebP plate via responsive `srcset`. |
| **Fullscreen** | `fullscreen` | preserves `prevZoom` / `1` | Smoothly unwinds `--crt-full` from `0 -> 1`, easing SVG curvature displacement down to `0` before setting `data-crt-flat="on"` (`clip-path: none`, `mask: none`, `mix-blend-mode: normal`) so `.screen-stage` fills `100vw × 100dvh`. Does **not** mutate `data-reading`. |

### Keyboard Shortcuts (`CRTScreenControls`)
- `+` or `=`: Zoom in (`close`) in desktop room view.
- `-`: Zoom out (`room`), or exit fullscreen if active.
- `F`: Toggle `fullscreen` (restoring previous `room` or `close` view on exit).
- Shortcuts ignore inputs, textareas, selects, `contenteditable`, and open `<dialog>` modals.

---

## 5. Five Time-of-Day Lighting Scenes (`html[data-scene]`)

On initial load, `DesktopLayout.astro` picks the scene synchronously from the visitor's local clock (unless overridden via `?scene=<id>` or saved preference):

| Scene | Local Clock Window | Active Plate (`src/room-scenes.ts`) | `--room-bg` | `--window-light` / `--window-return` | Compact `--scene-glass` |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `morning` | `05:00 – 10:59` | `macintosh-lc-morning-desk-details{,-standard}.webp` | `#676a60` | `212 224 230` / `0.085` | `0.62` |
| `noon` | `11:00 – 13:59` | `macintosh-lc-noon-desk-details{,-standard}.webp` | `#8a8475` | `239 238 232` / `0.16` | `0.84` |
| `afternoon` *(fallback)* | `14:00 – 16:59` | `macintosh-lc-afternoon-desk-details{,-standard}.webp` | `#6b5846` | `234 228 213` / `0.145` | `1.00` |
| `dusk` | `17:00 – 19:59` | `macintosh-lc-dusk-desk-details{,-standard}.webp` | `#634a3e` | `240 177 129` / `0.075` | `0.30` |
| `night` | `20:00 – 04:59` | `macintosh-lc-night-desk-details{,-standard}.webp` | `#242732` | *(disabled; warm left lamp glow `::before`)* | `0.35` |

- **No-Flash Load Gating:** In desktop room view, `.screen-plane`, `.camera`, `.bezel-power`, and `.crt-bezel::after` remain hidden (`opacity: 0`) and entry animations pause until `<room-photograph>` decodes the active scene and sets `html[data-room-ready="on"]` (emitting `astro-phosphor:room-ready`, with a `1200ms` safety fallback).
- **Zero-JS Fallback:** Without JavaScript (`html:not([data-scene])`), `.room-artwork` renders the afternoon plate via CSS `image-set()`.

---

## 6. Power Switch, LED & Cathode-Ray Physics

### Hardware Tokens (Invariant Across OS Styles)

| Token | Value | Role |
| :--- | :--- | :--- |
| `--room-bg` | `#6b5846` *(overridden per scene)* | Warm desk fallback before room photo decodes. |
| `--crt-off` | `#010306` | Powered-off CRT tube glass backdrop. |
| `--entry-veil` | `#060607` | Cold-boot room awakening vignette veil. |
| `--crt-wake` | `rgba(255, 255, 255, 0.32)` | Subtle wake prompt ink when monitor power is off. |
| `--crt-led` | `rgb(93, 255, 155)` | Active green bezel power LED. |
| `--crt-led-standby` | `rgb(255, 171, 61)` | Standby amber LED when powered off. |
| `--zoom-bg` | `rgba(2, 11, 20, 0.72)` | Floating bottom-left camera pill surface. |

### Power-Cycle & First-Visit Animation Timings (`src/stores/osStore.ts` & `src/styles/crt.css`)

| Phase | Attribute | Duration | Sequence |
| :--- | :--- | :---: | :--- |
| **Power-Off Collapse** | `data-cooling="on"` | `1650ms` (`POWER_OFF_MS`) | High-voltage kick (`brightness 1.36`) -> vertical deflection collapse (`scale(1.03, 0.009)`) -> horizontal beam pinch (`.crt-beam`) -> central phosphor dot remanence (`.crt-afterglow`, `1.75s` starting at `0.54s`). |
| **Power-On Warm-Up** | `data-warming="on"` | `1900ms` (`POWER_ON_MS`) | Cathode filament pre-heat (`.crt-start-glow`) -> flyback horizontal strike (`.crt-beam`) -> vertical raster unfold + sweeping sync bar (`.crt-signal`) -> anode focus lock (`blur(10px) -> 0`). **NEVER replays on route navigation.** |
| **First-Visit Cold Boot** | `data-entry="booting"` | `1750ms` (`ENTRY_BOOT_MS`) | Once per browser session (`sessionStorage` key `astro-phosphor-entry`): `.entry-veil` lifts over `0.88s` while the tube ignites and LED brightens. Skipped immediately on route swap or under `prefers-reduced-motion: reduce`. |

- **Power-Off Accessibility:** Setting `data-power="off"` marks `.screen-stage` `inert`, saves focus, moves focus to the full-tube `.crt-off-screen` wake button (`"Press any key or the power button"`), and listens for any non-modifier keypress to power back on and restore focus.

---

## 7. The 7-Layer CRT Optical Stack & Per-OS Optics Controls

All optical layers live inside `CRTScreen.tsx` + `TubeOptics.tsx` + `.crt-scanlines` with mandatory **`pointer-events: none`**:

1. **Tube Curvature (`#tube-curvature`):** 4-tap bilinear SVG displacement filter computed from `#raster-profile` (`src/geometry/signal-lens.ts`) applied once to `.crt-emission`, paired with `pointerThroughGlass()` so dragged windows track the curved glass accurately. Active across all 5 peer OSes (`flatOptics: false`) in `room` and `close` views, and automatically flattened when `data-reading="on"`, `data-crt-flat="on"` (`fullscreen`), or when an OS opts into `flatOptics: true` (`html[data-os-flat-optics="on"]`).
2. **Tube Contour (`.crt-contour`):** Inner curved bezel shadow ring (controlled by `--crt-contour-opacity`), using a subtle directional warm plastic-lip shadow on non-phosphor OSes in desktop room view (`tube-shape.css`).
3. **Phosphor Ambient Bloom (`.crt-bloom`):** Soft central radial wash of `--lit` (controlled by `--crt-bloom-opacity`).
4. **Horizontal Scanlines, Gray Aperture-Grille & Glass Patina (`.crt-scanlines`):** Sits inside `.crt-raster` so all raster textures bend physically with `#tube-curvature`: 3px horizontal scanline grooves (`rgb(0 0 0 / var(--scanline-alpha))`), fine 3px vertical gray aperture-grille micro-stripes (`rgb(18 20 22 / var(--crt-grille-alpha))`), and a gentle vintage tube glass patina tint (`var(--crt-aging-tint)`). Defaults to `--crt-grille-alpha: 0` and `--crt-aging-tint: transparent` on `phosphor`.
5. **Edge Vignette (`.crt-vignette`):** Elliptical corner darkening (`rgb(var(--crt-vignette-rgb, 0 0 0) / var(--vignette-alpha))`), tinted warm charcoal (`28 24 20`) at gentle `0.15–0.16` alpha on light non-phosphor OSes, balanced `0.26–0.30` on dark non-phosphor OSes, and `0.60` pure black on `phosphor`.
6. **Micro-Flicker (`.crt-fl1`, `.crt-fl2`):** Fast `0.23s steps(1)` jitter + slow `2.7s steps(10)` breath; gated by `--flicker-display` (automatically `none` in Reading Mode and `prefers-reduced-motion: reduce`).
7. **Glass Reflection Sheen (`.crt-glass`):** Scene-matched window mullion reflection (`macintosh-lc-window-reflection.webp` tinted by `--window-light` / `--window-return`, or night desk-lamp edge sheen) paired with a subtle curved dome sheen on opaque peer OSes, scaled by `--glass-glare-opacity`.

> **Reduced Motion Invariant (`@media (prefers-reduced-motion: reduce)`):** Disables camera transitions, power-on/off/entry cathode animations, flicker layers (`--flicker-display: none`), and scene cross-fades across **all** OS styles.
