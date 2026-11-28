import type { OsDefinition } from '../types';

export const coffeeThemes = [
  { id: 'roast', label: 'Vintage Roast', swatch: '#bb7125' },
  { id: 'matcha', label: 'Matcha Study', swatch: '#5b6e3d' },
  { id: 'indigo', label: 'Indigo Press', swatch: '#3b6289' },
  { id: 'oat', label: 'Oat Paper', swatch: '#8a4f14' },
] as const;

export const coffeeOs: OsDefinition = {
  id: 'coffee',
  name: 'Coffee',
  label: 'Coffee OS',
  tagline: '1933 Japanese color dictionary × editorial paper-and-ink desktop with caramel stippled chrome.',
  defaultTheme: 'roast',
  themes: coffeeThemes,
  cursorStyle: 'classic-ink',
  hasTopBar: true,
  hasBottomBar: true,
  hasDesktopWidget: true,
  flatOptics: false,
};
