import type { OsDefinition } from '../types';

export const phosphorThemes = [
  { id: 'amber', label: 'Amber', swatch: '#ffb648' },
  { id: 'green', label: 'Green', swatch: '#4af626' },
  { id: 'blue', label: 'Blue', swatch: '#5cc8ff' },
  { id: 'white', label: 'White', swatch: '#e8ecf2' },
] as const;

export const phosphorOs: OsDefinition = {
  id: 'phosphor',
  name: 'Phosphor',
  label: 'Phosphor CRT',
  tagline: 'Monochrome amber/green/blue/white phosphor CRT OS with tactile 3D pixel keycaps.',
  defaultTheme: 'amber',
  themes: phosphorThemes,
  cursorStyle: 'phosphor-bevel',
  hasTopBar: false,
  hasBottomBar: true,
  hasDesktopWidget: false,
  flatOptics: false,
};
