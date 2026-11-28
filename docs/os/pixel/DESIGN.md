# Pixel OS (`data-os="pixel"`) — Design System Specification

> A crisp 1984–1991 Classic Macintosh System 6/7 desktop workstation inside our physical Macintosh LC CRT monitor: pure paper-white (or night-slate dark) window surfaces, 1px/2px hairline ink borders, hard 3px/4px solid black offset shadows, 6-line pinstripe window titlebars with left Close `[×]` and right Maximize `[□]`, a top Menu Bar with 5-stripe retro rainbow mark, right-aligned 1-bit pixel icons, electric-cobalt highlights, and vermilion-orange primary CTAs.

**OS Identifier:** `data-os="pixel"` (one of 5 peer OS styles: `phosphor`, `coffee`, `rainbow`, `cli`, `pixel`)
**Reference Extraction:** Audited live from [AgencyOS Marketplace](https://www.framer.com/marketplace/templates/agencyos/) and its live preview [`agencyoperatingsystem.framer.website`](https://agencyoperatingsystem.framer.website/).
**Factory Presets (`data-theme`):** `paper` *(Default — Classic Light)*, `slate` *(Full Dark Mode)*, `mint` *(Vibes Meadow Tint)*, and `sky` *(Vibes Classic Ice Tint)*.
**Primary Aesthetic:** Classic Macintosh System 6/7 × Apple Rainbow Pixel Icons × Crisp Swiss-Bitmap Editorial

---

## 1. Visual Metaphor, Aesthetic DNA & Hardware Integration

### 1.1 Aesthetic DNA
Unlike `phosphor` (single-hue glowing amber-on-black terminal) or `coffee` (warm editorial serif paper), **Pixel OS** channels the high-contrast graphic clarity of an early **Macintosh + Color Classic** desktop:
- **Hard 1-Bit Graphic Discipline:** `0px` border radius on every OS element; `2px` crisp window borders (`1px` inactive & internal dividers); `2px` rimmed raised buttons with `2px` inner highlight/shadow bevels and hard `4px 4px 0 #000` shadows; `3px 3px 0 #000` drop shadows on windows, menus, and widgets. Zero soft Gaussian shadows or glassmorphism blur.
- **Monochrome Chrome Punctuated by Surgical Retro Color:** 90% of the viewport is crisp ink-on-paper (`#000000` on `#FFFFFF` in `paper`; `#ECECEC` on `#151518` / `#24242A` in `slate`). Color enters in three strictly scoped layers:
  1. **System Selection / Interactive Highlight:** Electric Cobalt (`#2D3CFF` light / `#7680FF` dark) for hovers, desktop icon selection, inline links, focus rings, and active menu rows.
  2. **Primary Action / Live Signal:** Vermilion Signal Orange (`#FF5A1F` light / `#FF6B35` dark) for primary CTA buttons (`.pixel-key--primary`), `8×8px` square availability indicators, and active deck LEDs.
  3. **5-Color Retro Apple Rainbow:** Green (`#82BA50`), Gold (`#ECB63A`), Red (`#C13D40`), Purple (`#834093`), and Sky Blue (`#589BD9`) — reserved for the slanted hero stripe band, top-bar emblem, 1-bit pixel icon top stripes, and AA-safe code syntax tokens.
- **Four-Voice Typography Harmony:** Combines a geometric bitmap display face (`'Geist Pixel'`) for large page headings, a classic OS bitmap sans (`'Pixelify Sans Variable'`) for menus/window titlebars/buttons/icons, an ultra-clean humanist grotesk (`'Geist Variable'`) for body prose and forms, and a technical monospace (`'Geist Mono Variable'`) for uppercase `11px` metadata, tabular timestamps, and code.

### 1.2 Hardware Shell Integration (`room`, `close`, `fullscreen`)
- **Physical CRT (`room` / `close`):** Sets `--crt-screen-blend: normal` so `#FFFFFF` paper stays luminous and opaque against desk daylight, `flatOptics: false` so Pixel OS curves physically inside the Macintosh LC tube (`#tube-curvature` + tighter `#tube-raster-tight` smoked-glass lip, with curved-corner safe padding on `.os-topbar`), calibrated `0.13` (`0.15` on `slate`) horizontal scanlines + `0.055` fine gray vertical aperture-grille micro-stripes, subtle `rgb(28 30 34 / 0.045)` vintage glass patina on light presets (`transparent` on `slate`), directional `0.90`/`0.95` recessed bezel contour, gentle warm `0.16` light / balanced `0.28` `slate` edge vignette, zero phosphor bloom (`--crt-bloom-opacity: 0`), and full `1.0` curved dome & window glass reflection sheen.
- **Fullscreen (`data-zoom="fullscreen"`):** Pure 1:1 desktop canvas (`--ground-fullscreen: var(--os-desktop-bg)`) with zero scanlines, aperture-grille, aging patina, vignette, or curvature; the bottom-left floating `Exit fullscreen` pill adopts a crisp `2px solid var(--px-ink)` + `3px 3px 0 #000` 1-bit frame.
- **Reading Mode (`data-reading="on"`):** Flattens `#tube-curvature` and dials scanlines to `0.02`, aperture-grille to `0`, aging patina to `transparent`, vignette to `0.08`, inner contour to `0.22`, and glare to `0` for distraction-free long-form reading.

---

## 2. Complete Extracted Color Palette & Presets

### 2.1 Core AgencyOS Token Table (Paper Light vs. Slate Dark)

| Semantic Role | CSS Token (`src/os/pixel/tokens.css`) | `paper` *(Default)* | `slate` *(Dark)* | Usage |
| :--- | :--- | :---: | :---: | :--- |
| **Primary Ink** | `--px-ink` | `#000000` | `#ECECEC` | Primary text, `1px`/`2px` borders, titlebar pinstripes, active inverted tabs. |
| **Window Paper** | `--px-paper` | `#FFFFFF` | `#151518` | Window interiors, top menu bar, dropdown menus, inputs, widget bodies, secondary buttons, desktop icon label pills. |
| **Desktop Canvas** | `--px-desktop` | `#FFFFFF` | `#24242A` | Desktop background behind windows & icons (distinct from `#151518` paper in `slate` so windows pop cleanly). |
| **Secondary Surface** | `--px-surface-alt` | `#EDEDED` | `#202025` | Breadcrumb/status bars, code blocks, table `<thead>`, toolbars, scrollbar tracks, Start menu footer. |
| **Muted Ink** | `--px-mute` | `#5E5E5E` | `#9C9CA4` | Excerpts, `11px` uppercase `Geist Mono` labels, disabled items, inactive window titles, timestamps. |
| **Highlight / Accent** | `--px-accent` | `#2D3CFF` | `#7680FF` | Hover fills, desktop icon hover labels, inline links, focus rings (`0 0 0 2px`). |
| **Highlight Inverse Ink** | `--px-accent-ink` | `#FFFFFF` | `#000000` | Text/icons seated over `--px-accent` fills (WCAG AAA in both modes). |
| **Primary CTA Accent** | `--px-cta` | `#FF5A1F` | `#FF6B35` | Primary action buttons (`.pixel-key--primary`), `8×8px` live status pixel. |
| **Primary CTA Ink** | `--px-cta-ink` | `#000000` | `#000000` | Text on `--px-cta` buttons. |
| **Hard Drop Shadow** | `--px-shadow` | `#000000` | `#000000` | `3px 3px 0` window/menu/widget shadow; `4px 4px 0` button shadow. |
| **Bevel Highlight** | `--px-bevel-hi` | `#FFFFFFB3` | `#FFFFFF38` | `inset 2px 2px 0` raised top-left button bevel (swaps on `:active`). |
| **Bevel Shadow** | `--px-bevel-lo` | `#00000038` | `#00000080` | `inset -2px -2px 0` raised bottom-right button bevel (swaps on `:active`). |
| **Dark Icon Halo** | `--px-icon-halo` | `transparent` | `#ECECEC` | High-contrast pixel outline contrast in dark mode. |
| **Rainbow — Green** | `--px-rainbow-green` | `#82BA50` | `#8FC75C` | Hero stripe 1, desktop icon stripe, code strings (`#46781E` AA light). |
| **Rainbow — Gold** | `--px-rainbow-yellow` | `#ECB63A` | `#F0BE4A` | Hero stripe 2, desktop icon stripe. |
| **Rainbow — Red** | `--px-rainbow-red` | `#C13D40` | `#D2494C` | Hero stripe 3, desktop icon stripe, code constants (`#B02A2E` AA light). |
| **Rainbow — Purple** | `--px-rainbow-purple` | `#834093` | `#9A55AA` | Hero stripe 4, desktop icon stripe, code functions (`#723282` AA light). |
| **Rainbow — Sky Blue** | `--px-rainbow-blue` | `#589BD9` | `#62A6E4` | Hero stripe 5, desktop icon stripe, code parameters (`#24609B` AA light). |

### 2.2 Factory Theme Presets (`src/os/pixel/meta.ts`)

| Theme ID | Label | `--px-desktop` | `--px-paper` | `--px-accent` | Character |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `paper` *(Default)* | Paper | `#FFFFFF` | `#FFFFFF` | `#2D3CFF` | Flagship AgencyOS 1-bit Classic Macintosh crisp white paper. |
| `slate` | Slate | `#24242A` | `#151518` | `#7680FF` | Authentic AgencyOS full dark mode with elevated `#151518` windows. |
| `mint` | Mint | `#EEF5E6` | `#FFFFFF` | `#3D7A1C` | AgencyOS Vibes Desktop Swatch #1 (Meadow Mint wallpaper + crisp white windows). |
| `sky` | Sky | `#E5EFF8` | `#FFFFFF` | `#2568A8` | AgencyOS Vibes Desktop Swatch #5 (Classic Ice wallpaper + crisp white windows). |

### 2.3 1-Bit Desktop Dot Pattern
`.screen-stage` layers an `8px × 8px` 1-bit pixel dot dither (`2×2px` crisp pixel dot per `8px` cell via `conic-gradient(from 90deg at 2px 2px, transparent 90deg, var(--px-dot-ink) 0)` at `0.11` light / `0.09` dark alpha) over `--os-desktop-bg`, honoring AgencyOS's `scale: 2px`, `4×4` pixel-unit `Dots` desktop pattern.

---

## 3. Typography System (Bundled `@fontsource` Quartet)

All four AgencyOS font families are bundled locally via `@fontsource` in `DesktopLayout.astro`:

| Token | Exact `@font-face` Family | Bundled Weights | Role |
| :--- | :--- | :---: | :--- |
| `--font-display` | **`'Geist Pixel'`** | `400` | Desktop hero wordmark, window page `h1` (`.page-title`), major `h2` (`.section-title`), 404 heading. |
| `--font-ui` | **`'Pixelify Sans Variable'`** | `400–700` | Top menu bar, `.os-topbar-links`, pull-down menus, window titlebars, desktop icon labels, buttons, taskbar tabs, Start menu. |
| `--font-sans` | **`'Geist Variable'`** | `100–900` *(normal & italic)* | Default body prose (`--os-font-body`), card titles (`600`), card excerpts, form inputs/selects/textareas, article prose. |
| `--font-mono` | **`'Geist Mono Variable'`** | `100–900` | Uppercase `11px` (`+0.06em`) window breadcrumb/status bars, widget kickers/tags, desktop footer hint, code blocks, tabular numerals. |

### 3.1 Responsive Type Scale (`Desktop >= 1200px` | `Tablet 810–1199px` | `Phone <= 809px`)

| Role | Token | Family | Desktop | Tablet | Phone | Line-Height | Tracking |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Desktop Hero** | `--type-h1` | `Geist Pixel` | `88px` *(clamped `7.6cqw`)* | `72px` | `48px` | `0.96` | `-0.02em` |
| **Page Title (`h1`)** | `--type-h2` | `Geist Pixel` | `68px` | `56px` | `40px` | `1.00` | `-0.02em` |
| **Section Title (`h2`)** | `--type-h3` | `Geist Pixel` | `36px` | `32px` | `26px` | `1.10` | `-0.01em` |
| **Article H2** | `--type-article-h2` | `Geist Pixel` | `34px` | `30px` | `26px` | `1.15` | `-0.01em` |
| **Article H3 / Card Title** | `--type-article-h3` | `Geist Variable` (`600`) | `22px` / `18px` | `22px` / `18px` | `20px` / `17px` | `1.30` | `-0.01em` |
| **Lead / Quote** | `--type-lead` | `Geist Variable` (`400`) | `18px` | `18px` | `16px` | `1.50` | `0em` |
| **Body Prose** | `--type-body` | `Geist Variable` (`400`) | `16px` | `16px` | `15px` | `1.60` (`1.75` CJK) | `0em` |
| **OS Chrome / UI** | `--type-ui` | `Pixelify Sans Variable` | `15px` | `15px` | `15px` | `1.20` | `0em` |
| **Desktop Icon Label** | `--type-label` | `Pixelify Sans Variable` | `14px` | `14px` | `12px` | `1.15` | `0em` |
| **Micro Label / Status** | `--type-quiet` | `Geist Mono Variable` (`500`) | `11px` | `11px` | `11px` | `1.30` | `+0.06em` *(UPPERCASE)* |
| **Code & Tables** | `--type-table` | `Geist Mono Variable` (`400`) | `14px` | `14px` | `13px` | `1.55` | `0em` |

**CJK Fallback Pairing:** Appends `"PingFang SC"`, `"Hiragino Sans GB"`, `"Noto Sans SC"` to display/UI/sans stacks and `"Sarasa Mono SC"`, `"LXGW WenKai Mono"` to monospace, maintaining `line-height: 1.75` for `:lang(zh)` prose.

---

## 4. OS Chrome Architecture & Shared DOM Hooks (`src/os/pixel/chrome.css`)

1. **Top-Only Classic Mac Menu Bar (`.os-topbar`, `hasTopBar: true`, `hasBottomBar: false`, `32px` fullscreen / `40px` CRT / `44px` phone):**
   - Full-width `var(--px-paper)` strip with `2px solid var(--px-ink)` bottom border. Bottom `.taskbar` is completely hidden (`display: none !important; --taskbar-height: 0px; --window-bottom: 18px; --wmax-bottom: 18px;`) so windows & right-aligned desktop icons breathe all the way down like an authentic Macintosh System 7 desktop.
   - `.os-topbar-mark`: `14×15px` 5-color rainbow pixel emblem (`border: 1px solid var(--px-ink)`), followed by site name + slanted `[OS]` monospace tag via `::after`.
   - **Top-anchored `<StartMenu placement="top" />`**: `.os-topbar-menu-btn` (`Menu`) opens `#topbar-start-menu-panel` **downward** right beneath the menu bar (`2px solid var(--px-ink)`, `3px 3px 0 #000`, spine-free Classic Mac pull-down menu with rightward flyout submenus on desktop and inline submenus on phone `<= 580px`). `.os-topbar-links` reveals `Work · Article · Journal · About · Contact` inline behind a `1px` vertical divider (`#2D3CFF` hover, `#000`/`#FFF` current inversion).
   - Right cluster: Active window label (only when viewing a section outside the 5 nav links such as `Design System`, `Magic Tower`, or a child detail route), crisp `1px`-bordered Sound toggle (`.os-topbar-sound`), `OS ▾` switcher (`1px` border + `2px 2px 0 #000` shadow), and live tabular `.os-topbar-clock`.
   - Mobile (`<= 809px`): hides `.os-topbar-links` and `.os-topbar-center` so Brand, downward `Menu`, Sound toggle, `OS ▾` switcher, and Clock fit cleanly with zero overflow.
2. **Right-Aligned Desktop Icons (`.desktop-icons`):**
   - Desktop (`>= 1200px`): 2-column right-aligned Macintosh rail (`right: 20px; top: 18px; grid-template-columns: repeat(2, 88px)`). Each `48×48px` icon sits inside a crisp `2px solid var(--px-ink)` white tile (`3px 3px 0 #000` shadow) with a `4px` rainbow top bar cycling through the 5 Apple colors; labels sit inside opaque `1px solid var(--px-ink)` pills (`2px 2px 0 #000`) flipping to `#2D3CFF` / `#FFFFFF` on hover/active.
   - Phone (`<= 809px`): centered `3×3` icon grid (`44×44px` framed tiles) above the hero lockup.
3. **Desktop Hero & `NOW.txt` Status Widget (`.os-desktop-widget`):**
   - Top-left (`left: 24px; top: 20px; width: 256px`): crisp `2px solid var(--px-ink)` + `3px 3px 0 #000` `NOW.txt` card with `24px` header, `8×8px` orange status square, `Geist Pixel` title, `Geist Mono` role tags, and cobalt underlined action links. Hidden on phone (`<= 809px`) so mobile home stays clean.
   - Center desktop canvas (`inset-inline: 304px 222px`): `Geist Pixel` site wordmark anchored over a slanted `15px` 5-stripe retro rainbow band + framed `TypedText` intro box.
4. **Classic Macintosh Window Chrome (`.os-window`):**
   - Desktop default frame (`--window-left: 32px; --window-right: 224px; --window-top: 18px`) leaves a `>= 26px` clean horizontal gutter clear of the right icon rail; outer frame `2px solid var(--px-ink)` (`1px` unfocused) + `3px 3px 0 #000` hard shadow, `0px` radius.
   - **Titlebar (`28px` desktop / `44px` phone):** Uses `.window-actions { display: contents; }` to place **Close `[×]` on LEFT (`order: 1`)**, centered `Pixelify Sans` `.window-title` (`order: 2`, opaque paper background masking the lines), and **Maximize `[□]` on RIGHT (`order: 3`)**. Focused windows draw **6 horizontal `1px` ink pinstripes** (`--os-titlebar-pattern`); unfocused stacked windows clear the pinstripes and hide controls.
   - **Breadcrumb & Status Bars:** `#EDEDED` (`#202025` dark) strips with `1px solid var(--px-ink)` rules and uppercase `11px` `Geist Mono` typography.
   - **Scrollbars:** Classic `12px` square pixel scrollbar (`#EDEDED` track with `1px` left rule, white bordered thumb turning `#2D3CFF` on hover).
5. **Beveled Buttons, Top-Only Pull-Down Menu & `/404` Bomb Dialog:**
   - `.pixel-key`: `2px solid var(--px-ink)`, `inset 2px 2px 0 var(--px-bevel-hi), inset -2px -2px 0 var(--px-bevel-lo), 4px 4px 0 #000`. Secondary hovers to `#2D3CFF`/`#FFF`; `.pixel-key--primary` rests in Vermilion `#FF5A1F` (`#000` text) and inverts to `#000`/`#FF5A1F` on hover; `:active` translates `(2px, 2px)` and flips the bevel.
   - Bottom `.taskbar` is omitted (`display: none !important; --taskbar-height: 0px`); fullscreen `.camera` sits cleanly at bottom-left (`bottom: 12px; left: 12px`) with `--window-left: 64px` / maximized left `64px` clearance so it never overlaps open windows or `.desktop-home-footer`.
   - `/404` Dialog (`.os-window--error`): Centered modal with `4px 4px 0 #000` shadow, framed warning icon with orange top bar, `Geist Pixel 32px` heading, and vermilion primary `Go to desktop` button.

---

## 5. Strict Do's and Don'ts (Pixel-Scoped)

- **Do** keep `border-radius: 0px` and hard `0px`-blur offset shadows (`3px 3px 0 #000` / `4px 4px 0 #000`) on every OS surface and control.
- **Do** keep `--crt-screen-blend: normal`, `--crt-bloom-opacity: 0`, and `flatOptics: false` with calibrated scanline/grille/patina CRT aging in `room`/`close` views (flattening cleanly in Reading Mode & Fullscreen).
- **Do** keep all portfolio photography, article covers, and pixel game canvases in **true color** (`filter: none`).
- **Do** scope every rule in `src/os/pixel/{tokens,chrome}.css` strictly to `html[data-os="pixel"]`.
- **Don't** apply phosphor text glow, dark-tube `0.60` vignette, rounded pill buttons, blurred shadows, or glassmorphism inside Pixel OS.
- **Don't** render body prose in `Pixelify Sans` — reserve `Pixelify Sans Variable` for OS chrome/UI and `Geist Variable` for prose and inputs.
