# AGENTS.md — Astro Phosphor Engineering Contract

> Engineering contract and workspace guide for **Astro Phosphor** — a lightweight, 100% static 1990s beige CRT monitor & monochrome phosphor desktop personal site template built with Astro 5, React 19, and Tailwind CSS v4.

**Mandatory First Rule:** Before creating, editing, or reviewing ANY visual component, page layout, CSS file, icon, cursor, or animation, **read [`docs/DESIGN.md`](docs/DESIGN.md) first** and obey every token, breakpoint, component recipe, and prohibition defined there.

**Custom Room Background Skill:** When the user asks to generate, replace, or recalibrate the physical CRT monitor / desk room background artwork, **read and follow [`.agents/skills/crt-room-artwork/SKILL.md`](.agents/skills/crt-room-artwork/SKILL.md)**.

---

## 1. Tech Stack & Architectural Boundaries

| Layer | Technology | Rules |
| :--- | :--- | :--- |
| **Meta-Framework** | Astro 5 (`output: 'static'`) | File-based routing, Content Collections (`zod` schemas), SEO `<head>`, MDX rendering, build-time TOC extraction, monochrome Shiki CSS-variables syntax highlighting. |
| **Interactive Islands** | React 19 + TypeScript (`strict: true`) | Used ONLY for stateful OS chrome, interactive page widgets, and offline arcade games. |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) + CSS custom properties | Define design tokens in `src/styles/tokens.css` and map via `@theme inline` in `src/styles/global.css`. Never add a legacy `tailwind.config.js`. |
| **Shared Client State** | `nanostores` + `@nanostores/react` | Syncs phosphor theme, room scene, Reading Mode, sound mute, camera zoom, power state, and window geometry across islands without a monolithic React root. |
| **Content** | Astro Content Collections (Markdown / MDX) | Strictly typed frontmatter in `src/content.config.ts` for `journal` and `projects`. |
| **Deployment** | Static hosting only | Zero required server runtime, database, or external API. `dist/` deploys directly to Cloudflare Pages, Vercel, Netlify, or GitHub Pages. |

---

## 2. Astro vs. React Separation (Strict)

1. **Keep content & routing in `.astro`:**
   - All top-level routes, layouts, SEO metadata, MDX rendering, heading extraction, project grids, and static copy MUST render at build time in Astro.
   - **Never** wrap the site in `<App client:only="react" />`.
2. **Use React Islands (`.tsx`) ONLY for interactive primitives:**
   - `client:load`: `CRTScreen`, `CRTScreenControls`, `WindowFrame`, `Taskbar` / `StartMenu`, `Clock`, `AfternoonSound`, `PixelCursors`, `DisplayPreferences`, `ContactComposer`, and offline arcade games.
   - `client:idle` / `client:visible`: `TypedText`, `GalleryLightbox`, `Contents` (scrollspy TOC), `ShareButtons`, `SetupWizard`, `FAQPanel`, `JournalFilter`.
3. **Preserve OS Chrome Across Route Navigations (`ClientRouter` + `transition:persist`):**
   - `DesktopLayout.astro` enables `<ClientRouter fallback="swap" />` and persists the room artwork (`crt-shell`), tube SVG mask (`tube-glass`), camera controls (`crt-controls`), CRT optical stack (`crt-optics`, `crt-scanlines`), pixel cursors (`pixel-cursors`), taskbar (`taskbar`, `audio`, `clock`), and entrance veil (`entry-veil`).
   - **Critical Constraint:** Navigating between routes MUST NOT replay the CRT entrance/warm-up blur or cause zoom jitter. Only the active window inside `.workspace-content` swaps on navigation.
4. **Zero Backend Coupling:**
   - Do NOT introduce `/api/*` fetches, server sessions, or required environment secrets in the core template. All preferences, high scores, and game save slots persist purely in `localStorage` / `sessionStorage`.

---

## 3. Route Map & Window Behavior

| Route | Window Type | Purpose |
| :--- | :--- | :--- |
| `/` | Desktop (no open window) | Symmetrical 6-icon desktop rail (2×3 desktop / 3×2 phone), `TypedText` intro, oversized `Jersey 10` hero `h1`, quiet hint. |
| `/work` | Standard Window | 3-column featured project grid (`PhosphorPicture` thumbnails, year & title). |
| `/work/[slug]` | Stacked Child Window | Case study (`License`, `Year`, `Type`, `Role` metadata, gallery opening true-color `GalleryLightbox`, MDX narrative, `Next project`). |
| `/journal` | Standard Window | Static MDX journal index with interactive category, tag, and keyword search (`JournalFilter`). |
| `/journal/[slug]` | Maximizable Article Window | 2-column reading layout: sticky left sidebar (`All entries`, scrollspy `Contents`, `ShareButtons`) + MDX prose + Reading Mode & CJK overrides. |
| `/about` | Standard Window | Pixel avatar, identity tags, bio, specs table, `SetupWizard`, principles, timeline, and `FAQPanel`. |
| `/contact` | Standard Window | Retro "New message" email composer (`mailto:` when `PUBLIC_CONTACT_EMAIL` is set; clean local `.txt` draft download otherwise). |
| `/design-system` | Standard Window | Live specimen sheet for phosphor presets, color tokens, 13-step type scale, monochrome code block, keycaps, fields, pixel icons, and widgets. |
| `/games` | Standard Window | Offline Arcade launcher listing all 5 pure-frontend retro games. |
| `/games/minesweeper` | Standard Window | Offline Minesweeper (3 difficulties, flag mode, chord reveal, local best times). |
| `/games/tetris` | Standard Window | Offline Tetris (distinct monochrome tile textures, ghost piece, hold slot, 8-bit Web Audio SFX). |
| `/games/snake` | Standard Window | Offline Snake (3 speed tiers, wrap-wall toggle, timed bonus fruit, swipe support). |
| `/games/2048` | Standard Window | Offline 2048 (keyboard + touch swipe + 20-step undo history). |
| `/games/mota` | Standard Window | Offline 21-floor tactical pixel RPG (`Magic Tower · 魔塔 21F`, 4 local save slots). |
| `/404` | Centered Error Dialog | Compact `461×290px` modal dialog with `Go to desktop` and `Open Work` actions. |

### Window & Keyboard Rules
- Closing (`×`) a top-level window navigates to `/`.
- Closing (`×`) a stacked child window (`/work/[slug]`, `/journal/[slug]`, `/games/*`) navigates back to its parent route.
- `Escape` closes the topmost layer first (`StartMenu`, `GalleryLightbox`, or in-game modal before closing the active window).
- Camera shortcuts on desktop room view: `+` / `=` zooms close, `-` zooms back to room view, `F` toggles bezel-free fullscreen.

---

## 4. Directory Map

```text
.agents/
└── skills/
    └── crt-room-artwork/
        └── SKILL.md          # Agent Skill for generating & calibrating custom CRT desk plates
docs/
└── DESIGN.md                 # Complete visual design specification & token reference
scripts/
├── prepare-room.mjs          # Responsive WebP generator for 5 time-of-day room plates
└── room-lighting.mjs         # Photometric exposure transfer helper
src/
├── assets/                   # 5 time-of-day WebP room pairs, window reflection, tube curve map
├── content.config.ts         # Zod schemas for `journal` and `projects`
├── content/
│   ├── journal/              # *.mdx blog posts (supports `lang: en` & `lang: zh-CN`)
│   └── projects/             # *.mdx portfolio case studies
├── data/
│   └── page-copy.json        # Centralized UI & page copy
├── games/
│   ├── arcadeSound.ts        # Zero-asset Web Audio 8-bit cues + theme palette reader
│   └── mota/                 # Magic Tower 21F engine, combat, floors, sprites, SFX
├── geometry/
│   ├── cabinet.js            # Bezel geometry helper
│   ├── room-crop.js          # Registered 1672×941 coordinate space & close crop box
│   ├── signal-lens.ts        # Pointer coordinate projection through curved CRT glass
│   └── tube.ts               # Aperture box, LED indicator, glass & raster SVG paths
├── layouts/
│   └── DesktopLayout.astro   # Persistent hardware bezel, optical layers, taskbar & window slot
├── pages/                    # Static Astro routes (/, /work, /journal, /about, /contact, /games, /design-system, /404)
├── components/
│   ├── os/                   # CRTScreen, Window, Taskbar, StartMenu, Clock, AfternoonSound, PixelIcon, PixelCursors, TubeOptics
│   ├── interactive/          # TypedText, GalleryLightbox, Contents, ShareButtons, SetupWizard, FAQPanel, JournalFilter, ContactComposer, DisplayPreferences, 5 offline games
│   ├── journal/              # JournalIndex.astro, posts.ts
│   ├── work/                 # WorkIndex.astro, projects.ts
│   └── ui/                   # ButtonBase, DesktopIcons, PhosphorPicture, PixelAvatar, RoomArtwork, TubeGlass
├── stores/
│   └── osStore.ts            # Persistent nanostores preferences & window geometry
├── navigation.ts             # Desktop shortcuts, offline games registry & Start Menu structure
├── room-scenes.ts            # Responsive srcset registry for the 5 time-of-day room plates
├── site.ts                   # Site name, handle, optional contact email & social links
└── styles/                   # tokens.css, crt.css, os.css, global.css, room-scenes.css, tube-shape.css, page styles
```

---

## 5. Adding New Windows, Apps, or Content

When extending this template:
1. **New Journal Post:** Add `src/content/journal/<slug>.mdx` matching the Zod schema (`title`, `pubDate`, `summary`, `category`, `tags`, optional `coverImage`/`coverAlt`, `lang: 'en' | 'zh-CN'`, `draft`).
2. **New Project:** Add `src/content/projects/<slug>.mdx` with thumbnails stored in `public/media/work/`.
3. **New Desktop Window / App:**
   - Create `src/pages/<route>.astro` wrapped in `<DesktopLayout section="...">` and `<WindowFrame client:load ...>`.
   - Register the `section` union and link in `src/navigation.ts` (and `src/components/os/Taskbar.tsx` if not in `applications`).
   - Add any new OS icon directly to `src/components/os/PixelIcon.tsx` using `shape-rendering="crispEdges"` on a clean pixel grid — **never** install `lucide-react`, `heroicons`, or anti-aliased icon packs.
   - Consume **only** CSS custom properties (`var(--lit)`, `var(--ground)`, `var(--lit-28)`, `var(--lit-10)`, `var(--lit-72)`, `var(--hi)`, `var(--side)`) — **zero hardcoded hex colors** inside components. For `<canvas>` games, read live tokens via `readPhosphorPalette()`.

---

## 6. State Persistence & Anti-FOUC Contract

An inline `<script is:inline>` in `DesktopLayout.astro` reads `localStorage['astro-phosphor-preferences']` before first paint and sets `<html data-*>`:
- `data-theme`: `"amber" | "green" | "blue" | "white"` (default `"amber"`)
- `data-reading`: `"off" | "on"` (softens scanlines/vignette/glow and disables flicker)
- `data-zoom`: `"room" | "close" | "fullscreen"` (default `"room"`)
- `data-scene`: `"morning" | "noon" | "afternoon" | "dusk" | "night"` (auto-selected from local clock unless overridden via `?scene=...`)
- `data-sound-muted`: `"false" | "true"` (never autoplays ambient audio without user interaction)

---

## 7. Mandatory Guardrails & Verification Checklist

- **Zero External Hotlinks:** Keep all imagery and fonts self-hosted (`@fontsource/*`, `src/assets/`, `public/`).
- **Safe Desktop Layout:** Default non-maximized windows maintain a clear horizontal gutter from the left desktop icon rail (`left >= 224px` in the `1120px` stage).
- **Single Select Chevron:** Always strip native `<select>` arrows (`appearance: none`) before overlaying `<PixelIcon name="chevron" />`.
- **Reduced Motion (`prefers-reduced-motion: reduce`):** Disables CRT flicker, warm-up/entrance animations, zoom transitions, and blinking cursors; `TypedText` renders immediately.
- **Keyboard Accessibility:** Every interactive control is a real `<button>` or `<a>` with `:focus-visible` (`2px dashed var(--lit); outline-offset: 2px`).

Before concluding any change, run and verify:
1. `npm run check` (`astro check && tsc --noEmit`) — **0 errors**
2. `npm run build` — **0 static build errors**
3. `npm run test:browser` (when Chrome is installed) — verify desktop room view (`1440×900`), compact bezel, phone (`390×844`), theme switching, Reading Mode, window drag/close, journal filtering, and offline games with zero console/network errors.
