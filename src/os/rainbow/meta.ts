import type { OsDefinition } from '../types';

export const rainbowThemes = [
  { id: 'studio', label: 'Studio Pop', swatch: '#ff54dd' },
  { id: 'marigold', label: 'Marigold', swatch: '#ffcb2e' },
  { id: 'sky', label: 'Sky Draft', swatch: '#8cbcff' },
  { id: 'classic', label: 'Six-Color', swatch: '#61bb46' },
] as const;

export const rainbowOs: OsDefinition = {
  id: 'rainbow',
  name: 'Rainbow',
  label: 'Rainbow OS',
  tagline: 'Daylight CMY-Pop creative canvas OS with .fig tabs, crisp ink outlines, and warm graph paper.',
  defaultTheme: 'studio',
  themes: rainbowThemes,
  cursorStyle: 'soft-pointer',
  hasTopBar: true,
  hasBottomBar: false,
  hasDesktopWidget: true,
  flatOptics: false,
};
