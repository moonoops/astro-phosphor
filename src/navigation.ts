import type { PixelIconName } from './components/os/PixelIcon';
import copy from './data/page-copy.json';
import { SOCIAL_LINKS, withBase } from './site';

/**
 * Six symmetrical desktop shortcuts (2×3 on desktop, 3×2 centered on phone)
 * also mirrored in the Taskbar Quick Launch rail.
 */
export const applications = [
  { section: 'work', href: withBase('/work'), label: copy.work.title, icon: 'work' },
  { section: 'journal', href: withBase('/journal'), label: copy.journal.title, icon: 'journal' },
  { section: 'about', href: withBase('/about'), label: copy.about.windowTitle, icon: 'about' },
  { section: 'contact', href: withBase('/contact'), label: copy.contact.title, icon: 'contact' },
  { section: 'games', href: withBase('/games'), label: copy.games.title, icon: 'games' },
  { section: 'system', href: withBase('/design-system'), label: copy.system.shortTitle, icon: 'system' },
] as const satisfies ReadonlyArray<{ section: string; href: string; label: string; icon: PixelIconName }>;

export const desktopShortcuts = applications;

export type Section =
  | 'desktop'
  | 'error'
  | 'mota'
  | 'minesweeper'
  | 'tetris'
  | 'snake'
  | 'game2048'
  | (typeof applications)[number]['section'];

export type StartMenuLinkItem = {
  id: string;
  label: string;
  icon: PixelIconName;
  href: string;
  section?: Section;
  external?: boolean;
};

export type StartMenuFolder = {
  id: 'system' | 'documents' | 'games';
  label: string;
  icon: PixelIconName;
  items?: ReadonlyArray<StartMenuLinkItem>;
  emptyLabel?: string;
};

export const offlineGames = [
  {
    id: 'minesweeper',
    section: 'minesweeper' as const,
    href: withBase('/games/minesweeper'),
    title: copy.minesweeper.title,
    menuTitle: copy.minesweeper.menuTitle,
    summary: copy.minesweeper.cardSummary,
    icon: 'mine' as const,
  },
  {
    id: 'tetris',
    section: 'tetris' as const,
    href: withBase('/games/tetris'),
    title: copy.tetris.title,
    menuTitle: copy.tetris.menuTitle,
    summary: copy.tetris.cardSummary,
    icon: 'tetris' as const,
  },
  {
    id: 'snake',
    section: 'snake' as const,
    href: withBase('/games/snake'),
    title: copy.snake.title,
    menuTitle: copy.snake.menuTitle,
    summary: copy.snake.cardSummary,
    icon: 'snake' as const,
  },
  {
    id: 'game2048',
    section: 'game2048' as const,
    href: withBase('/games/2048'),
    title: copy.game2048.title,
    menuTitle: copy.game2048.menuTitle,
    summary: copy.game2048.cardSummary,
    icon: 'grid2048' as const,
  },
  {
    id: 'mota',
    section: 'mota' as const,
    href: withBase('/games/mota'),
    title: copy.mota.title,
    menuTitle: copy.mota.menuTitle,
    summary: copy.mota.cardSummary,
    icon: 'tower' as const,
  },
] as const;

export const startMenuFolders: ReadonlyArray<StartMenuFolder> = [
  {
    id: 'system',
    label: 'System',
    icon: 'system',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: 'work',
    items: [
      { id: 'work', section: 'work', href: withBase('/work'), label: copy.work.title, icon: 'work' },
      { id: 'journal', section: 'journal', href: withBase('/journal'), label: copy.journal.title, icon: 'journal' },
    ],
  },
  {
    id: 'games',
    label: 'Games',
    icon: 'games',
    items: [
      { id: 'all-games', section: 'games', href: withBase('/games'), label: copy.games.menuAll, icon: 'games' },
      ...offlineGames.map((game) => ({
        id: game.id,
        section: game.section,
        href: game.href,
        label: game.menuTitle,
        icon: game.icon,
      })),
    ],
  },
];

export const startMenuDirectLinks: ReadonlyArray<StartMenuLinkItem> = [
  { id: 'about', section: 'about', href: withBase('/about'), label: copy.about.windowTitle, icon: 'about' },
  { id: 'contact', section: 'contact', href: withBase('/contact'), label: copy.contact.title, icon: 'contact' },
];

export const startMenuExternalLinks: ReadonlyArray<StartMenuLinkItem> = [
  { id: 'github', href: SOCIAL_LINKS.github.href, label: SOCIAL_LINKS.github.label, icon: 'github', external: true },
];
