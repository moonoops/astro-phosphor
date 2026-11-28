import { atom, map } from 'nanostores';
import {
  DEFAULT_OS,
  getOsDefinition,
  isOsId,
  osIds,
  resolveOsTheme,
  type OsId,
} from '../os/registry';

export { osIds, type OsId };

export const themes = ['amber', 'green', 'blue', 'white'] as const;
export const phosphorThemes = themes;
export type PhosphorTheme = (typeof themes)[number];
export type Theme = string;

export const zoomModes = ['room', 'close', 'fullscreen'] as const;
export type Zoom = (typeof zoomModes)[number];
export type RoomZoom = 'room' | 'close';
const dayScenes = ['morning', 'noon', 'afternoon', 'dusk'] as const;
export const roomScenes = [...dayScenes, 'night'] as const;
export type RoomScene = (typeof roomScenes)[number];
export type DayScene = (typeof dayScenes)[number];

export type Preferences = {
  os: OsId;
  theme: Theme;
  osThemes: Partial<Record<OsId, string>>;
  scene: RoomScene;
  dayScene: DayScene;
  reading: boolean;
  zoom: Zoom;
  previousZoom: RoomZoom;
  soundMuted: boolean;
};

export const preferenceKey = 'astro-phosphor-preferences';
export const introKey = 'astro-phosphor-intro';
export const entryKey = 'astro-phosphor-entry';

export const POWER_OFF_MS = 1650;
export const POWER_ON_MS = 1900;
export const ENTRY_BOOT_MS = 1750;

const defaultOsDef = getOsDefinition(DEFAULT_OS);

const defaults: Preferences = {
  os: DEFAULT_OS,
  theme: defaultOsDef.defaultTheme,
  osThemes: { [DEFAULT_OS]: defaultOsDef.defaultTheme },
  scene: 'afternoon',
  dayScene: 'afternoon',
  reading: false,
  zoom: 'room',
  previousZoom: 'room',
  soundMuted: false,
};

export const $preferences = atom<Preferences>(defaults);
export const $powered = atom(true);
export const $entryBooting = atom(false);
export const $windowGeometry = map<Record<string, { x: number; y: number } | undefined>>({});
export const $maximizedWindows = map<Record<string, boolean | undefined>>({});

let initialized = false;
let powerTimer: ReturnType<typeof setTimeout>;
let entryTimer: ReturnType<typeof setTimeout>;

function readStoredOsThemes(): Partial<Record<OsId, string>> {
  try {
    const raw = localStorage.getItem(preferenceKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { osThemes?: Record<string, unknown> } | null;
    if (!parsed?.osThemes || typeof parsed.osThemes !== 'object') return {};
    const result: Partial<Record<OsId, string>> = {};
    for (const id of osIds) {
      const candidate = parsed.osThemes[id];
      if (typeof candidate === 'string') {
        result[id] = resolveOsTheme(id, candidate);
      }
    }
    return result;
  } catch {
    return {};
  }
}

function syncOsAttributes(next: Preferences) {
  if (typeof document === 'undefined') return;
  const def = getOsDefinition(next.os);
  const { dataset } = document.documentElement;
  dataset.os = next.os;
  dataset.theme = next.theme;
  dataset.reading = next.reading ? 'on' : 'off';
  dataset.zoom = next.zoom;
  dataset.prevZoom = next.previousZoom;
  dataset.soundMuted = String(next.soundMuted);
  if (def.flatOptics) {
    dataset.osFlatOptics = 'on';
  } else {
    delete dataset.osFlatOptics;
  }
}

function stripQueryParam(name: string) {
  if (typeof location === 'undefined' || typeof history === 'undefined') return;
  const url = new URL(location.href);
  if (url.searchParams.has(name)) {
    url.searchParams.delete(name);
    history.replaceState(history.state, '', url);
  }
}

function persistPreferences(next: Preferences) {
  try {
    localStorage.setItem(preferenceKey, JSON.stringify(next));
  } catch {
    // The current tab still retains preferences when storage is unavailable.
  }
}

export function finishEntryBoot() {
  clearTimeout(entryTimer);
  if (typeof document !== 'undefined') {
    delete document.documentElement.dataset.entry;
  }
  $entryBooting.set(false);
  try {
    sessionStorage.setItem(entryKey, 'played');
  } catch {
    // Keep the boot finished for the active page even if storage is blocked.
  }
}

export function initializeOs() {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;

  const { dataset } = document.documentElement;
  const os: OsId = isOsId(dataset.os) ? dataset.os : defaults.os;
  const theme = resolveOsTheme(os, dataset.theme);
  const storedOsThemes = readStoredOsThemes();
  const osThemes: Partial<Record<OsId, string>> = {
    ...storedOsThemes,
    [os]: theme,
  };
  const zoom = zoomModes.find(value => value === dataset.zoom) ?? defaults.zoom;
  const previousZoom: RoomZoom = dataset.prevZoom === 'close' ? 'close' : (zoom === 'close' ? 'close' : 'room');

  const initialPrefs: Preferences = {
    os,
    theme,
    osThemes,
    scene: roomScenes.find(scene => scene === dataset.scene) ?? defaults.scene,
    dayScene: dayScenes.find(scene => scene === dataset.dayScene) ?? defaults.dayScene,
    reading: dataset.reading === 'on',
    zoom,
    previousZoom,
    soundMuted: dataset.soundMuted === 'true',
  };
  $preferences.set(initialPrefs);
  syncOsAttributes(initialPrefs);

  const initialLinkedOs = new URLSearchParams(location.search).get('os');
  if (isOsId(initialLinkedOs)) {
    persistPreferences(initialPrefs);
    stripQueryParam('os');
  }

  if (dataset.entry === 'booting') {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishEntryBoot();
    } else {
      $entryBooting.set(true);
      try {
        sessionStorage.setItem(entryKey, 'played');
      } catch {
        // Ignore storage errors in private browsing.
      }
      const needsRoom = dataset.zoom !== 'fullscreen'
        && window.matchMedia('(min-width: 1000px) and (min-aspect-ratio: 6/5)').matches
        && dataset.roomReady !== 'on';
      const scheduleFinish = (elapsed: number) => {
        clearTimeout(entryTimer);
        const remaining = Math.max(0, ENTRY_BOOT_MS + 40 - elapsed);
        entryTimer = setTimeout(finishEntryBoot, remaining);
      };
      if (needsRoom) {
        delete dataset.entryStart;
        const startWhenReady = () => {
          window.removeEventListener('astro-phosphor:room-ready', startWhenReady);
          if (dataset.entry === 'booting') scheduleFinish(0);
        };
        window.addEventListener('astro-phosphor:room-ready', startWhenReady, { once: true });
        entryTimer = setTimeout(() => {
          window.removeEventListener('astro-phosphor:room-ready', startWhenReady);
          finishEntryBoot();
        }, ENTRY_BOOT_MS + 1300);
      } else {
        const startedAt = Number(dataset.entryStart ?? '0');
        const elapsed = Number.isFinite(startedAt) && startedAt > 0
          ? Math.max(0, performance.now() - startedAt)
          : 0;
        delete dataset.entryStart;
        scheduleFinish(elapsed);
      }
    }
  }

  document.addEventListener('astro:before-swap', () => {
    if ($entryBooting.get() || document.documentElement.dataset.entry) {
      finishEntryBoot();
    }
  });
  document.addEventListener('astro:after-swap', () => {
    const params = new URLSearchParams(location.search);
    const linkedScene = params.get('scene');
    const scene = roomScenes.find(candidate => candidate === linkedScene);
    if (scene && scene !== $preferences.get().scene) setPreference('scene', scene);

    const linkedOs = params.get('os');
    if (isOsId(linkedOs)) {
      if (linkedOs !== $preferences.get().os) {
        setOs(linkedOs);
      } else {
        stripQueryParam('os');
      }
    }
  });
}

export function setOs(targetOs: OsId) {
  initializeOs();
  const os = getOsDefinition(targetOs).id;
  const current = $preferences.get();
  const nextOsThemes: Partial<Record<OsId, string>> = {
    ...current.osThemes,
    [current.os]: current.theme,
  };
  const nextTheme = resolveOsTheme(os, nextOsThemes[os]);
  nextOsThemes[os] = nextTheme;

  const next: Preferences = {
    ...current,
    os,
    theme: nextTheme,
    osThemes: nextOsThemes,
  };
  $preferences.set(next);
  syncOsAttributes(next);
  stripQueryParam('os');
  persistPreferences(next);
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
  initializeOs();
  if (key === 'os') {
    setOs(value as OsId);
    return;
  }

  const current = $preferences.get();
  let next: Preferences = { ...current, [key]: value };

  if (key === 'theme') {
    const resolved = resolveOsTheme(current.os, value as string);
    next = {
      ...current,
      theme: resolved,
      osThemes: {
        ...current.osThemes,
        [current.os]: resolved,
      },
    };
  }

  if (key === 'zoom') {
    const target = value as Zoom;
    if (target === 'fullscreen') {
      if (current.zoom === 'fullscreen') return;
      next = {
        ...current,
        zoom: 'fullscreen',
        previousZoom: current.zoom,
      };
    } else {
      next = {
        ...current,
        zoom: target,
        previousZoom: target,
      };
    }
  }

  if (key === 'scene' && next.scene !== 'night') next.dayScene = next.scene;
  $preferences.set(next);
  syncOsAttributes(next);

  if (key === 'scene') {
    document.documentElement.dataset.scene = next.scene;
    document.documentElement.dataset.dayScene = next.dayScene;
    stripQueryParam('scene');
  }

  persistPreferences(next);
}

export function exitFullscreen() {
  initializeOs();
  const current = $preferences.get();
  if (current.zoom !== 'fullscreen') return;
  setPreference('zoom', current.previousZoom);
}

export function setPower(on: boolean) {
  if ($powered.get() === on) return;
  if ($entryBooting.get() || document.documentElement.dataset.entry) {
    finishEntryBoot();
  }
  const { dataset } = document.documentElement;
  clearTimeout(powerTimer);
  delete dataset.cooling;
  delete dataset.warming;
  dataset.power = on ? 'on' : 'off';
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const phase = on ? 'warming' : 'cooling';
    dataset[phase] = 'on';
    powerTimer = setTimeout(() => delete dataset[phase], on ? POWER_ON_MS : POWER_OFF_MS);
  }
  $powered.set(on);
}
