# AGENTS.md — Astro Phosphor Multi-OS Static Personal Site (Astro 5 + React 19 + Tailwind CSS v4)

> Repo-wide, OS-agnostic engineering contract and architecture guide for **Astro Phosphor** — a **100% static**, zero-backend 1990s CRT desk hardware shell hosting **5 peer pluggable retro desktop OS styles** (`rainbow`, `phosphor`, `coffee`, `cli`, `pixel` — 20 theme presets total) over a single shared library of Astro routes, bilingual MDX content collections, interactive UI specimens, and 5 offline arcade games.

---

## 1. Mandatory Design Documentation Routing Table

Before creating, editing, or reviewing **any** visual component, layout, stylesheet, cursor, icon, or animation, **read the relevant specification(s) from this table first** and obey every token, contract, and OS-scoped prohibition:

| Scope of Work | Required Document(s) |
| :--- | :--- |
| **Any UI, shared app, layout, or cross-OS work** | [docs/DESIGN.md](docs/DESIGN.md) *(Master Index, Shared Semantic Token Contract & Legacy App Bridge)* |
| **Physical desk room, CRT bezel, 5 scenes, 3 camera views, power physics, optical layers** | [docs/os/hardware.md](docs/os/hardware.md) |
| **Rainbow OS (`data-os="rainbow"`, default)** | [docs/os/rainbow/DESIGN.md](docs/os/rainbow/DESIGN.md) |
| **Phosphor CRT OS (`data-os="phosphor"`)** | [docs/os/phosphor/DESIGN.md](docs/os/phosphor/DESIGN.md) |
| **Coffee OS (`data-os="coffee"`)** | [docs/os/coffee/DESIGN.md](docs/os/coffee/DESIGN.md) |
| **CLI OS (`data-os="cli"`)** | [docs/os/cli/DESIGN.md](docs/os/cli/DESIGN.md) |
| **Pixel OS (`data-os="pixel"`)** | [docs/os/pixel/DESIGN.md](docs/os/pixel/DESIGN.md) |

### Built-In Workspace Skills

Use these workspace skills for specialized hardware or theming workflows:

- **Add a new peer OS style:** [.agents/skills/add-os-style/SKILL.md](.agents/skills/add-os-style/SKILL.md)
- **Replace or calibrate the physical desk/monitor room backdrop:** [.agents/skills/room-backdrop/SKILL.md](.agents/skills/room-backdrop/SKILL.md)

> **Scope Discipline for Style Rules:** OS-specific aesthetic prohibitions (such as Phosphor's strict `0px` border radius, monochrome single-hue palette, and pixel-only iconography) live exclusively inside each OS's own `docs/os/<id>/DESIGN.md`. Do **not** impose one OS's aesthetic rules globally onto peer OSes.

---

## 2. Three-Layer Platform Architecture

All UI code MUST respect the strict separation between these three layers:

1. **Layer 1 — Physical Hardware Shell (`docs/os/hardware.md`)**
   - Photorealistic Macintosh LC desk environment (`1672 × 941` coordinate plate space), 5 time-of-day lighting scenes (`morning`, `noon`, `afternoon`, `dusk`, `night`), 3 camera views (`room`, `close`, `fullscreen`), power switch/LED & cathode-ray warm-up/collapse physics, and OS-aware 7-layer CRT optical overlays (`CRTScreen.tsx`, `TubeOptics.tsx`, `src/styles/crt.css`, `src/styles/tube-shape.css`).
   - Completely OS-agnostic: switching `data-os` never alters room geometry or camera behavior, and each peer OS tunes optical intensities (`--crt-bloom-opacity`, `--crt-contour-opacity`, `--crt-screen-blend`, `--scanline-alpha`, `--crt-grille-alpha`, `--crt-aging-tint`, `--vignette-alpha`, `--crt-vignette-rgb`, `--flicker-display`, `--glass-glare-opacity`, `--text-glow-*`, plus `flatOptics`) via its own tokens/metadata.
2. **Layer 2 — Peer Pluggable OS Registry (`src/os/`)**
   - All 5 OS styles (`phosphor` | `coffee` | `rainbow` | `cli` | `pixel`) are equal peers registered via `src/os/registry.ts` (`osIds`, `osRegistry`, `osList`, `getOsDefinition()`, `resolveOsTheme()`, `osBootstrapConfig`).
   - Each OS is isolated in `src/os/<id>/` (`meta.ts`, `tokens.css`, `chrome.css`), imported through `src/os/index.css`, and scoped strictly to `html[data-os="<id>"]` (`phosphor` also provides `:root` fallback defaults).
   - Chrome extension slots (`.os-topbar` via `OsTopBar.tsx` controlled by `--topbar-height`, and `.os-desktop-widget` on `/`) are zero-FOUC CSS-gated and follow the Zero-Duplication Law.
3. **Layer 3 — Shared Static Apps, Routes & Content (`src/pages/`, `src/components/interactive/`, `src/content/`, `src/styles/*.css`)**
   - Every page, project case study, bilingual journal essay, design specimen, and offline game is built **once** and consumes the **Shared Semantic Token Contract** (`--os-*`) and **Legacy App Compatibility Bridge** (`--ground`, `--lit`, `--lit-10`, `--lit-28`, `--lit-72`, `--hi`, `--side`) defined in [docs/DESIGN.md](docs/DESIGN.md).
   - Never fork or duplicate app business logic per OS.

---

## 3. Pure-Static & Subpath Deployment Contract (Strict)

1. **100% Static Output (`output: 'static'`):**
   - Everything builds to plain HTML/CSS/JS/WebP in `dist/` with **zero required backend server, database, or `/api/*` endpoints**.
   - Offline games persist scores and save slots in `localStorage` only; Contact uses `PUBLIC_CONTACT_EMAIL` `mailto:` handoff or downloads a local `.txt` draft.
2. **Subpath Base Compatibility (`SITE_BASE` + `withBase()`):**
   - `astro.config.mjs` reads `SITE_URL` and `SITE_BASE` (default `/`) so GitHub Pages subpath hosting (e.g., `SITE_BASE=/astro-phosphor/`) works seamlessly.
   - **Every** internal link `href` and public asset URL (`/media/...`, `/favicon.svg`, etc.) MUST pass through `withBase(...)` from `src/site.ts` (note: `ButtonBase`, `WindowFrame` breadcrumbs, `PhosphorPicture`, and `navigation.ts` already wrap their URLs via `withBase()`).
3. **Keep Content & Routing in `.astro`:**
   - All top-level routes, layouts, SEO metadata, MDX rendering, heading extraction (for TOC), project grids, and static sections render at build time in Astro. **Never** wrap the app in `<App client:only="react" />`.
4. **Use React Islands (`.tsx`) ONLY for Interactive Chrome & Widgets:**
   - `client:load`: `CRTScreen`, `CRTScreenControls`, `OsTopBar`, `WindowFrame`, `Taskbar`, `StartMenu`, `Clock`, `AfternoonSound`, `PixelCursors`, `DisplayPreferences`, `ContactComposer`, and the 5 offline games (`MinesweeperGame`, `TetrisGame`, `SnakeGame`, `Game2048`, `MagicTowerGame`).
   - `client:idle`: `TypedText`, `GalleryLightbox`, `Contents`, `ShareButtons`, `SetupWizard`, `FAQPanel`, `JournalFilter`.
5. **Preserve OS Chrome Across Navigations (`ClientRouter` + `transition:persist`):**
   - `DesktopLayout.astro` enables `<ClientRouter fallback="swap" />` and persists hardware/OS singletons: `crt-shell`, `tube-glass`, `crt-controls`, `crt-optics`, `pixel-cursors`, `os-topbar`, `taskbar`, `audio`, `clock`, `crt-scanlines`, `entry-veil`.
   - Navigating between routes MUST NOT replay the 1.9s CRT warm-up blur, lose `data-os`/`data-theme`/`data-scene`/`data-zoom`/`data-reading`, or cause zoom jitter.

---

## 4. Information Architecture & Route Map

Every section is a real static URL:

| Route | Window Type | Purpose |
| :--- | :--- | :--- |
| `/` | Desktop (no open window) | Symmetrical 6-icon desktop rail (`2×3` desktop, `3×2` phone), optional `.os-desktop-widget` (`NOW.txt`), `TypedText` intro, hero title. |
| `/work` | Standard Window | Project case study grid (`WorkIndex.astro`), thumbnails, year & role. |
| `/work/[slug]` | Stacked Child Window | Case study (`License`, `Year`, `Type`, `Role` meta, MDX narrative, `GalleryLightbox`, `Next project` link). |
| `/journal` | Standard Window | Bilingual long-form Astro MDX blog (`src/content/journal/`) with client-side category/tag/keyword `JournalFilter`. |
| `/journal/[slug]` | Maximizable Article Window | 2-column reading view: left sidebar (`All entries`, scrollspy `Contents` TOC, `ShareButtons`) + main MDX prose (`lang: en` or `zh-CN`). |
| `/about` | Standard Window | Maker bio, pixel avatar, desk specs, principles, `SetupWizard`, timeline, and `FAQPanel`. |
| `/contact` | Standard Window | Retro "New message" email composer (`ContactComposer.tsx`) with `mailto:` or local `.txt` draft download. |
| `/games` | Standard Window | Offline Arcade launcher linking all 5 pure-frontend games. |
| `/games/minesweeper` | Standard Window | Minesweeper (`MinesweeperGame.tsx`) — 3 difficulties, OS-aware tiles, local best times. |
| `/games/tetris` | Standard Window | Tetris (`TetrisGame.tsx`) — monochrome CRT textures on Phosphor + 16-bit color bevels on peer OSes, ghost drop, hold slot, 8-bit SFX. |
| `/games/snake` | Standard Window | Snake (`SnakeGame.tsx`) — 3 speed tiers, wrap walls, bonus star fruit, OS-aware canvas. |
| `/games/2048` | Standard Window | 2048 (`Game2048.tsx`) — monochrome or jewel tile progression, 20-step undo, swipe controls. |
| `/games/mota` | Standard Window | Magic Tower 21F (`MagicTowerGame.tsx`, `src/games/mota/`) — Standard & Hard difficulties, 9 monster traits, Hybrid/Full-Color mode, 4 local save slots. |
| `/design-system` | Standard Window | Live specimen sheet & interactive OS/Theme/Reading switcher (`DisplayPreferences.tsx`). |
| `/404` | Centered Error Dialog | Compact alert dialog over desktop with `Go to desktop` and `Open Work` actions. |

### URL-to-Window Behavior
- Closing (`×`) a top-level window navigates to `withBase('/')`.
- Closing (`×`) a stacked child window (`/work/[slug]`, `/journal/[slug]`, `/games/*`) navigates back to its parent list.
- Pressing `Escape` closes the topmost open `<dialog>` (`GalleryLightbox`) first, otherwise closes the active focused window.

---

## 5. Directory Map

```text
.agents/
└── skills/
    ├── add-os-style/         # Skill for adding a new peer OS style
    └── room-backdrop/        # Skill & calibration reference for replacing the desk/CRT backdrop
docs/
├── DESIGN.md                 # Master design index, shared semantic tokens & peer OS contract
├── os/
│   ├── hardware.md           # Layer 1: room plates, aperture geometry, 5 scenes, 3 camera views, CRT optics
│   ├── rainbow/DESIGN.md     # Layer 2: Rainbow OS spec (default)
│   ├── phosphor/DESIGN.md    # Layer 2: Phosphor CRT OS spec
│   ├── coffee/DESIGN.md      # Layer 2: Coffee OS spec
│   ├── cli/DESIGN.md         # Layer 2: CLI OS spec
│   └── pixel/DESIGN.md       # Layer 2: Pixel OS spec
└── screenshots/              # Multi-OS README showcase WebP captures
scripts/
└── prepare-room.mjs          # Generates 10 responsive WebP desk plates (5-plate or --single mode)
src/
├── assets/                   # 10 responsive WebP room plates, tube lens map, glass reflection masks
├── components/
│   ├── os/                   # CRTScreen, TubeOptics, OsTopBar, Window, Taskbar, StartMenu, Clock, AfternoonSound, PixelCursors, PixelIcon
│   ├── interactive/          # DisplayPreferences, TypedText, GalleryLightbox, Contents, ShareButtons, JournalFilter, ContactComposer, SetupWizard, FAQPanel, 5 offline games
│   ├── ui/                   # ButtonBase, DesktopIcons, PhosphorPicture, RoomArtwork, TubeGlass, PixelAvatar
│   ├── journal/              # JournalIndex.astro, posts.ts
│   └── work/                 # WorkIndex.astro, projects.ts
├── content/
│   ├── journal/              # Long-form bilingual MDX articles rendered under /journal
│   └── projects/             # Project case studies rendered under /work
├── content.config.ts         # Astro Content Collection Zod schemas
├── data/page-copy.json       # Centralized editable UI & profile copy
├── games/                    # arcadeSound.ts & Magic Tower (src/games/mota/) engine
├── geometry/                 # cabinet.js, room-crop.js, tube.ts, signal-lens.ts
├── layouts/
│   └── DesktopLayout.astro   # Hardware shell + pre-paint state sync + persistent OS chrome + window slot
├── os/                       # Layer 2: Peer OS Registry & isolated per-OS modules
│   ├── types.ts              # osIds, OsId, OsCursorStyle, OsThemePreset, OsDefinition
│   ├── registry.ts           # DEFAULT_OS, osRegistry, osList, getOsDefinition, resolveOsTheme, osBootstrapConfig
│   ├── index.css             # Imports all 5 peer OS tokens.css & chrome.css
│   ├── phosphor/             # meta.ts, tokens.css, chrome.css
│   ├── coffee/               # meta.ts, tokens.css, chrome.css
│   ├── rainbow/              # meta.ts, tokens.css, chrome.css
│   ├── cli/                  # meta.ts, tokens.css, chrome.css
│   └── pixel/                # meta.ts, tokens.css, chrome.css
├── pages/                    # Static Astro routes
├── stores/osStore.ts         # nanostores client preferences & window geometry
└── styles/                   # Hardware (tokens, crt, tube-shape, room-scenes), shared shell (global, os, home), and per-app stylesheets (incl. game-themes.css)
tests/                        # Playwright browser & multi-OS verification suite
```

---

## 6. Content Collection Schemas (`src/content.config.ts`)

- **`journal`** *(long-form posts rendered at `/journal` & `/journal/[slug]`)*:
  - `title: z.string()`, `pubDate: z.coerce.date()`, `summary: z.string().max(220)`, `category: z.string()`, `tags: z.array(z.string()).default([])`, `coverImage: z.string().optional()`, `coverAlt: z.string().optional()`, `lang: z.enum(['en', 'zh-CN']).default('en')`, `draft: z.boolean().default(false)`.
- **`projects`** *(case studies rendered at `/work` & `/work/[slug]`)*:
  - `title: z.string()`, `year: z.number()`, `summary: z.string()`, `client: z.string()`, `work: z.string()`, `role: z.string()`, `thumbnail: z.string()`, `thumbnailAlt: z.string()`, `featuredOrder: z.number().default(99)`, `liveUrl: z.string().url().optional()`, `repoUrl: z.string().url().optional()`, `gallery: z.array(z.object({ src, alt, caption? })).default([])`.

---

## 7. State Persistence & Zero-FOUC Contract

Persist user preferences in `localStorage` under `astro-phosphor-preferences` (guarded against SSR and private-mode storage errors) and apply `data-*` attributes synchronously in `<head>` via `DesktopLayout.astro`'s inline script before first paint — and copy all active dataset keys on `astro:before-swap`:

- `data-os`: `"rainbow" | "phosphor" | "coffee" | "cli" | "pixel"` (default `"rainbow"`; supports `?os=<id>` query override)
- `data-theme`: Active OS's sub-theme (default `"studio"` on `rainbow`; remembered per OS via `osThemes`)
- `data-os-flat-optics`: `"on"` (present only when active OS metadata declares `flatOptics: true`)
- `data-reading`: `"off" | "on"` (independent of `fullscreen`; softens CRT optical interference for long-form reading)
- `data-zoom`: `"room" | "close" | "fullscreen"` (default `"room"`; tracks `data-prev-zoom` and `data-crt-flat`)
- `data-scene`: `"morning" | "noon" | "afternoon" | "dusk" | "night"` (resolved from local clock unless saved or overridden via `?scene=<id>`)
- `data-power`: `"on" | "off"` (transient `data-warming`, `data-cooling`, `data-entry`)
- `data-sound-muted`: `"true" | "false"` (respect browser autoplay policies)

---

## 8. Global Guardrails & Invariants

These invariants apply across **all 5 peer OSes**:

1. **Zero Hardcoded App Colors:** Shared apps (`src/components/interactive/`, `src/styles/<app>.css`) MUST consume semantic OS tokens (`--os-*`), game palette tokens (`src/styles/game-themes.css`), or bridge tokens (`--ground`, `--lit`, `--lit-10`, `--lit-28`, `--lit-72`, `--hi`, `--side`).
2. **Original Assets Only:** Never hotlink third-party CDN assets or reuse proprietary third-party media. Keep all owned assets in `src/assets/` or `public/`.
3. **Desktop Icon Clearance:** Default non-maximized windows on desktop MUST leave a clean horizontal gutter (`>= 24px`) clear of the desktop icon rail.
4. **Single `<select>` Chevron:** Always strip native select chrome (`appearance: none`) before rendering a custom chevron.
5. **No Route-Change CRT Blur Flash:** Never replay power-on warm-up or first-visit cold boot during normal `ClientRouter` navigation.
6. **Optical Layer Pointer Pass-Through:** Every CRT optical overlay (`.crt-optics`, `.crt-scanlines`, `.crt-glass`, beam/signal effects) MUST keep `pointer-events: none`.
7. **Reduced Motion (`prefers-reduced-motion: reduce`):** MUST disable CRT flicker, camera transitions, cathode power animations, and cursor blink; `TypedText` reveals immediately.
8. **Keyboard & Focus Accessibility:** All interactive controls must be semantic `<button>` or `<a>` elements with clear `:focus-visible` outlines and `>= 40px` touch targets on primary mobile/taskbar controls.
9. **Progressive Curvature Safety:** Keep SVG `#tube-curvature` safely gated behind `@supports (filter: url("#tube-curvature"))`.

---

## 9. Verification Checklist (Run Before Reporting Done)

Before concluding any implementation task, execute and report the actual output of:

1. `npm run check` (`astro check && tsc --noEmit`) — **0 errors**
2. `npm run build` — **0 build/SSR/hydration errors**
3. Subpath build check (when touching navigation, links, layouts, or asset paths):
   - `SITE_URL=https://example.github.io SITE_BASE=/astro-phosphor/ npm run build`
4. Browser & visual verification (`npm run test:browser`):
   - **Desktop Room (`1440×900`):** 6 symmetrical desktop icons, camera zoom transitions (`room` / `close` / `fullscreen`), click-to-close auto-zoom, power-off/wake flow.
   - **Cross-OS & Sub-Theme Switching:** switch across `rainbow`, `phosphor`, `coffee`, `cli`, and `pixel`, verify zero-duplication top/bottom chrome, per-OS theme persistence, Reading Mode, and dynamic cursors.
   - **Phone (`390×844`):** `12px` bezel, `3×2` icon grid, zero horizontal overflow.
   - **Static Purity:** zero `/api/` network requests across desktop, Work, Journal, Design System, and all 5 offline games.
