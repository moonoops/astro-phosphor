---
name: crt-room-artwork
description: Generate, relight, calibrate, and optimize custom 1990s CRT monitor desk background plates for Astro Phosphor. Use whenever a user wants to replace the physical computer/room background photograph, create custom time-of-day lighting scenes (morning/noon/afternoon/dusk/night), or align the CRT screen aperture and hardware power LED geometry.
---

# Custom CRT Room Artwork Skill (`crt-room-artwork`)

This skill guides you through replacing the physical CRT monitor & desk photography in **Astro Phosphor** without breaking responsive framing, curved glass clipping, pointer projection, or time-of-day lighting transitions.

---

## 1. How Room Framing Works in Astro Phosphor

Astro Phosphor renders the physical room background on desktop viewports matching:

```css
@media (min-width: 1000px) and (min-aspect-ratio: 6/5)
```

All coordinates are registered in a resolution-independent **16:9 composition grid** (`1672 × 941`, defined in `src/geometry/room-crop.js`):

- **`src/geometry/room-crop.js`**: `roomCoordinateSize` (`{ width: 1672, height: 941 }`)
- **`src/geometry/tube.ts`**:
  - `aperture`: `{ x, y, width, height }` — the exact bounding box of the CRT glass opening in `1672 × 941` space
  - `indicator`: `{ x, y }` — the center of the physical monitor power LED button
  - `glassPath` & `rasterPath` — local SVG paths (from `0..aperture.width`, `0..aperture.height`) tracing the curved glass edge and slightly inset phosphor coating
- **`src/room-scenes.ts`**: imports 5 responsive WebP pairs (`-standard.webp` at `2508px` wide + full `.webp` up to `5016px` wide) for `morning`, `noon`, `afternoon`, `dusk`, `night`
- **`src/styles/room-scenes.css`**: sets ambient fallback colors (`--room-bg`, `--case-*`) for narrow/tablet bezels and window reflection tint (`--window-light`, `--window-return`)

---

## 2. Image Generation Requirements (Mandatory Composition Contract)

If you generate a new retro computer / desk photograph using an image generation model, **enforce every constraint below** or the virtual CRT screen will misalign or clip awkwardly:

### 2.1 Framing & Geometry Rules
1. **Strict 16:9 landscape aspect ratio** (e.g., `2508×1411`, `3840×2160`, or `5016×2823` matching `1672:941`).
2. **Dead-straight front-on orthographic-like camera angle**:
   - The CRT monitor MUST face straight toward the camera (`0°` yaw, `0°` roll, minimal pitch).
   - **Never** generate a 3/4 angled monitor or heavy wide-angle perspective tilt — CSS places a planar DOM stage inside the aperture.
3. **Clean 4:3 CRT glass opening near center**:
   - Glass aperture width should span roughly **22%–26% of image width** and sit slightly above vertical center (reference: `x ≈ 38%`, `y ≈ 31%`, `width ≈ 22.7%`, `height ≈ 30.3%` — exact `4:3` ratio).
   - The unlit CRT screen glass MUST be **dark charcoal/black and blank** (NO fake desktop UI, text, logos, or bright reflections baked onto the screen center).
4. **Generous surrounding desk space**:
   - Include a substantial monitor forehead and chin (bezel plastic) and keep roughly the **top half of a vintage mechanical keyboard** anchored cleanly near the bottom edge so Far (`room`) view feels grounded and Close (`close`) view frames the bezel symmetrically.
   - Leave soft, uncluttered desk/wall breathing room on the left and right (e.g., desk lamp on the left, Venetian blinds or soft window light on the right, subtle props well clear of the monitor bezel).
5. **Clear hardware power LED spot**:
   - Include one clean small indicator LED on the lower monitor bezel (e.g., bottom-left or bottom-right chin) so `indicator` coordinates can align cleanly on top of it.
6. **Zero legible third-party logos, watermarks, or text**.

### 2.2 Ready-to-Use Base Prompt Template (Daylight / Afternoon Master Plate)

Customize the monitor model and desk props in `[brackets]` while keeping the framing instructions intact:

```text
Photorealistic 35mm film photograph of a [1990s beige desktop computer with matching 4:3 CRT monitor — e.g. Macintosh LC / Sony Trinitron / IBM PS/2 / Amiga monitor] resting straight-on in the center of a warm wooden desk.

Camera & framing: Strict 16:9 landscape composition, camera positioned dead-center and completely parallel to the monitor front face (zero perspective tilt, zero yaw). The 4:3 curved CRT glass screen sits cleanly in the center of the frame, completely powered off with dark matte obsidian glass and no text, no icons, no logos, and no bright glare. Substantial beige plastic bezel forehead and chin with a small recessed power indicator LED on the lower bezel. The upper half of a matching vintage beige mechanical keyboard rests cleanly along the bottom edge of the frame.

Environment & lighting: Natural warm afternoon sunlight casting soft Venetian-blind light bands across a matte plaster wall on the right. On the left side of the desk stands an articulated metal desk lamp (turned off in daylight); subtle minimal desk objects (books, mug, or ceramic cup) rest out of the way near the edges without overlapping the monitor bezel.

Optics & finish: Shot on 50mm lens, sharp focus plane on the CRT bezel and front housing, gentle natural depth-of-field falloff in the background, fine analog film grain, understated warm neutral tones, zero watermarks, zero readable brand names or logos.
```

### 2.3 Generating the 5 Time-of-Day Lighting Variants

To support Astro Phosphor's automatic local-clock scene switching, generate **5 pixel-aligned plates** from the exact same master composition (image-to-image / edit mode with strict structural lock so monitor edges do NOT shift by even 1 pixel!):

| Scene | Local Hours | Lighting Direction & Mood |
| :--- | :--- | :--- |
| **`morning`** | `05:00 – 10:59` | Cool-warm crisp early morning daylight from the window, soft long shadows, muted sage/ivory highlights, desk lamp off. |
| **`noon`** | `11:00 – 13:59` | Bright neutral overhead daylight, crisp clean beige tones, soft balanced contact shadows, desk lamp off. |
| **`afternoon`** | `14:00 – 16:59` | Classic warm golden afternoon light with subtle slanted Venetian-blind bands across the right wall, desk lamp off. |
| **`dusk`** | `17:00 – 19:59` | Low amber-orange sunset rays grazing the right wall, cool violet-slate room shadows, desk lamp warmly illuminated. |
| **`night`** | `20:00 – 04:59` | Deep quiet midnight blue-charcoal ambient room, no window sunlight, warm tungsten glow from the left desk lamp illuminating the left side of the monitor bezel and keyboard. |

> **Structural Lock Rule:** All 5 scenes MUST have identical pixel coordinates for the CRT glass opening and power LED. Never re-roll the camera crop between scenes! If you only want to prototype with a single plate first, use single-plate mode (`npm run art:room -- --single <file>`).

---

## 3. Asset Processing Pipeline (`npm run art:room`)

1. Place your 5 plates in `src/assets/room-originals/` named:
   - `morning.png` (or `.webp` / `.jpg`)
   - `noon.png`
   - `afternoon.png`
   - `dusk.png`
   - `night.png`
2. Run the optimizer script:
   ```sh
   npm run art:room
   ```
   *(Or while prototyping with one image: `npm run art:room -- --single path/to/desk.png`)*
3. The script writes 10 responsive WebP files directly into `src/assets/`:
   - `macintosh-lc-{scene}-desk-details.webp` (high-DPI detail plate, up to `5016px` wide)
   - `macintosh-lc-{scene}-desk-details-standard.webp` (1x desktop plate, `2508px` wide)
4. **Do NOT commit raw multi-megabyte `.png` masters** inside `src/assets/room-originals/` to git unless intentionally desired — keep the repository lightweight with WebP outputs only.

---

## 4. Calibrating Aperture, LED & Ambient Tokens

Whenever you swap to a **new** monitor photograph (different bezel proportions from the default Macintosh LC):

### Step 1: Measure the CRT Aperture & LED in `1672 × 941` Space
Scale any pixel measurement `(px, py)` taken from your plate of dimensions `(W, H)` into the `1672 × 941` coordinate space:

```text
coordX = px * (1672 / W)
coordY = py * (941 / H)
```

Update [`src/geometry/tube.ts`](../../../src/geometry/tube.ts):
- `aperture = { x, y, width, height }` — tight inner rectangle enclosing the dark CRT glass opening (ideally `width / height ≈ 4 / 3`).
- `indicator = { x, y }` — center of the hardware power LED on the monitor bezel.
- If the new monitor has a noticeably different corner curvature or aspect ratio, adjust `glassPath` and `rasterPath` proportionally to `0..aperture.width` and `0..aperture.height`.

### Step 2: Update Room Focus & Framing (If Needed)
In [`src/styles/crt.css`](../../../src/styles/crt.css) (inside `@media (min-width: 1000px) and (min-aspect-ratio: 6/5)`):
- Check `--room-focus-x` and `--room-focus-y` so the monitor remains centered at `1440×900` and the keyboard edge sits comfortably at the bottom.
- Verify `--close-unit` frames the CRT bezel cleanly when zoomed in without clipping the glass.

### Step 3: Tune Scene Ambient Colors & Glass Reflection
In [`src/styles/room-scenes.css`](../../../src/styles/room-scenes.css):
- Sample average wall/desk tones from each of your 5 scenes to update `--room-bg`, `--case-top`, `--case-base`, `--case-bottom`, and `--case-lip` so compact/tablet bezels harmonize with your room lighting.
- Optionally replace `src/assets/macintosh-lc-window-reflection.webp` with a grayscale alpha/luminance mask of your window glare pattern (white = subtle glass reflection, black = transparent).

---

## 5. Visual Verification Checklist

After running `npm run build` and opening the preview (`npm run preview`):

- [ ] **Room View (`1440×900`)**: CRT screen sits tightly inside the physical glass moulding with zero bright seam gaps and zero clipped taskbar edges.
- [ ] **Close View (click Zoom In or press `+`)**: Smooth 0.95s zoom with no horizontal drift; power LED stays pinned to the exact bezel LED spot.
- [ ] **Fullscreen View (press `F`)**: Bezel and curvature smoothly flatten to `#121418`; exiting fullscreen restores previous zoom cleanly.
- [ ] **All 5 Time-of-Day Scenes**: Preview `/?scene=morning`, `/?scene=noon`, `/?scene=afternoon`, `/?scene=dusk`, `/?scene=night` — confirm zero pixel shift between scenes.
- [ ] **Power Switch Toggle**: Clicking the hardware LED or Power button triggers the phosphor collapse/ignition animation and shifts LED color cleanly.
- [ ] **Compact & Phone Viewports (`900×900` & `390×844`)**: Room photo hides cleanly; compact bezel picks up the active scene's ambient `--case-*` colors with zero overflow.
