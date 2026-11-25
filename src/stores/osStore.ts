import { atom, map } from 'nanostores';

export const themes = ['amber', 'green', 'blue', 'white'] as const;
export type Theme = (typeof themes)[number];
export const zoomModes = ['room', 'close', 'fullscreen'] as const;
export type Zoom = (typeof zoomModes)[number];
export type RoomZoom = 'room' | 'close';
const dayScenes = ['morning', 'noon', 'afternoon', 'dusk'] as const;
export const roomScenes = [...dayScenes, 'night'] as const;
export type RoomScene = (typeof roomScenes)[number];
export type DayScene = (typeof dayScenes)[number];

type Preferences = {
  theme: Theme;
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

const defaults: Preferences = {
  theme: 'amber',
  scene: 'afternoon',
  dayScene: 'afternoon',
  reading: false,
  zoom: 'room',
  previousZoom: 'room',
  soundMuted: false,
};

export const $preferences = atom(defaults);
export const $powered = atom(true);
export const $entryBooting = atom(false);
export const $windowGeometry = map<Record<string, { x: number; y: number } | undefined>>({});
export const $maximizedWindows = map<Record<string, boolean | undefined>>({});

let initialized = false;
let powerTimer: ReturnType<typeof setTimeout>;
let entryTimer: ReturnType<typeof setTimeout>;

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
  const theme = themes.find(value => value === dataset.theme) ?? defaults.theme;
  const zoom = zoomModes.find(value => value === dataset.zoom) ?? defaults.zoom;
  const previousZoom: RoomZoom = dataset.prevZoom === 'close' ? 'close' : (zoom === 'close' ? 'close' : 'room');
  $preferences.set({
    theme,
    scene: roomScenes.find(scene => scene === dataset.scene) ?? defaults.scene,
    dayScene: dayScenes.find(scene => scene === dataset.dayScene) ?? defaults.dayScene,
    reading: dataset.reading === 'on',
    zoom,
    previousZoom,
    soundMuted: dataset.soundMuted === 'true',
  });

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
    const linked = new URLSearchParams(location.search).get('scene');
    const scene = roomScenes.find(candidate => candidate === linked);
    if (scene && scene !== $preferences.get().scene) setPreference('scene', scene);
  });
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
  initializeOs();
  const current = $preferences.get();
  let next: Preferences = { ...current, [key]: value };

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
  Object.assign(document.documentElement.dataset, {
    theme: next.theme,
    reading: next.reading ? 'on' : 'off',
    zoom: next.zoom,
    prevZoom: next.previousZoom,
    soundMuted: String(next.soundMuted),
  });
  if (key === 'scene') {
    document.documentElement.dataset.scene = next.scene;
    document.documentElement.dataset.dayScene = next.dayScene;
    const url = new URL(location.href);
    if (url.searchParams.has('scene')) {
      url.searchParams.delete('scene');
      history.replaceState(history.state, '', url);
    }
  }

  try {
    localStorage.setItem(preferenceKey, JSON.stringify(next));
  } catch {
    // The current tab still retains preferences when storage is unavailable.
  }
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
