export const osIds = ['phosphor', 'coffee', 'rainbow', 'cli', 'pixel'] as const;
export type OsId = (typeof osIds)[number];

export type OsCursorStyle =
  | 'phosphor-bevel'
  | 'classic-ink'
  | 'soft-pointer'
  | 'pixel-retro'
  | 'terminal-mono';

export interface OsThemePreset {
  readonly id: string;
  readonly label: string;
  readonly swatch: string;
}

export interface OsDefinition {
  readonly id: OsId;
  readonly name: string;
  readonly label: string;
  readonly tagline: string;
  readonly defaultTheme: string;
  readonly themes: ReadonlyArray<OsThemePreset>;
  readonly cursorStyle?: OsCursorStyle;
  readonly hasTopBar?: boolean;
  readonly hasBottomBar?: boolean;
  readonly hasDesktopWidget?: boolean;
  readonly flatOptics?: boolean;
}
