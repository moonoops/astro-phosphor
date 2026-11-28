import type { OsDefinition } from '../types';

export const pixelOs: OsDefinition = {
  id: 'pixel',
  name: 'Pixel',
  label: 'Pixel',
  tagline: 'Classic Macintosh 1-bit pixel chrome with 5-stripe rainbow accents.',
  defaultTheme: 'paper',
  themes: [
    { id: 'paper', label: 'Paper', swatch: '#ffffff' },
    { id: 'slate', label: 'Slate', swatch: '#24242a' },
    { id: 'mint', label: 'Mint', swatch: '#eef5e6' },
    { id: 'sky', label: 'Sky', swatch: '#e5eff8' },
  ],
  cursorStyle: 'pixel-retro',
  hasTopBar: true,
  hasBottomBar: false,
  hasDesktopWidget: true,
  flatOptics: false,
};
