---
name: room-backdrop
description: Generate, optimize, calibrate, and verify a custom photorealistic 1990s CRT desk/monitor hardware backdrop (including all 5 time-of-day WebP scenes, CRT aperture geometry, power LED coordinates, and Playwright checks) for Astro Phosphor.
---

# Room Backdrop & Hardware Calibration Skill (`room-backdrop`)

Use this skill whenever the user wants to replace the physical desk/monitor room photograph (currently a 1990 Macintosh LC on a sunlit desk) with a new custom hardware backdrop — such as a different vintage computer, CRT workstation, studio desk, or room interior — while keeping the 3 camera views (`room` / `close` / `fullscreen`), 5 time-of-day scenes, curved glass aperture, and power LED accurately aligned across all 5 peer OS styles.

> **Before starting:** Read [docs/os/hardware.md](../../../docs/os/hardware.md) and [references/calibration-guide.md](references/calibration-guide.md) for exact coordinate math and asset contracts.

---

## 1. Composition & Image Generation Guidelines

Whether photographing real hardware or generating plates with an image model, every **master plate** MUST satisfy these non-negotiable geometric constraints:

1. **Aspect Ratio & Resolution:**
   - Exact **`1672 : 941`** aspect ratio (`~1.7768:1`, essentially 16:9).
   - Recommended **`5016 × 2823`** (exact `3×` of `1672 × 941`) or **`3344 × 1882`** (`2×`) so close-zoom on Retina displays stays sharp.
2. **Straight-On Frontal Camera:**
   - Shoot/generate the monitor **dead front-on** (`0°` yaw, `0°` roll, minimal pitch). Angled three-quarter views will break rectangular window layout and aperture clipping.
3. **Unobstructed Dark 4:3 CRT Aperture:**
   - Keep the CRT glass dark/unlit and blank (no fake UI, logos, cables, or sticky notes crossing the edges).
   - Target roughly a **4:3** glass opening centered horizontally (`x ≈ 38%`, `y ≈ 31%`, `width ≈ 22.7%`, `height ≈ 30.3%`; default Macintosh LC is `x: 632, y: 290, w: 380, h: 285` in `1672 × 941` space).
4. **Desk & Keyboard Framing (Far / `room` Camera):**
   - Keep breathing room above (`y >= 170`) and roughly half to full depth of a matching mechanical keyboard along the lower edge (`y ≈ 735..825`).
   - Include ambient room cues (desk lamp on left, Venetian blinds or window light on right) for time-of-day storytelling.
5. **Clear Power LED Spot:**
   - Include a clean, unobstructed power indicator LED on the lower monitor bezel so CSS can render active green vs. standby amber cleanly.

### Starter Image Generation Brief (Daylight / Afternoon Master Plate)

> Photorealistic 35mm film photograph of a `[1990s beige desktop computer with 4:3 CRT monitor]` resting straight-on in the center of a warm wooden desk. Strict 16:9 landscape composition (`5016×2823`), camera dead-center and completely parallel to the monitor front face (zero perspective tilt, zero yaw). Dark unlit 4:3 curved CRT glass screen with no text, icons, logos, or harsh glare. Substantial beige plastic bezel forehead and chin with a small recessed power indicator LED on the lower bezel. Upper half of a matching vintage mechanical keyboard along the bottom edge. Warm afternoon sunlight casting soft Venetian-blind bands across a matte plaster wall on the right; articulated desk lamp (off in daylight) on the left. Sharp focus plane on the bezel, fine analog film grain, zero watermarks or legible brand names.

---

## 2. Creating & Optimizing the 5 Time-of-Day WebP Plates (`npm run art:room`)

Generate **5 pixel-locked lighting variants** from the exact same camera framing (zero pixel shift on bezel or LED coordinates!):

| Scene ID | Local Clock Window | Lighting Mood |
| :--- | :--- | :--- |
| `morning` | `05:00 – 10:59` | Cool-warm crisp early morning daylight, soft long shadows, lamp off. |
| `noon` | `11:00 – 13:59` | Bright neutral overhead daylight, crisp beige tones, lamp off. |
| `afternoon` | `14:00 – 16:59` | Classic warm golden afternoon sunlight with slanted Venetian-blind bands, lamp off. |
| `dusk` | `17:00 – 19:59` | Low amber-orange sunset rays grazing the right wall, cool shadows, lamp softly lit. |
| `night` | `20:00 – 04:59` | Quiet midnight charcoal room, no window light, warm tungsten desk lamp illuminating the left bezel. |

### Processing Pipeline (`scripts/prepare-room.mjs`)

1. Place your 5 plates in `src/assets/room-originals/` named `morning.*`, `noon.*`, `afternoon.*`, `dusk.*`, `night.*` (`.png`, `.webp`, or `.jpg`).
2. Run:
   ```sh
   npm run art:room
   ```
   *(Or while prototyping with a single plate across all 5 slots: `npm run art:room -- --single path/to/desk.png`)*
3. `scripts/prepare-room.mjs` writes 10 responsive WebP files into `src/assets/`:
   - `macintosh-lc-{scene}-desk-details.webp` (high-DPI detail plate, up to `5016px` wide)
   - `macintosh-lc-{scene}-desk-details-standard.webp` (1× desktop plate, `2508px` wide)
4. Do **not** commit huge raw `.png` masters in `src/assets/room-originals/` — keep the repository lightweight with WebP outputs.

---

## 3. Measuring & Calibrating Hardware Geometry

Convert pixel measurements on your master image (`W × H`) into the **`1672 × 941`** logical coordinate space:

```text
logical_x = pixel_x * (1672 / W)
logical_y = pixel_y * (941  / H)
```

Update these files in order (see [references/calibration-guide.md](references/calibration-guide.md) for a Node measurement helper):

1. **`src/geometry/tube.ts`** *(Critical — controls screen placement, glass clip, curvature & LED)*:
   - `aperture`: `{ x, y, width, height }` — tight bounding box of the CRT glass opening in `1672 × 941` space.
   - `indicator`: `{ x, y }` — center of the hardware power LED on the bezel.
   - `overscan` (default `5`) & `rasterInset` (default `4.2`) — tune for thicker/thinner inner moulding shoulders.
   - `glassPath` & `rasterPath` — local SVG paths (`0..aperture.width × 0..aperture.height`) tracing the glass rim and slightly inset raster area.
2. **`src/geometry/room-crop.js`**:
   - Keep `roomCoordinateSize = { width: 1672, height: 941 }` and update `closeCrop` if bezel proportions changed significantly.
3. **`src/geometry/cabinet.js`**:
   - Update `cabinetOutline` (outer casing polygon in `1672 × 941` coordinates) if the casing silhouette changed.
4. **`src/styles/crt.css` & `src/styles/room-scenes.css`**:
   - Check `--far-unit`, `--room-focus-x`, `--room-focus-y`, and `.bezel-power .hardware-led` sizing in `src/styles/crt.css`.
   - Sample average wall/desk tones per scene to update `--room-bg`, compact bezel `--case-*`, `--crt-shoulder-*`, and `--window-light` / `--window-return` in `src/styles/room-scenes.css`.
   - Optionally replace `src/assets/macintosh-lc-window-reflection.webp` with a matching window-glare mask.

---

## 4. Verification & Visual QA

```sh
npm run check
npm run build
npm run test:browser
```

### Mandatory Acceptance Checks
- [ ] **Alignment (`room` & `close`):** Zero gap or spill between the OS screen corners and the photographed CRT moulding at `1440×900` and `1920×1080`.
- [ ] **Power LED Registration:** Clicking the bezel LED toggles power; green active LED and amber standby LED align precisely across all 5 scenes.
- [ ] **All 5 Scenes:** Preview `/?scene=morning`, `/?scene=noon`, `/?scene=afternoon`, `/?scene=dusk`, `/?scene=night` — zero pixel shift between scenes.
- [ ] **Cross-OS Sanity:** Check both **Rainbow** (light studio paper, tight raster mask `#tube-raster-tight`) and **Phosphor** (dark monochrome CRT, `#tube-raster`) in `room`, `close`, and `fullscreen` views.
- [ ] **Compact & Phone (`900×900`, `390×844`):** Room plates are never downloaded; compact bezel inherits scene `--case-*` colors with zero horizontal overflow.
