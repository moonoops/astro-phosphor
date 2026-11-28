import { cliOs } from './cli/meta';
import { coffeeOs } from './coffee/meta';
import { phosphorOs, phosphorThemes } from './phosphor/meta';
import { pixelOs } from './pixel/meta';
import { rainbowOs } from './rainbow/meta';
import {
  osIds,
  type OsCursorStyle,
  type OsDefinition,
  type OsId,
  type OsThemePreset,
} from './types';

export {
  osIds,
  phosphorThemes,
  type OsCursorStyle,
  type OsDefinition,
  type OsId,
  type OsThemePreset,
};

export const DEFAULT_OS: OsId = 'rainbow';

export const osRegistry: Readonly<Record<OsId, OsDefinition>> = {
  phosphor: phosphorOs,
  coffee: coffeeOs,
  rainbow: rainbowOs,
  cli: cliOs,
  pixel: pixelOs,
};

export const osList: ReadonlyArray<OsDefinition> = osIds.map((id) => osRegistry[id]);

export function isOsId(value: unknown): value is OsId {
  return typeof value === 'string' && (osIds as readonly string[]).includes(value);
}

export function getOsDefinition(id: OsId | string | null | undefined): OsDefinition {
  return isOsId(id) ? osRegistry[id] : osRegistry[DEFAULT_OS];
}

export function resolveOsTheme(os: OsId | string | null | undefined, theme: string | null | undefined): string {
  const def = getOsDefinition(os);
  if (theme && def.themes.some((preset) => preset.id === theme)) {
    return theme;
  }
  return def.defaultTheme;
}

export function getOsThemeLabel(os: OsId, themeId: string): string {
  const def = getOsDefinition(os);
  return def.themes.find((preset) => preset.id === themeId)?.label
    ?? (themeId.charAt(0).toUpperCase() + themeId.slice(1));
}

export const osBootstrapConfig = Object.fromEntries(
  osList.map((def) => [
    def.id,
    {
      defaultTheme: def.defaultTheme,
      themes: def.themes.map((preset) => preset.id),
      flatOptics: Boolean(def.flatOptics),
    },
  ]),
) as Record<OsId, { defaultTheme: string; themes: string[]; flatOptics: boolean }>;
