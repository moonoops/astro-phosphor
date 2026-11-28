import type { OsDefinition } from '../types';

export const cliThemes = [
  { id: 'claude', label: 'Claude', swatch: '#d97757' },
  { id: 'light', label: 'Light', swatch: '#b04629' },
  { id: 'dark', label: 'Dark', swatch: '#ff7a59' },
  { id: 'matrix', label: 'Matrix', swatch: '#3dff6e' },
] as const;

export const cliOs: OsDefinition = {
  id: 'cli',
  name: 'CLI',
  label: 'CLI',
  tagline: 'Calm warm-charcoal terminal OS in IBM Plex Mono with terracotta prompts and flat 1px panes.',
  defaultTheme: 'claude',
  themes: cliThemes,
  cursorStyle: 'terminal-mono',
  hasTopBar: false,
  hasBottomBar: true,
  hasDesktopWidget: true,
  flatOptics: false,
};
