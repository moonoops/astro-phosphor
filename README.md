# Astro Phosphor

**English** | [简体中文](./README.zh-CN.md)

A lightweight, **100% static** 1990s beige CRT monitor & monochrome phosphor desktop personal site template built with **Astro 5**, **React 19**, and **Tailwind CSS v4**.

Zero backend, zero database, zero external icon packs — ships with a full single-hue design system, live specimen sheet, bilingual MDX journal with CJK typography rules, 5 offline retro arcade games, and an AI-ready `AGENTS.md` + `DESIGN.md` + custom room-artwork Agent Skill.

---

## Highlights

- **Photorealistic 1990s CRT Desk + 5 Time-of-Day Lighting Scenes**: Automatically adapts the Macintosh LC room photography to the visitor's local clock (`morning`, `noon`, `afternoon`, `dusk`, `night`) with smooth cross-fades and compact-bezel ambient fallback on smaller screens.
- **3 Camera States & Authentic CRT Optics**: Smooth CSS `@property` transitions between **Room**, **Close**, and bezel-free **Fullscreen** (`+`, `-`, `F` shortcuts), progressive curved glass mask with inverse pointer projection, scanlines, vignette, phosphor bloom, and hardware power-on/off collapse animations.
- **Single-Hue Derivation Design System**: Change one CSS token (`--lit`) to recolor text, rules, 3D tactile pixel keycaps, glows, Shiki code syntax, Canvas games, and SVG data-URI cursors simultaneously. Includes 4 presets (`amber`, `green`, `blue`, `white`) and one-click **Reading Mode** for calm long-form reading.
- **Astro Static Core + Persistent OS Chrome**: Built with `<ClientRouter />` and `transition:persist` so navigating between windows never replays the CRT warm-up blur or resets camera zoom.
- **Bilingual MDX Journal & CJK Typography**: Filterable by category, tag, and keyword; sticky scrollspy Table of Contents; monochrome Shiki code blocks; automatic `lang: zh-CN` CJK line-height (`1.75`) and heading scale tuning.
- **5 Pure-Frontend Offline Retro Games**: Minesweeper, Tetris, Snake, 2048, and 21-floor Magic Tower (`魔塔 21F`) — pure TypeScript, Canvas, synthesized 8-bit Web Audio cues, and `localStorage` records/saves.
- **AI-Native Customization Ready**: Includes [`AGENTS.md`](./AGENTS.md), [`docs/DESIGN.md`](./docs/DESIGN.md), and the reusable [`crt-room-artwork`](./.agents/skills/crt-room-artwork/SKILL.md) Agent Skill so any AI coding assistant can customize pages, windows, or desk artwork without breaking the retro aesthetic.

---

## Included Routes

| Route | Description |
| :--- | :--- |
| `/` | Retro desktop with 6 symmetrical shortcuts, `TypedText` intro, and hero wallpaper |
| `/work` & `/work/[slug]` | Featured portfolio grid + case study windows + true-color `GalleryLightbox` |
| `/journal` & `/journal/[slug]` | Static MDX blog with search/category/tag filters, TOC scrollspy & Reading Mode |
| `/about` | Profile, pixel avatar, desk specs, `SetupWizard`, principles, timeline & `FAQPanel` |
| `/contact` | Retro email composer (`mailto:` handoff or local `.txt` draft download) |
| `/design-system` | Live interactive token, typography, button, form, icon & widget specimen sheet |
| `/games` | Offline Arcade hub launching Minesweeper, Tetris, Snake, 2048, and Magic Tower |
| `/404` | Classic compact retro error dialog |

---

## Quick Start

Requires **Node.js `^20.19.0` or `>= 22.12.0`**.

```sh
npm install
npm run dev
```

Open `http://localhost:4321` in your browser.

### Useful Commands

```sh
npm run check         # Astro diagnostics + strict TypeScript check
npm run build         # Build 100% static site into dist/
npm run preview       # Preview the production dist/ build locally
npm run art:room      # Optimize custom 5-scene room plates into responsive WebP
npm run test:browser  # Run Playwright E2E checks (requires Chrome)
```

---

## Personalize Your Site

1. **Site Identity & Links**: Edit [`src/site.ts`](./src/site.ts) and [`src/data/page-copy.json`](./src/data/page-copy.json).
2. **Portfolio Projects**: Edit or replace the sample `.mdx` entries in [`src/content/projects/`](./src/content/projects/) and place screenshots in `public/media/work/`.
3. **Journal Essays**: Add `.mdx` posts in [`src/content/journal/`](./src/content/journal/). Set `lang: zh-CN` for Chinese articles or `draft: true` to hide unfinished drafts.
4. **Contact Email & Canonical URL**: Copy `.env.example` to `.env`:
   - Set `PUBLIC_CONTACT_EMAIL` to enable `mailto:` handoff from `/contact` (leave blank to let visitors download `.txt` drafts locally).
   - Set `SITE_URL` before `npm run build` to generate canonical and OpenGraph URLs.
5. **Preview Time-of-Day Scenes**: Append `?scene=morning`, `?scene=noon`, `?scene=afternoon`, `?scene=dusk`, or `?scene=night` to any URL.

---

## Custom CRT Room Backgrounds (Agent Skill)

Want to swap the Macintosh LC desk for your own favorite vintage computer (Sony Trinitron, IBM PS/2, ThinkPad, Amiga, etc.)?

This repository includes a dedicated **Agent Skill** at [`.agents/skills/crt-room-artwork/SKILL.md`](./.agents/skills/crt-room-artwork/SKILL.md) that teaches AI coding agents (Antigravity, Claude Code, Codex, Cursor, etc.) how to:

1. Generate straight-on 16:9 CRT desk plates with a clean dark 4:3 glass opening
2. Create pixel-aligned 5-scene lighting variants (`morning`, `noon`, `afternoon`, `dusk`, `night`)
3. Run `npm run art:room` to build lightweight responsive WebP pairs
4. Measure and calibrate `src/geometry/tube.ts`, `src/geometry/room-crop.js`, and `src/styles/room-scenes.css`

---

## Deploy Anywhere (Static Hosting)

Because `astro.config.mjs` outputs pure static files (`dist/`), you can deploy with zero server configuration:

- **Cloudflare Pages / Vercel / Netlify**: Connect the repository, set build command `npm run build` and output directory `dist`.
- **GitHub Pages**: Publish `dist/` via GitHub Actions with `SITE_URL` configured for your domain.

Make sure your host serves `dist/404.html` for missing routes so the retro error dialog appears automatically.

---

## Credits & License

- Visual aesthetic inspired by *Nostalgia Computer* — all code, pixel icons, optical masks, and Macintosh LC room plates in this repository are independently authored/generated.
- *Magic Tower (魔塔 21F)* gameplay inspired by `ckcz123/mota-js`, rebuilt from scratch in TypeScript and monochrome Canvas.
- Self-hosted fonts: *Jersey 10* and *Chivo Mono* via Fontsource.

Licensed under the [MIT License](./LICENSE).
