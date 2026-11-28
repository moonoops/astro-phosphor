import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { DEFAULT_OS, isOsId, type OsId } from '../../os/registry';
import { $preferences, initializeOs } from '../../stores/osStore';
import {
  SPECIAL_META,
  formatCompactDamage,
  getDamageInfo,
  getDefDamageReduction,
  getEffectiveEnemyStats,
  getNextCritical,
} from '../../games/mota/combat';
import {
  DIFFICULTY_META,
  ITEMS,
  SHOPS,
  formatShopCostText,
  getMonsterDef,
  getShopOptionCost,
} from '../../games/mota/data';
import {
  advanceDialogue,
  buildSaveSummary,
  buyShopOption,
  closeActiveShop,
  createInitialState,
  deserializeSavePayload,
  findPathToTile,
  flyToFloor,
  getCurrentFloorMonsters,
  getEffectiveTile,
  getFloorDef,
  openQuickShop,
  resolveDialogueChoice,
  serializeSavePayload,
  stepMove,
  type SoundCue,
} from '../../games/mota/engine';
import { FLOORS, MAP_SIZE } from '../../games/mota/floors';
import { playMotaSfx } from '../../games/mota/sfx';
import {
  SEMANTIC_COLORS,
  drawSprite,
  getItemTagAccent,
  readPhosphorPalette,
  spriteToRects,
  type PhosphorPalette,
} from '../../games/mota/sprites';
import type {
  ColorMode,
  Difficulty,
  Direction,
  GameState,
  NpcId,
  SaveSlotId,
  ShopId,
  StoredSaveRecord,
  TileKind,
} from '../../games/mota/types';
import PixelIcon from '../os/PixelIcon';
import ButtonBase from '../ui/ButtonBase';

const LOCAL_SAVES_KEY = 'astro-phosphor:mota:saves:v1';
const SFX_PREF_KEY = 'astro-phosphor:mota:sfx:v1';
const TAGS_PREF_KEY = 'astro-phosphor:mota:tags:v1';
const COLOR_MODE_OS_PREF_KEY = 'astro-phosphor:mota:color-mode:v2';

function defaultMotaColorMode(activeOs: OsId): ColorMode {
  return activeOs === 'phosphor' ? 'hybrid' : 'color';
}

function readStoredMotaColorMode(activeOs: OsId): ColorMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COLOR_MODE_OS_PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    const saved = parsed?.[activeOs];
    return saved === 'color' || saved === 'hybrid' ? saved : null;
  } catch {
    return null;
  }
}

function writeStoredMotaColorMode(activeOs: OsId, mode: ColorMode): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(COLOR_MODE_OS_PREF_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const next = parsed && typeof parsed === 'object' ? { ...parsed, [activeOs]: mode } : { [activeOs]: mode };
    localStorage.setItem(COLOR_MODE_OS_PREF_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors.
  }
}

const TILE_PX = 64;
const CANVAS_PX = MAP_SIZE * TILE_PX;
const MAX_UNDO = 40;
const SPECIAL_SHORT_TAG: Readonly<Record<string, string>> = {
  firstStrike: '先',
  magic: '魔',
  solid: '固',
  doubleHit: '2连',
  tripleHit: '3连',
  vampire: '吸',
  armorBreak: '破',
  berserk: '狂',
  thorns: '反',
};
const SAVE_SLOTS: ReadonlyArray<{ id: SaveSlotId; label: string }> = [
  { id: 'auto', label: '自动存档' },
  { id: 'slot-1', label: '存档位 1' },
  { id: 'slot-2', label: '存档位 2' },
  { id: 'slot-3', label: '存档位 3' },
];

type OverlayMode = 'none' | 'title' | 'book' | 'fly' | 'quickShop' | 'saves' | 'help' | 'victory';

const NPC_SPRITE: Readonly<Record<NpcId, { sprite: string; name: string; hint: string }>> = {
  fairy0f: { sprite: 'npc_fairy', name: '守塔仙子', hint: '开启塔门 / 交付十字架' },
  sage1f: { sprite: 'npc_sage', name: '引路老人', hint: '基础操作、商店涨价与图鉴提示' },
  blacksmith2f: { sprite: 'npc_sage', name: '铁匠大师', hint: '获救后赠予攻击 +15' },
  armorer2f: { sprite: 'npc_merchant', name: '护甲匠', hint: '获救后赠予防御 +15' },
  thief4f: { sprite: 'npc_thief', name: '盗贼杰克', hint: '解锁 2F 囚室与 18F 密门' },
  guide7f: { sprite: 'npc_sage', name: '守望学者', hint: '四段式攻略与十字架提交时机' },
  guide10f: { sprite: 'npc_sage', name: '老兵向导', hint: '特殊怪物与破墙镐提示' },
  sage15fAtk: { sprite: 'npc_sage', name: '剑道宗师', hint: '500 经验 → 攻击 +90' },
  sage15fDef: { sprite: 'npc_merchant', name: '铁壁商神', hint: '500 金币 → 防御 +90' },
  decoy18f: { sprite: 'npc_princess', name: '镜像幻影', hint: '解开 18F 东南楼梯封印' },
  warning20f: { sprite: 'npc_sage', name: '塔顶信使', hint: '决战前最终准备提醒' },
  princess21f: { sprite: 'npc_princess', name: '塔顶守望者', hint: '击败暗影大魔王后即可解救' },
};

function readLocalSaves(): Partial<Record<SaveSlotId, StoredSaveRecord>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_SAVES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Partial<Record<SaveSlotId, StoredSaveRecord>>;
  } catch {
    return {};
  }
}

function writeLocalSaves(map: Partial<Record<SaveSlotId, StoredSaveRecord>>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_SAVES_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota or private-mode errors.
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const da = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${mo}-${da} ${hh}:${mm}`;
}

function computeRank(hp: number, difficulty: Difficulty): { grade: string; note: string } {
  if (difficulty === 'hard') {
    if (hp >= 6000) return { grade: 'S', note: '红海传说 · 极限算步征服困难魔塔' };
    if (hp >= 2500) return { grade: 'A', note: '硬核拆塔宗师 · 完美控血登顶' };
    if (hp >= 800) return { grade: 'B', note: '钢铁勇者 · 突围红海终克魔王' };
    return { grade: 'C', note: '刀尖起舞 · 丝血绝杀暗影大魔王' };
  }
  if (hp >= 24000) return { grade: 'S', note: '传奇魔塔大师 · 完美临界与控血' };
  if (hp >= 14000) return { grade: 'A', note: '资深勇者 · 商店与钥匙规划精妙' };
  if (hp >= 6000) return { grade: 'B', note: '稳健登顶 · 成功驱散塔顶阴霾' };
  return { grade: 'C', note: '险中求胜 · 终克暗影大魔王' };
}

function getDamageTier(damage: number | null, heroHp: number): 'safe' | 'normal' | 'high' | 'lethal' {
  if (damage === null || damage >= heroHp) return 'lethal';
  if (damage === 0) return 'safe';
  if (damage >= heroHp * 0.4) return 'high';
  return 'normal';
}

function PixelPortrait({
  sprite,
  size = 32,
  colorMode = 'hybrid',
}: {
  sprite: string;
  size?: number;
  colorMode?: ColorMode;
}) {
  const rects = useMemo(() => spriteToRects(sprite, colorMode), [sprite, colorMode]);
  return (
    <svg
      className="mota-portrait-svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects.map((r, idx) => (
        <rect key={idx} x={r.x} y={r.y} width={1} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}

export default function MagicTowerGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const walkQueueRef = useRef<Direction[]>([]);
  const walkTimerRef = useRef<number | null>(null);
  const stateRef = useRef<GameState>(createInitialState('standard'));
  const paletteRef = useRef<PhosphorPalette | null>(null);
  const animFrameRef = useRef<number>(0);

  const { os, theme } = useStore($preferences, { ssr: 'initial' });
  const [activeOs, setActiveOs] = useState<OsId>(DEFAULT_OS);
  const manualColorByOsRef = useRef<Partial<Record<OsId, ColorMode>>>({});

  const [game, setGame] = useState<GameState>(() => createInitialState('standard'));
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('standard');
  const [colorMode, setColorMode] = useState<ColorMode>(() => defaultMotaColorMode(DEFAULT_OS));
  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [overlay, setOverlay] = useState<OverlayMode>('title');
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [showMapTags, setShowMapTags] = useState<boolean>(true);
  const [showDpad, setShowDpad] = useState<boolean>(false);
  const [animTick, setAnimTick] = useState<number>(0);
  const [saves, setSaves] = useState<Partial<Record<SaveSlotId, StoredSaveRecord>>>({});
  const [saveNotice, setSaveNotice] = useState<string>('');

  useEffect(() => {
    stateRef.current = game;
  }, [game]);

  const floorDef = getFloorDef(game.floor);
  const floorMonsters = useMemo(() => getCurrentFloorMonsters(game), [game]);

  const updateWindowStatus = useCallback((text: string) => {
    const status = hostRef.current?.closest('[data-window-id]')?.querySelector<HTMLElement>('[data-window-status]');
    if (status && status.textContent !== text) status.textContent = text;
  }, []);

  useEffect(() => {
    const diffTag = DIFFICULTY_META[game.difficulty].shortLabel;
    updateWindowStatus(`${floorDef.name} · ${diffTag} · HP ${game.hero.hp} · 本地存档`);
  }, [floorDef.name, game.difficulty, game.hero.hp, updateWindowStatus]);

  useEffect(() => {
    try {
      const savedSfx = localStorage.getItem(SFX_PREF_KEY);
      if (savedSfx === 'off') setSfxEnabled(false);
      const savedTags = localStorage.getItem(TAGS_PREF_KEY);
      if (savedTags === 'off') setShowMapTags(false);
    } catch {
      // Ignore storage errors.
    }
    setSaves(readLocalSaves());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setAnimTick((t) => (t + 1) % 60);
    }, 450);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    initializeOs();
    const syncPaletteAndOs = () => {
      const domOs = document.documentElement.dataset.os;
      const resolvedOs: OsId = isOsId(domOs) ? domOs : $preferences.get().os;
      setActiveOs(resolvedOs);
      const override = manualColorByOsRef.current[resolvedOs] ?? readStoredMotaColorMode(resolvedOs);
      setColorMode(override ?? defaultMotaColorMode(resolvedOs));
      paletteRef.current = readPhosphorPalette(hostRef.current);
      setAnimTick((t) => t + 1);
    };
    syncPaletteAndOs();
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(syncPaletteAndOs);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-os', 'data-theme', 'data-reading'],
    });
    return () => observer.disconnect();
  }, [os, theme]);

  const stopWalk = useCallback(() => {
    walkQueueRef.current = [];
    if (walkTimerRef.current !== null) {
      window.clearTimeout(walkTimerRef.current);
      walkTimerRef.current = null;
    }
  }, []);

  useEffect(() => stopWalk, [stopWalk]);

  const persistSaveSlot = useCallback((slot: SaveSlotId, snapshot: GameState, silent = false) => {
    const payload = serializeSavePayload(snapshot);
    const summary = buildSaveSummary(snapshot);
    const updatedAt = new Date().toISOString();
    const localRecord: StoredSaveRecord = {
      slot,
      summary,
      payload,
      updatedAt,
      source: 'local',
    };

    setSaves((prev) => {
      const next = { ...prev, [slot]: localRecord };
      writeLocalSaves(next);
      return next;
    });

    if (!silent) {
      const label = SAVE_SLOTS.find((s) => s.id === slot)?.label ?? slot;
      setSaveNotice(`已保存至 ${label}（本地浏览器）`);
    }
  }, []);

  const commitOutcome = useCallback(
    (prev: GameState, next: GameState, checkpoint: boolean, sound?: SoundCue) => {
      if (sound) playMotaSfx(sound, sfxEnabled);
      if (checkpoint) {
        setUndoStack((stack) => {
          const updated = [...stack, prev];
          return updated.length > MAX_UNDO ? updated.slice(updated.length - MAX_UNDO) : updated;
        });
      }
      setGame(next);
      if (next.flags.victory && !prev.flags.victory) {
        setOverlay('victory');
        persistSaveSlot('auto', next, true);
      } else if (checkpoint) {
        persistSaveSlot('auto', next, true);
      }
    },
    [sfxEnabled, persistSaveSlot],
  );

  const executeStep = useCallback(
    (dir: Direction): boolean => {
      const current = stateRef.current;
      const outcome = stepMove(current, dir);
      if (!outcome.changed) {
        if (outcome.sound) playMotaSfx(outcome.sound, sfxEnabled);
        return false;
      }
      commitOutcome(current, outcome.state, outcome.checkpoint, outcome.sound);
      if (outcome.state.dialogue || outcome.state.activeShop || outcome.state.floor !== current.floor) {
        return false;
      }
      return true;
    },
    [commitOutcome, sfxEnabled],
  );

  const runWalkQueue = useCallback(() => {
    if (walkQueueRef.current.length === 0) {
      walkTimerRef.current = null;
      return;
    }
    const nextDir = walkQueueRef.current.shift()!;
    const ok = executeStep(nextDir);
    if (!ok || walkQueueRef.current.length === 0) {
      stopWalk();
      return;
    }
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    walkTimerRef.current = window.setTimeout(runWalkQueue, reducedMotion ? 0 : 62);
  }, [executeStep, stopWalk]);

  const handleManualMove = useCallback(
    (dir: Direction) => {
      if (overlay !== 'none') return;
      stopWalk();
      executeStep(dir);
    },
    [overlay, stopWalk, executeStep],
  );

  const handleUndo = useCallback(() => {
    stopWalk();
    setUndoStack((stack) => {
      if (stack.length === 0) {
        playMotaSfx('error', sfxEnabled);
        return stack;
      }
      const previous = stack[stack.length - 1];
      setGame({ ...previous, dialogue: null, activeShop: null });
      setOverlay('none');
      playMotaSfx('talk', sfxEnabled);
      return stack.slice(0, -1);
    });
  }, [stopWalk, sfxEnabled]);

  const handleLoadSlot = useCallback(
    (slot: SaveSlotId) => {
      const rec = saves[slot];
      if (!rec) return;
      const restored = deserializeSavePayload(rec.payload);
      if (!restored) {
        setSaveNotice('存档格式无效，无法读取。');
        playMotaSfx('error', sfxEnabled);
        return;
      }
      stopWalk();
      setUndoStack([]);
      setSelectedDifficulty(restored.difficulty);
      setGame(restored);
      setOverlay('none');
      setSaveNotice(`已读取 ${SAVE_SLOTS.find((s) => s.id === slot)?.label ?? slot} (${DIFFICULTY_META[restored.difficulty].shortLabel})`);
      playMotaSfx('stairs', sfxEnabled);
    },
    [saves, stopWalk, sfxEnabled],
  );

  const handleDeleteSlot = useCallback((slot: SaveSlotId) => {
    setSaves((prev) => {
      const next = { ...prev };
      delete next[slot];
      writeLocalSaves(next);
      return next;
    });
    setSaveNotice(`已清除 ${SAVE_SLOTS.find((s) => s.id === slot)?.label ?? slot}`);
  }, []);

  const handleNewGame = useCallback(
    (diffOverride?: Difficulty) => {
      stopWalk();
      const targetDiff = diffOverride ?? selectedDifficulty;
      const fresh = createInitialState(targetDiff);
      setUndoStack([]);
      setSaveNotice('');
      setGame(fresh);
      setOverlay('none');
      playMotaSfx('stairs', sfxEnabled);
    },
    [stopWalk, sfxEnabled, selectedDifficulty],
  );

  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SFX_PREF_KEY, next ? 'on' : 'off');
      } catch {
        // Ignore storage errors.
      }
      if (next) playMotaSfx('talk', true);
      return next;
    });
  }, []);

  const toggleMapTags = useCallback(() => {
    setShowMapTags((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(TAGS_PREF_KEY, next ? 'on' : 'off');
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  }, []);

  const toggleColorMode = useCallback(() => {
    const domOs = typeof document !== 'undefined' ? document.documentElement.dataset.os : undefined;
    const resolvedOs: OsId = isOsId(domOs) ? domOs : $preferences.get().os;
    setColorMode((prev) => {
      const next: ColorMode = prev === 'hybrid' ? 'color' : 'hybrid';
      manualColorByOsRef.current[resolvedOs] = next;
      writeStoredMotaColorMode(resolvedOs, next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (document.querySelector('#start-menu-panel:not([hidden]), #topbar-start-menu-panel:not([hidden])')) return;

      const current = stateRef.current;

      if (event.key === 'Escape') {
        if (current.dialogue) {
          event.preventDefault();
          event.stopPropagation();
          setGame((g) => ({ ...g, dialogue: null }));
          return;
        }
        if (current.activeShop) {
          event.preventDefault();
          event.stopPropagation();
          setGame((g) => closeActiveShop(g));
          return;
        }
        if (overlay !== 'none' && overlay !== 'title') {
          event.preventDefault();
          event.stopPropagation();
          setOverlay('none');
          return;
        }
        return;
      }

      if (overlay === 'title') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (saves.auto) handleLoadSlot('auto');
          else handleNewGame();
        }
        return;
      }

      if (current.dialogue) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const out = advanceDialogue(current);
          if (out.changed) {
            if (out.sound) playMotaSfx(out.sound, sfxEnabled);
            setGame(out.state);
          }
        }
        return;
      }

      if (current.activeShop) {
        return;
      }

      const lower = event.key.toLowerCase();
      if (lower === 'b') {
        event.preventDefault();
        if (overlay === 'book') setOverlay('none');
        else if (current.relics.book) setOverlay('book');
        else {
          playMotaSfx('error', sfxEnabled);
          setGame((g) => ({ ...g, log: [...g.log.slice(-29), '尚未拾取 1F 的【怪物手册】。'] }));
        }
        return;
      }
      if (lower === 'f') {
        event.preventDefault();
        if (overlay === 'fly') setOverlay('none');
        else if (current.relics.fly) setOverlay('fly');
        else {
          playMotaSfx('error', sfxEnabled);
          setGame((g) => ({ ...g, log: [...g.log.slice(-29), '尚未获得 7F 的【楼层传送器】。'] }));
        }
        return;
      }
      if (lower === 'v') {
        event.preventDefault();
        if (overlay === 'quickShop') setOverlay('none');
        else if (current.flags.discoveredShops.length > 0) setOverlay('quickShop');
        else {
          playMotaSfx('error', sfxEnabled);
          setGame((g) => ({ ...g, log: [...g.log.slice(-29), '尚未发现任何商店（3F 设有贪婪祭坛）。'] }));
        }
        return;
      }
      if (lower === 'g') {
        event.preventDefault();
        setOverlay((o) => (o === 'saves' ? 'none' : 'saves'));
        return;
      }
      if (lower === 'h' || event.key === '?') {
        event.preventDefault();
        setOverlay((o) => (o === 'help' ? 'none' : 'help'));
        return;
      }
      if (lower === 'z') {
        event.preventDefault();
        handleUndo();
        return;
      }
      if (lower === 't') {
        event.preventDefault();
        toggleMapTags();
        return;
      }
      if (lower === 'c') {
        event.preventDefault();
        toggleColorMode();
        return;
      }

      if (overlay !== 'none') return;

      const dirMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = dirMap[event.key] ?? dirMap[lower];
      if (dir) {
        event.preventDefault();
        handleManualMove(dir);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [overlay, saves.auto, sfxEnabled, handleLoadSlot, handleNewGame, handleUndo, handleManualMove, toggleMapTags, toggleColorMode]);

  const previewPath = useMemo(() => {
    if (!hoverTile || overlay !== 'none' || game.dialogue || game.activeShop) return null;
    return findPathToTile(game, hoverTile.x, hoverTile.y);
  }, [game, hoverTile, overlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = paletteRef.current ?? readPhosphorPalette(hostRef.current);
    paletteRef.current = palette;

    const tileGround = colorMode === 'color' ? '#0b111b' : palette.stageBg;
    const badgeGround = colorMode === 'color' ? '#090e17' : palette.badgeBg;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = tileGround;
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

    const frameParity = animTick % 2;

    for (let y = 0; y < MAP_SIZE; y += 1) {
      for (let x = 0; x < MAP_SIZE; x += 1) {
        const px = x * TILE_PX;
        const py = y * TILE_PX;

        ctx.fillStyle = tileGround;
        ctx.fillRect(px, py, TILE_PX, TILE_PX);
        drawSprite(ctx, 'floor', px, py, TILE_PX, palette, 0, colorMode);

        const tile: TileKind = getEffectiveTile(game, x, y);
        if (tile.type === 'wall') {
          drawSprite(ctx, 'wall', px, py, TILE_PX, palette, 0, colorMode);
        } else if (tile.type === 'lava') {
          drawSprite(ctx, frameParity === 0 ? 'lava_0' : 'lava_1', px, py, TILE_PX, palette, 0, colorMode);
        } else if (tile.type === 'stairsUp') {
          drawSprite(ctx, 'stairs_up', px, py, TILE_PX, palette, 0, colorMode);
        } else if (tile.type === 'stairsDown') {
          drawSprite(ctx, 'stairs_down', px, py, TILE_PX, palette, 0, colorMode);
        } else if (tile.type === 'door') {
          const spriteName =
            tile.door === 'yellow'
              ? 'door_yellow'
              : tile.door === 'blue'
                ? 'door_blue'
                : tile.door === 'red'
                  ? 'door_red'
                  : tile.door === 'crackedWall'
                    ? 'cracked_wall'
                    : 'door_special';
          drawSprite(ctx, spriteName, px, py, TILE_PX, palette, 0, colorMode);
        } else if (tile.type === 'item') {
          const item = ITEMS[tile.itemId];
          const accent = getItemTagAccent(tile.itemId);
          ctx.fillStyle = accent.bar;
          ctx.fillRect(px + 3, py + 3, 3, 3);
          ctx.fillRect(px + TILE_PX - 6, py + 3, 3, 3);

          drawSprite(ctx, item.sprite, px, py + 1, TILE_PX, palette, 0, colorMode);

          if (showMapTags && item.mapTag) {
            const isKey = item.kind === 'key' && item.mapTag.length === 1;
            const tagText = isKey ? `[${item.mapTag}]` : item.mapTag;
            ctx.font = 'bold 15px "Chivo Mono", "PingFang SC", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const tagW = Math.min(TILE_PX - 4, Math.max(28, Math.ceil(ctx.measureText(tagText).width) + 8));
            const tagH = 19;
            const tx = Math.round(px + (TILE_PX - tagW) / 2);
            const ty = py + TILE_PX - tagH;
            ctx.fillStyle = badgeGround;
            ctx.fillRect(tx, ty, tagW, tagH);
            ctx.fillStyle = accent.bar;
            ctx.fillRect(tx, ty + tagH - 2, tagW, 2);
            ctx.fillStyle = accent.text;
            ctx.fillText(tagText, px + TILE_PX / 2, ty + tagH / 2 - 0.5);
          }
        } else if (tile.type === 'npc') {
          const npc = NPC_SPRITE[tile.npcId];
          drawSprite(ctx, npc.sprite, px, py, TILE_PX, palette, frameParity === 1 ? -2 : 0, colorMode);
          if (showMapTags) {
            const bx = px + TILE_PX - 19;
            const by = py + 2;
            ctx.fillStyle = badgeGround;
            ctx.fillRect(bx - 1, by - 1, 19, 19);
            ctx.fillStyle = colorMode === 'color' ? '#6cf5d0' : palette.entityHi;
            ctx.fillRect(bx, by, 17, 17);
            ctx.font = 'bold 14px "Chivo Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = badgeGround;
            ctx.fillText('!', bx + 8.5, by + 9.5);
          }
        } else if (tile.type === 'shop') {
          const shop = SHOPS[tile.shopId];
          drawSprite(ctx, shop.sprite, px, py, TILE_PX, palette, 0, colorMode);
          if (showMapTags) {
            const bx = px + TILE_PX - 19;
            const by = py + 2;
            ctx.fillStyle = badgeGround;
            ctx.fillRect(bx - 1, by - 1, 19, 19);
            ctx.fillStyle = SEMANTIC_COLORS.gold;
            ctx.fillRect(bx, by, 17, 17);
            ctx.font = 'bold 14px "Chivo Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = badgeGround;
            ctx.fillText('$', bx + 8.5, by + 9.5);
          }
        } else if (tile.type === 'monster') {
          const monster = getMonsterDef(tile.monsterId, game.difficulty);
          if (monster) {
            drawSprite(ctx, monster.sprite, px, py + 1, TILE_PX, palette, frameParity === 1 ? -2 : 0, colorMode);

            if (showMapTags && monster.special && monster.special.length > 0) {
              const shown = monster.special.slice(0, 2);
              shown.forEach((sp, idx) => {
                const glyph = SPECIAL_SHORT_TAG[sp];
                if (!glyph) return;
                const spColor = SEMANTIC_COLORS.specialTag[sp];
                const chipW = glyph.length > 1 ? 24 : 19;
                const sx = idx === 0 ? px + 2 : px + TILE_PX - chipW - 2;
                const sy = py + 2;
                ctx.fillStyle = badgeGround;
                ctx.fillRect(sx, sy, chipW, 19);
                ctx.strokeStyle = spColor;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(sx + 0.75, sy + 0.75, chipW - 1.5, 17.5);
                ctx.font = glyph.length > 1 ? 'bold 11px "Chivo Mono", "PingFang SC", monospace' : 'bold 13px "Chivo Mono", "PingFang SC", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = spColor;
                ctx.fillText(glyph, sx + chipW / 2, sy + 10);
              });
            }

            if (game.relics.book) {
              const dmgInfo = getDamageInfo(monster, game.hero);
              const damage = dmgInfo ? dmgInfo.damage : null;
              const tier = getDamageTier(damage, game.hero.hp);
              const label = formatCompactDamage(damage);

              ctx.font = 'bold 16px "Chivo Mono", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              const badgeW = Math.min(TILE_PX - 4, Math.max(32, Math.ceil(ctx.measureText(label).width) + 10));
              const badgeH = 20;
              const bx = Math.round(px + (TILE_PX - badgeW) / 2);
              const by = py + TILE_PX - badgeH - 1;

              if (tier === 'lethal') {
                ctx.fillStyle = SEMANTIC_COLORS.lethalDmg;
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.fillStyle = '#090e17';
                ctx.fillText(label, px + TILE_PX / 2, by + badgeH / 2 + 0.5);
              } else {
                const tone =
                  tier === 'safe'
                    ? SEMANTIC_COLORS.safeDmg
                    : tier === 'high'
                      ? SEMANTIC_COLORS.highDmg
                      : SEMANTIC_COLORS.warnDmg;
                ctx.fillStyle = badgeGround;
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.strokeStyle = tone;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx + 0.75, by + 0.75, badgeW - 1.5, badgeH - 1.5);
                ctx.fillStyle = tone;
                ctx.fillText(tier === 'safe' ? '0' : label, px + TILE_PX / 2, by + badgeH / 2 + 0.5);
              }
            }
          }
        }
      }
    }

    if (previewPath && previewPath.length > 0) {
      let cx = game.x;
      let cy = game.y;
      ctx.fillStyle = colorMode === 'color' ? '#6bc4ff' : palette.pathDot;
      for (let i = 0; i < previewPath.length; i += 1) {
        const d = previewPath[i];
        if (d === 'up') cy -= 1;
        else if (d === 'down') cy += 1;
        else if (d === 'left') cx -= 1;
        else if (d === 'right') cx += 1;
        if (i < previewPath.length - 1) {
          ctx.fillRect(cx * TILE_PX + TILE_PX / 2 - 3, cy * TILE_PX + TILE_PX / 2 - 3, 6, 6);
        }
      }
    }

    const hx = game.x * TILE_PX;
    const hy = game.y * TILE_PX;
    drawSprite(ctx, `hero_${game.dir}`, hx, hy + 2, TILE_PX, palette, 0, colorMode);
    ctx.fillStyle = colorMode === 'color' ? '#f2f8ff' : palette.reticle;
    ctx.fillRect(hx + 2, hy + 2, 8, 2);
    ctx.fillRect(hx + 2, hy + 2, 2, 8);
    ctx.fillRect(hx + TILE_PX - 10, hy + 2, 8, 2);
    ctx.fillRect(hx + TILE_PX - 4, hy + 2, 2, 8);
    ctx.fillRect(hx + 2, hy + TILE_PX - 4, 8, 2);
    ctx.fillRect(hx + 2, hy + TILE_PX - 10, 2, 8);
    ctx.fillRect(hx + TILE_PX - 10, hy + TILE_PX - 4, 8, 2);
    ctx.fillRect(hx + TILE_PX - 4, hy + TILE_PX - 10, 2, 8);

    if (game.lastCombat && Date.now() - game.lastCombat.tick < 240) {
      const sx = game.lastCombat.x * TILE_PX;
      const sy = game.lastCombat.y * TILE_PX;
      ctx.strokeStyle = colorMode === 'color' ? '#ffe066' : palette.reticle;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + 10);
      ctx.lineTo(sx + TILE_PX - 10, sy + TILE_PX - 10);
      ctx.moveTo(sx + TILE_PX - 10, sy + 10);
      ctx.lineTo(sx + 10, sy + TILE_PX - 10);
      ctx.stroke();
    }

    if (hoverTile && overlay === 'none') {
      ctx.strokeStyle = colorMode === 'color' ? '#6bc4ff' : palette.reticle;
      ctx.lineWidth = 3;
      ctx.strokeRect(hoverTile.x * TILE_PX + 1.5, hoverTile.y * TILE_PX + 1.5, TILE_PX - 3, TILE_PX - 3);
    }

    animFrameRef.current += 1;
  }, [game, animTick, hoverTile, previewPath, overlay, showMapTags, colorMode]);

  function tileFromPointer(event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const rx = Math.floor(((event.clientX - rect.left) / rect.width) * MAP_SIZE);
    const ry = Math.floor(((event.clientY - rect.top) / rect.height) * MAP_SIZE);
    if (rx < 0 || ry < 0 || rx >= MAP_SIZE || ry >= MAP_SIZE) return null;
    return { x: rx, y: ry };
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    if (overlay !== 'none' || game.dialogue || game.activeShop) return;
    const pt = tileFromPointer(event);
    if (!pt) return;
    stopWalk();
    const path = findPathToTile(game, pt.x, pt.y);
    if (!path || path.length === 0) {
      playMotaSfx('error', sfxEnabled);
      return;
    }
    walkQueueRef.current = path;
    runWalkQueue();
  }

  const inspected = useMemo(() => {
    if (!hoverTile) return null;
    const tile = getEffectiveTile(game, hoverTile.x, hoverTile.y);
    if (tile.type === 'monster') {
      const monster = getMonsterDef(tile.monsterId, game.difficulty);
      if (!monster) return null;
      const effective = getEffectiveEnemyStats(monster, game.hero);
      const dmg = getDamageInfo(monster, game.hero);
      const crit = getNextCritical(monster, game.hero);
      const defRed = getDefDamageReduction(monster, game.hero, 1);
      return { kind: 'monster' as const, monster, effective, dmg, crit, defRed };
    }
    if (tile.type === 'item') {
      return { kind: 'item' as const, item: ITEMS[tile.itemId] };
    }
    if (tile.type === 'npc') {
      return { kind: 'npc' as const, npc: NPC_SPRITE[tile.npcId] };
    }
    if (tile.type === 'shop') {
      return { kind: 'shop' as const, shop: SHOPS[tile.shopId] };
    }
    if (tile.type === 'door') {
      const labels: Record<typeof tile.door, { name: string; desc: string; sprite: string }> = {
        yellow: { name: '黄门 [Y]', desc: '消耗 1 把黄钥匙 [Y] 开启', sprite: 'door_yellow' },
        blue: { name: '蓝门 [B]', desc: '消耗 1 把蓝钥匙 [B] 开启', sprite: 'door_blue' },
        red: { name: '红门 [R]', desc: '消耗 1 把红钥匙 [R] 开启', sprite: 'door_red' },
        special: { name: '机关门', desc: '需要完成特定剧情或击败镇守开启', sprite: 'door_special' },
        crackedWall: { name: '裂纹暗墙', desc: '持有【破墙镐】时撞击即可击碎', sprite: 'cracked_wall' },
      };
      return { kind: 'door' as const, info: labels[tile.door] };
    }
    return null;
  }, [game, hoverTile]);

  const activeShopDef = game.activeShop ? SHOPS[game.activeShop] : null;
  const hasAnySave = Boolean(saves.auto || saves['slot-1'] || saves['slot-2'] || saves['slot-3']);
  const victoryRank = computeRank(game.hero.hp, game.difficulty);
  const activeDiffMeta = DIFFICULTY_META[game.difficulty];
  const isPhosphorOs = activeOs === 'phosphor';
  const hybridModeLabel = isPhosphorOs ? '荧光彩标' : '主题色调';
  const colorModeLabel = '全彩像素';

  return (
    <div
      className="mota-host"
      ref={hostRef}
      data-mota-floor={game.floor}
      data-mota-overlay={overlay}
      data-mota-color={colorMode}
      data-mota-difficulty={game.difficulty}
    >
      <header className="mota-topbar">
        <div className="mota-floor-chip">
          <PixelIcon name="tower" size={16} />
          <strong className="mota-floor-name">{floorDef.name}</strong>
          <span className="mota-diff-badge" data-diff={game.difficulty}>
            {activeDiffMeta.shortLabel}
          </span>
          <span className="mota-floor-meta">ACT {floorDef.act} · 步数 {game.steps}</span>
        </div>

        <div className="mota-topbar-actions">
          <button
            type="button"
            className="mota-pill-btn"
            data-synced="local"
            onClick={() => setOverlay((o) => (o === 'saves' ? 'none' : 'saves'))}
            title="管理本地浏览器存档槽位 (G)"
          >
            <PixelIcon name="save" size={14} />
            <span>本地存档</span>
          </button>

          <button
            type="button"
            className="mota-pill-btn"
            data-color-mode={colorMode}
            onClick={toggleColorMode}
            title={
              isPhosphorOs
                ? `切换视觉风格：${hybridModeLabel}（CRT地牢+彩色道具） / ${colorModeLabel}（全元素像素上色）(C)`
                : `切换视觉风格：${colorModeLabel}（全元素像素上色） / ${hybridModeLabel}（随系统配色）(C)`
            }
          >
            <span>{colorMode === 'hybrid' ? hybridModeLabel : colorModeLabel}</span>
          </button>

          <button
            type="button"
            className="mota-pill-btn"
            aria-pressed={showMapTags}
            onClick={toggleMapTags}
            title="切换地图道具/NPC/特效角标 (T)"
          >
            <span>{showMapTags ? '标注 开' : '标注 关'}</span>
          </button>

          <button
            type="button"
            className="mota-pill-btn"
            aria-pressed={sfxEnabled}
            onClick={toggleSfx}
            title={sfxEnabled ? '关闭 8-bit 音效' : '开启 8-bit 音效'}
          >
            <PixelIcon name={sfxEnabled ? 'sound' : 'mute'} size={14} />
            <span>{sfxEnabled ? '音效 开' : '音效 关'}</span>
          </button>

          <button
            type="button"
            className="mota-pill-btn"
            aria-pressed={showDpad}
            onClick={() => setShowDpad((v) => !v)}
            title="切换屏幕方向键（也可直接使用键盘或点击地图自动寻路）"
          >
            <span>{showDpad ? '方向键 开' : '方向键'}</span>
          </button>

          <button
            type="button"
            className="mota-pill-btn"
            onClick={() => setOverlay((o) => (o === 'help' ? 'none' : 'help'))}
            title="操作指南与关于 (H)"
          >
            <span>?</span>
          </button>
        </div>
      </header>

      {saveNotice && (
        <div className="mota-toast-bar" role="status">
          <span>{saveNotice}</span>
          <button type="button" className="mota-toast-close" onClick={() => setSaveNotice('')} aria-label="关闭提示">
            ×
          </button>
        </div>
      )}

      <div className="mota-layout">
        <div className="mota-stage-col">
          <div className="mota-stage-frame">
            <div className="mota-viewport">
              <canvas
                ref={canvasRef}
                width={CANVAS_PX}
                height={CANVAS_PX}
                className="mota-canvas"
                aria-label={`魔塔地图 ${floorDef.name}，勇者位于 (${game.x}, ${game.y})`}
                onMouseMove={(e) => setHoverTile(tileFromPointer(e))}
                onMouseLeave={() => setHoverTile(null)}
                onClick={handleCanvasClick}
              />

              {overlay === 'title' && (
                <div className="mota-modal mota-modal--title" role="dialog" aria-label="魔塔开始界面">
                  <div className="mota-title-art">
                    <PixelPortrait sprite="demon_boss" size={44} colorMode={colorMode} />
                    <PixelPortrait sprite="hero_down" size={44} colorMode={colorMode} />
                    <PixelPortrait sprite="npc_fairy" size={44} colorMode={colorMode} />
                  </div>
                  <h1 className="mota-boot-title">MAGIC TOWER</h1>
                  <p className="mota-boot-sub">魔塔 21F · 22 层独立格局 · 纯前端本地存档</p>

                  <div className="mota-diff-picker" role="radiogroup" aria-label="选择魔塔难度">
                    {(['standard', 'hard'] as Difficulty[]).map((diff) => {
                      const meta = DIFFICULTY_META[diff];
                      const active = selectedDifficulty === diff;
                      return (
                        <button
                          key={diff}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className="mota-diff-card"
                          data-active={active ? 'true' : undefined}
                          data-diff={diff}
                          onClick={() => setSelectedDifficulty(diff)}
                        >
                          <strong>{meta.label}</strong>
                          <span>{meta.summary}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mota-boot-actions">
                    {saves.auto && (
                      <ButtonBase variant="primary" type="button" onClick={() => handleLoadSlot('auto')}>
                        <PixelIcon name="play" size={16} />
                        <span>
                          继续冒险 ({saves.auto.summary.floor}F · {DIFFICULTY_META[saves.auto.payload.difficulty === 'hard' ? 'hard' : 'standard'].shortLabel})
                        </span>
                      </ButtonBase>
                    )}
                    <ButtonBase
                      variant={saves.auto ? 'secondary' : 'primary'}
                      type="button"
                      onClick={() => handleNewGame(selectedDifficulty)}
                    >
                      <PixelIcon name="tower" size={16} />
                      <span>{saves.auto ? `新开 (${DIFFICULTY_META[selectedDifficulty].shortLabel})` : '开始攀登'}</span>
                    </ButtonBase>
                    {hasAnySave && (
                      <ButtonBase variant="secondary" type="button" onClick={() => setOverlay('saves')}>
                        <PixelIcon name="save" size={16} />
                        <span>读取存档</span>
                      </ButtonBase>
                    )}
                  </div>
                  <p className="mota-boot-credit">
                    按 C 随时切换【{isPhosphorOs ? `${hybridModeLabel} / ${colorModeLabel}` : `${colorModeLabel} / ${hybridModeLabel}`}】 · 战斗与临界算法参考 ckcz123/mota-js (BSD-3-Clause)
                  </p>
                </div>
              )}

              {overlay === 'none' && game.dialogue && (
                <div className="mota-dialogue" role="dialog" aria-label={game.dialogue.speaker}>
                  <div className="mota-dialogue-head">
                    <PixelPortrait sprite={game.dialogue.sprite} size={28} colorMode={colorMode} />
                    <strong>{game.dialogue.speaker}</strong>
                    <span className="mota-dialogue-page">
                      {game.dialogue.index + 1} / {game.dialogue.lines.length}
                    </span>
                  </div>
                  <p className="mota-dialogue-text">{game.dialogue.lines[game.dialogue.index]}</p>
                  <div className="mota-dialogue-actions">
                    {game.dialogue.index + 1 === game.dialogue.lines.length && game.dialogue.choice ? (
                      <>
                        <ButtonBase
                          variant="primary"
                          type="button"
                          onClick={() => {
                            const out = resolveDialogueChoice(game, true);
                            commitOutcome(game, out.state, out.checkpoint, out.sound);
                          }}
                        >
                          {game.dialogue.choice.confirmLabel}
                        </ButtonBase>
                        <ButtonBase
                          variant="secondary"
                          type="button"
                          onClick={() => {
                            const out = resolveDialogueChoice(game, false);
                            setGame(out.state);
                          }}
                        >
                          {game.dialogue.choice.cancelLabel}
                        </ButtonBase>
                      </>
                    ) : (
                      <ButtonBase
                        variant="primary"
                        type="button"
                        onClick={() => {
                          const out = advanceDialogue(game);
                          if (out.sound) playMotaSfx(out.sound, sfxEnabled);
                          setGame(out.state);
                        }}
                      >
                        {game.dialogue.index + 1 < game.dialogue.lines.length ? '继续 (Enter)' : '关闭 (Enter)'}
                      </ButtonBase>
                    )}
                  </div>
                </div>
              )}

              {overlay === 'none' && activeShopDef && (
                <div className="mota-modal" role="dialog" aria-label={activeShopDef.name}>
                  <div className="mota-modal-head">
                    <div className="mota-modal-title">
                      <PixelPortrait sprite={activeShopDef.sprite} size={24} colorMode={colorMode} />
                      <strong>{activeShopDef.speaker}</strong>
                      {activeShopDef.escalating && (
                        <span className="mota-tag">已购 {game.shopPurchases[activeShopDef.id] ?? 0} 次</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="mota-modal-close"
                      onClick={() => setGame((g) => closeActiveShop(g))}
                      aria-label="关闭商店"
                    >
                      ×
                    </button>
                  </div>
                  <p className="mota-modal-desc">{activeShopDef.greeting}</p>
                  <div className="mota-shop-balance">
                    <span>金币 {game.hero.gold}</span>
                    <span>经验 {game.hero.exp}</span>
                    <span>钥匙 {game.hero.yellowKeys}/{game.hero.blueKeys}/{game.hero.redKeys}</span>
                  </div>
                  <div className="mota-shop-list">
                    {activeShopDef.options.map((opt) => {
                      const balance =
                        opt.currency === 'gold'
                          ? game.hero.gold
                          : opt.currency === 'exp'
                            ? game.hero.exp
                            : opt.currency === 'yellowKey'
                              ? game.hero.yellowKeys
                              : opt.currency === 'blueKey'
                                ? game.hero.blueKeys
                                : game.hero.redKeys;
                      const currentCost = getShopOptionCost(activeShopDef.id, opt.id, game.shopPurchases);
                      const costLabel = formatShopCostText(activeShopDef.id, opt.id, game.shopPurchases);
                      const affordable = balance >= currentCost;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className="mota-shop-row"
                          disabled={!affordable}
                          onClick={() => {
                            const out = buyShopOption(game, activeShopDef.id, opt.id);
                            commitOutcome(game, out.state, out.checkpoint, out.sound);
                          }}
                        >
                          <span>{opt.label}</span>
                          <span className="mota-shop-cost">
                            {costLabel}
                            {opt.costStep ? ` (+${opt.costStep}/次)` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {overlay === 'book' && (
                <div className="mota-modal" role="dialog" aria-label="怪物手册">
                  <div className="mota-modal-head">
                    <div className="mota-modal-title">
                      <PixelIcon name="book" size={16} />
                      <strong>怪物手册 · {floorDef.name}</strong>
                    </div>
                    <button type="button" className="mota-modal-close" onClick={() => setOverlay('none')} aria-label="关闭怪物手册">
                      ×
                    </button>
                  </div>
                  {floorMonsters.length === 0 ? (
                    <p className="mota-modal-empty">当前楼层已无残留怪物。</p>
                  ) : (
                    <div className="mota-book-list">
                      {floorMonsters.map((entry) => {
                        const eff = getEffectiveEnemyStats(entry.monster, game.hero);
                        const dmgTier = getDamageTier(entry.damageInfo?.damage ?? null, game.hero.hp);
                        const lethal = dmgTier === 'lethal';
                        return (
                          <div key={entry.monster.id} className="mota-book-row" data-lethal={lethal ? 'true' : undefined}>
                            <PixelPortrait sprite={entry.monster.sprite} size={28} colorMode={colorMode} />
                            <div className="mota-book-info">
                              <div className="mota-book-top">
                                <strong>
                                  {entry.monster.name}
                                  {entry.count > 1 ? ` ×${entry.count}` : ''}
                                </strong>
                                {entry.monster.special?.map((sp) => (
                                  <span key={sp} className="mota-tag" data-special={sp} title={SPECIAL_META[sp].desc}>
                                    {SPECIAL_META[sp].name}
                                  </span>
                                ))}
                                <span
                                  className="mota-book-dmg"
                                  data-dmg-tier={dmgTier}
                                  data-lethal={lethal ? 'true' : undefined}
                                >
                                  伤 {entry.damageInfo ? entry.damageInfo.damage : '???'}
                                </span>
                              </div>
                              <div className="mota-book-stats">
                                <span>血 {eff.hp}</span>
                                <span>攻 {eff.atk}</span>
                                <span>防 {eff.def}</span>
                                <span>金 {entry.monster.gold * (game.relics.coin ? 2 : 1)}</span>
                                <span>经 {entry.monster.exp}</span>
                              </div>
                              <div className="mota-book-crit">
                                <span>
                                  临界:{' '}
                                  {entry.critical && entry.critical.atkNeeded > 0
                                    ? `+${entry.critical.atkNeeded}攻 (${entry.critical.damageReduced >= 0 ? `-${entry.critical.damageReduced}伤` : `破防伤${-entry.critical.damageReduced}`})`
                                    : '—'}
                                </span>
                                <span>+1防: {entry.defReduce !== null ? `-${entry.defReduce}伤` : '—'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {overlay === 'fly' && (
                <div className="mota-modal" role="dialog" aria-label="楼层传送器">
                  <div className="mota-modal-head">
                    <div className="mota-modal-title">
                      <PixelIcon name="stairs" size={16} />
                      <strong>楼层传送器 (0F – {game.maxFloor}F)</strong>
                    </div>
                    <button type="button" className="mota-modal-close" onClick={() => setOverlay('none')} aria-label="关闭楼层传送器">
                      ×
                    </button>
                  </div>
                  <div className="mota-fly-grid">
                    {FLOORS.map((f) => {
                      const unlocked = game.visitedFloors.includes(f.floor);
                      const isCurrent = f.floor === game.floor;
                      return (
                        <button
                          key={f.floor}
                          type="button"
                          className="mota-fly-btn"
                          data-current={isCurrent ? 'true' : undefined}
                          disabled={!unlocked}
                          onClick={() => {
                            const out = flyToFloor(game, f.floor);
                            if (out.changed) {
                              commitOutcome(game, out.state, out.checkpoint, out.sound);
                              setOverlay('none');
                            }
                          }}
                        >
                          <strong>{f.floor}F</strong>
                          <span>{unlocked ? f.name.replace(/^\d+F · /, '') : '未抵达'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {overlay === 'quickShop' && (
                <div className="mota-modal" role="dialog" aria-label="快捷商店">
                  <div className="mota-modal-head">
                    <div className="mota-modal-title">
                      <PixelIcon name="shop" size={16} />
                      <strong>快捷商店</strong>
                    </div>
                    <button type="button" className="mota-modal-close" onClick={() => setOverlay('none')} aria-label="关闭快捷商店">
                      ×
                    </button>
                  </div>
                  {game.flags.discoveredShops.length === 0 ? (
                    <p className="mota-modal-empty">访问过楼层内的商店后，即可在此随时远程交易。</p>
                  ) : (
                    <div className="mota-shop-list">
                      {game.flags.discoveredShops.map((shopId: ShopId) => {
                        const shop = SHOPS[shopId];
                        return (
                          <button
                            key={shopId}
                            type="button"
                            className="mota-shop-row"
                            onClick={() => {
                              const out = openQuickShop(game, shopId);
                              if (out.changed) {
                                if (out.sound) playMotaSfx(out.sound, sfxEnabled);
                                setGame(out.state);
                                setOverlay('none');
                              }
                            }}
                          >
                            <span>{shop.name}</span>
                            <span className="mota-shop-cost">进入 →</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {overlay === 'saves' && (
                <div className="mota-modal" role="dialog" aria-label="本地存档管理">
                  <div className="mota-modal-head">
                    <div className="mota-modal-title">
                      <PixelIcon name="save" size={16} />
                      <strong>存档管理 · 本地浏览器</strong>
                    </div>
                    <button type="button" className="mota-modal-close" onClick={() => setOverlay('none')} aria-label="关闭存档管理">
                      ×
                    </button>
                  </div>

                  <p className="mota-modal-desc">所有存档完全保存在当前浏览器 localStorage 中，无需联网或后端账号。</p>

                  <div className="mota-save-list">
                    {SAVE_SLOTS.map(({ id, label }) => {
                      const rec = saves[id];
                      return (
                        <div key={id} className="mota-save-row" data-slot={id}>
                          <div className="mota-save-meta">
                            <div className="mota-save-title">
                              <strong>{label}</strong>
                              {rec && <span className="mota-tag">本地</span>}
                              {rec && (
                                <span className="mota-tag" data-diff={rec.payload.difficulty === 'hard' ? 'hard' : 'standard'}>
                                  {DIFFICULTY_META[rec.payload.difficulty === 'hard' ? 'hard' : 'standard'].shortLabel}
                                </span>
                              )}
                              {rec?.summary.victory && <span className="mota-tag">已通关</span>}
                            </div>
                            {rec ? (
                              <p className="mota-save-detail">
                                {rec.summary.floorName} · HP {rec.summary.hp} · 攻 {rec.summary.atk} · 防 {rec.summary.def} ·{' '}
                                {formatTimestamp(rec.updatedAt)}
                              </p>
                            ) : (
                              <p className="mota-save-detail mota-save-detail--empty">空槽位</p>
                            )}
                          </div>
                          <div className="mota-save-btns">
                            {id !== 'auto' && (
                              <button
                                type="button"
                                className="mota-mini-key"
                                onClick={() => persistSaveSlot(id, game)}
                              >
                                保存
                              </button>
                            )}
                            <button
                              type="button"
                              className="mota-mini-key"
                              disabled={!rec}
                              onClick={() => handleLoadSlot(id)}
                            >
                              读取
                            </button>
                            {rec && id !== 'auto' && (
                              <button
                                type="button"
                                className="mota-mini-key"
                                onClick={() => handleDeleteSlot(id)}
                              >
                                清除
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {overlay === 'help' && (
                <div className="mota-modal" role="dialog" aria-label="游戏指南与开源致谢">
                  <div className="mota-modal-head">
                    <div className="mota-modal-title">
                      <PixelIcon name="tower" size={16} />
                      <strong>操作说明 & 机制手册</strong>
                    </div>
                    <button type="button" className="mota-modal-close" onClick={() => setOverlay('none')} aria-label="关闭帮助">
                      ×
                    </button>
                  </div>
                  <div className="mota-help-body">
                    <dl className="mota-help-keys">
                      <div><dt>方向键 / WASD / 点击格子</dt><dd>移动、开门、对话、自动寻路战斗</dd></div>
                      <div><dt>B</dt><dd>怪物手册（查看显伤、临界值、+1防减伤）</dd></div>
                      <div><dt>F</dt><dd>楼层传送器（7F 获得后可自由飞层）</dd></div>
                      <div><dt>V</dt><dd>快捷商店（已访问的商店可随时远程交易）</dd></div>
                      <div><dt>Z</dt><dd>撤回上一步（战斗/开门/买属性都可反悔）</dd></div>
                      <div><dt>G</dt><dd>本地浏览器存档 / 读档（4 个槽位）</dd></div>
                      <div><dt>T</dt><dd>开关地图标注（道具/钥匙/NPC/特殊怪角标）</dd></div>
                      <div><dt>C</dt><dd>切换视觉风格（{isPhosphorOs ? `${hybridModeLabel} ↔ ${colorModeLabel}` : `${colorModeLabel} ↔ ${hybridModeLabel}`}）</dd></div>
                    </dl>
                    <div className="mota-help-section">
                      <h3>彩色图例速查</h3>
                      <ul>
                        <li><strong>三色门 / 钥匙</strong>：金黄 <code>[Y]</code> / 冰蓝 <code>[B]</code> / 绯红 <code>[R]</code> / 幽紫机关门。</li>
                        <li><strong>道具色相</strong>：绯红尖晶（攻）、湛蓝盾晶（防）、翠绿十字瓶（血）、青白圣杯（唯一圣水 ×2）。</li>
                        <li><strong>显伤分级</strong>：翠绿 <code>0</code> 无伤、琥珀黄可控、橙色高危、绯红实底无法击败。</li>
                      </ul>
                    </div>
                    <div className="mota-help-section">
                      <h3>进阶博弈与双难度</h3>
                      <ul>
                        <li><strong>递增商店</strong>：3F(+8G/次)、11F(+18G/次)、5F(+5E/次)、13F(+14E/次)，低层与高层商店交替比价最划算。</li>
                        <li><strong>紧平衡钥匙</strong>：全塔零冗余装饰门，省下的多余钥匙可在 12F 黑市卖出换金币。</li>
                        <li><strong>9 大战术特性</strong>：先攻、魔攻（无视防）、坚固（防=你攻-1）、2连/3连击（吃防阈值）、吸血（残血打）、破甲（无视部分防）、狂暴（每回合涨攻，逼高攻临界）、反伤（每受击反弹真伤）。</li>
                        <li><strong>困难 · 红海</strong>：初始 850 HP、怪物强化、三大魔王激活【先攻】、十字架增幅 28%。</li>
                      </ul>
                    </div>
                    <p className="mota-help-credit">
                      战斗公式与临界值算法参考开源项目 <code>ckcz123/mota-js</code>（BSD-3-Clause），22 层独立格局与双难度数值为原创重构。
                    </p>
                  </div>
                </div>
              )}

              {overlay === 'victory' && (
                <div className="mota-modal mota-modal--victory" role="dialog" aria-label="魔塔通关">
                  <div className="mota-title-art">
                    <PixelPortrait sprite="hero_down" size={44} colorMode={colorMode} />
                    <PixelPortrait sprite="npc_princess" size={44} colorMode={colorMode} />
                  </div>
                  <h2 className="mota-boot-title">VICTORY · {victoryRank.grade}</h2>
                  <p className="mota-boot-sub">
                    【{activeDiffMeta.label}】{victoryRank.note}
                  </p>
                  <div className="mota-victory-stats">
                    <div><span>最终生命得分</span><strong>{game.hero.hp}</strong></div>
                    <div><span>攻击 / 防御</span><strong>{game.hero.atk} / {game.hero.def}</strong></div>
                    <div><span>击败怪物</span><strong>{game.battlesWon}</strong></div>
                    <div><span>总步数</span><strong>{game.steps}</strong></div>
                  </div>
                  <div className="mota-boot-actions">
                    <ButtonBase variant="primary" type="button" onClick={() => setOverlay('none')}>
                      继续探索
                    </ButtonBase>
                    <ButtonBase variant="secondary" type="button" onClick={() => setOverlay('title')}>
                      切换难度 / 重开
                    </ButtonBase>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showDpad && (
            <div className="mota-dpad" role="group" aria-label="方向控制">
              <button type="button" className="mota-dpad-btn mota-dpad-up" onClick={() => handleManualMove('up')} aria-label="向上">▲</button>
              <button type="button" className="mota-dpad-btn mota-dpad-left" onClick={() => handleManualMove('left')} aria-label="向左">◀</button>
              <button type="button" className="mota-dpad-btn mota-dpad-down" onClick={() => handleManualMove('down')} aria-label="向下">▼</button>
              <button type="button" className="mota-dpad-btn mota-dpad-right" onClick={() => handleManualMove('right')} aria-label="向右">▶</button>
            </div>
          )}
        </div>

        <aside className="mota-hud" aria-label="勇者状态与操作">
          <section className="mota-panel">
            <div className="mota-stats-grid">
              <div className="mota-stat"><span>等级 LV</span><strong>{game.hero.lv}</strong></div>
              <div className="mota-stat"><span>生命 HP</span><strong>{game.hero.hp}</strong></div>
              <div className="mota-stat"><span>攻击 ATK</span><strong>{game.hero.atk}</strong></div>
              <div className="mota-stat"><span>防御 DEF</span><strong>{game.hero.def}</strong></div>
              <div className="mota-stat"><span>金币 GOLD</span><strong>{game.hero.gold}</strong></div>
              <div className="mota-stat"><span>经验 EXP</span><strong>{game.hero.exp}</strong></div>
            </div>
            <div className="mota-equip-strip">
              <span>武器: <strong>{game.hero.weaponName}</strong></span>
              <span>防具: <strong>{game.hero.shieldName}</strong></span>
            </div>
          </section>

          <section className="mota-panel">
            <div className="mota-keys-row" aria-label="钥匙数量">
              <div className="mota-key-item" data-key="yellow" title="黄钥匙 [Y]">
                <PixelPortrait sprite="key_yellow" size={16} colorMode={colorMode} />
                <span>黄[Y]</span>
                <strong>{game.hero.yellowKeys}</strong>
              </div>
              <div className="mota-key-item" data-key="blue" title="蓝钥匙 [B]">
                <PixelPortrait sprite="key_blue" size={16} colorMode={colorMode} />
                <span>蓝[B]</span>
                <strong>{game.hero.blueKeys}</strong>
              </div>
              <div className="mota-key-item" data-key="red" title="红钥匙 [R]">
                <PixelPortrait sprite="key_red" size={16} colorMode={colorMode} />
                <span>红[R]</span>
                <strong>{game.hero.redKeys}</strong>
              </div>
            </div>

            <div className="mota-relics-row" aria-label="持有圣物">
              <span className="mota-relic-pill" data-owned={game.relics.book ? 'true' : undefined}>手册</span>
              <span className="mota-relic-pill" data-owned={game.relics.fly ? 'true' : undefined}>楼传</span>
              <span className="mota-relic-pill" data-owned={game.relics.cross ? 'true' : undefined}>
                {game.flags.crossDelivered ? '圣光✓' : '十字'}
              </span>
              <span className="mota-relic-pill" data-owned={game.relics.pickaxe ? 'true' : undefined}>破墙镐</span>
              <span className="mota-relic-pill" data-owned={game.relics.coin ? 'true' : undefined}>双倍金</span>
            </div>
          </section>

          <section className="mota-actions-grid" aria-label="快捷工具">
            <ButtonBase
              variant="secondary"
              type="button"
              className="mota-action-key"
              disabled={!game.relics.book}
              onClick={() => setOverlay((o) => (o === 'book' ? 'none' : 'book'))}
            >
              <PixelIcon name="book" size={14} />
              <span>手册 B</span>
            </ButtonBase>
            <ButtonBase
              variant="secondary"
              type="button"
              className="mota-action-key"
              disabled={!game.relics.fly}
              onClick={() => setOverlay((o) => (o === 'fly' ? 'none' : 'fly'))}
            >
              <PixelIcon name="stairs" size={14} />
              <span>楼传 F</span>
            </ButtonBase>
            <ButtonBase
              variant="secondary"
              type="button"
              className="mota-action-key"
              disabled={game.flags.discoveredShops.length === 0}
              onClick={() => setOverlay((o) => (o === 'quickShop' ? 'none' : 'quickShop'))}
            >
              <PixelIcon name="shop" size={14} />
              <span>商店 V</span>
            </ButtonBase>
            <ButtonBase
              variant="secondary"
              type="button"
              className="mota-action-key"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
            >
              <PixelIcon name="undo" size={14} />
              <span>撤回 Z</span>
            </ButtonBase>
            <ButtonBase
              variant="secondary"
              type="button"
              className="mota-action-key"
              onClick={() => setOverlay((o) => (o === 'saves' ? 'none' : 'saves'))}
            >
              <PixelIcon name="save" size={14} />
              <span>存/读 G</span>
            </ButtonBase>
            <ButtonBase
              variant="secondary"
              type="button"
              className="mota-action-key"
              onClick={() => setOverlay('title')}
              title="返回标题界面以切换难度或重新开始"
            >
              <PixelIcon name="tower" size={14} />
              <span>难度/重开</span>
            </ButtonBase>
          </section>

          <section className="mota-panel mota-hud-foot" aria-label="快捷操作提示">
            <div className="mota-hud-foot-row">
              <span>当前难度</span>
              <strong>{activeDiffMeta.label}</strong>
            </div>
            <div className="mota-hud-foot-row">
              <span>已达最高层 / 击杀</span>
              <strong>{game.maxFloor}F · {game.battlesWon} 怪</strong>
            </div>
            <p className="mota-hud-foot-keys">
              WASD / 点击寻路 · B 手册 · F 楼传 · V 商店 · Z 撤回 · G 存档 · T 标注 · C 色彩
            </p>
          </section>
        </aside>

        <aside className="mota-intel" aria-label="本层怪物与情报">
          <section className="mota-panel mota-radar">
            <div className="mota-radar-head">
              <PixelIcon name="book" size={14} />
              <strong>{game.relics.book ? `本层怪物 (${floorMonsters.length})` : '彩色图例速查'}</strong>
            </div>

            {!game.relics.book ? (
              <ul className="mota-radar-legend">
                <li><strong>黄[Y] / 蓝[B] / 红[R]</strong>：三色钥匙与对应门</li>
                <li><strong>红晶 / 蓝晶</strong>：攻击 +3 / 防御 +3 强化</li>
                <li><strong>翠绿药瓶</strong>：小瓶 +200 / 金口大壶 +500 HP</li>
                <li><strong>! / $</strong>：友好 NPC 对话 / 递增商店</li>
                <li className="mota-radar-hint">登上 1F 拾取【怪物手册】后，此处将实时显示本层怪物战损与临界值。按 C 可切换{colorMode === 'color' ? hybridModeLabel : colorModeLabel}。</li>
              </ul>
            ) : floorMonsters.length === 0 ? (
              <p className="mota-radar-empty">本层怪物已全部肃清。</p>
            ) : (
              <div className="mota-radar-list">
                {floorMonsters.map((entry) => {
                  const eff = getEffectiveEnemyStats(entry.monster, game.hero);
                  const dmgTier = getDamageTier(entry.damageInfo?.damage ?? null, game.hero.hp);
                  const lethal = dmgTier === 'lethal';
                  return (
                    <div
                      key={entry.monster.id}
                      className="mota-radar-row"
                      data-lethal={lethal ? 'true' : undefined}
                    >
                      <PixelPortrait sprite={entry.monster.sprite} size={24} colorMode={colorMode} />
                      <div className="mota-radar-info">
                        <div className="mota-radar-top">
                          <strong>{entry.monster.name}</strong>
                          <span className="mota-radar-count">×{entry.count}</span>
                          <span
                            className="mota-radar-dmg"
                            data-dmg-tier={dmgTier}
                            data-lethal={lethal ? 'true' : undefined}
                          >
                            {entry.damageInfo ? entry.damageInfo.damage : '危'}
                          </span>
                        </div>
                        <div className="mota-radar-sub">
                          <span>血{eff.hp} 攻{eff.atk} 防{eff.def}</span>
                        </div>
                        <div className="mota-radar-crit">
                          <span>
                            {entry.critical && entry.critical.atkNeeded > 0
                              ? `+${entry.critical.atkNeeded}攻${entry.critical.damageReduced >= 0 ? `(-${entry.critical.damageReduced})` : '破防'}`
                              : '最低伤'}
                          </span>
                          <span>
                            {entry.defReduce !== null && entry.defReduce > 0
                              ? `+1防(-${entry.defReduce})`
                              : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mota-panel mota-inspector" aria-live="polite">
            {inspected?.kind === 'monster' ? (
              <div className="mota-inspect-monster">
                <div className="mota-inspect-head">
                  <PixelPortrait sprite={inspected.monster.sprite} size={28} colorMode={colorMode} />
                  <div>
                    <strong>{inspected.monster.name}</strong>
                    <div className="mota-inspect-tags">
                      {inspected.monster.special?.map((sp) => (
                        <span key={sp} className="mota-tag" data-special={sp}>{SPECIAL_META[sp].name}</span>
                      ))}
                    </div>
                  </div>
                  <span
                    className="mota-inspect-dmg"
                    data-dmg-tier={getDamageTier(inspected.dmg?.damage ?? null, game.hero.hp)}
                    data-lethal={!inspected.dmg || inspected.dmg.damage >= game.hero.hp ? 'true' : undefined}
                  >
                    伤 {inspected.dmg ? inspected.dmg.damage : '???'}
                  </span>
                </div>
                <div className="mota-inspect-grid">
                  <span>血 {inspected.effective.hp}</span>
                  <span>攻 {inspected.effective.atk}</span>
                  <span>防 {inspected.effective.def}</span>
                  <span>
                    奖励 {inspected.monster.gold * (game.relics.coin ? 2 : 1)}G / {inspected.monster.exp}E
                  </span>
                </div>
                <div className="mota-inspect-crit">
                  <span>
                    临界:{' '}
                    {inspected.crit && inspected.crit.atkNeeded > 0
                      ? `+${inspected.crit.atkNeeded}攻 (${inspected.crit.damageReduced >= 0 ? `-${inspected.crit.damageReduced}伤` : `破防`})`
                      : '已达最低'}
                  </span>
                  <span>+1防: {inspected.defRed !== null ? `-${inspected.defRed}伤` : '—'}</span>
                </div>
              </div>
            ) : inspected?.kind === 'item' ? (
              <div className="mota-inspect-simple">
                <PixelPortrait sprite={inspected.item.sprite} size={26} colorMode={colorMode} />
                <div>
                  <strong>{inspected.item.name}</strong>
                  <p>{inspected.item.shortDesc}</p>
                </div>
              </div>
            ) : inspected?.kind === 'npc' ? (
              <div className="mota-inspect-simple">
                <PixelPortrait sprite={inspected.npc.sprite} size={26} colorMode={colorMode} />
                <div>
                  <strong>{inspected.npc.name}</strong>
                  <p>{inspected.npc.hint}</p>
                </div>
              </div>
            ) : inspected?.kind === 'shop' ? (
              <div className="mota-inspect-simple">
                <PixelPortrait sprite={inspected.shop.sprite} size={26} colorMode={colorMode} />
                <div>
                  <strong>{inspected.shop.name}</strong>
                  <p>{inspected.shop.greeting}</p>
                </div>
              </div>
            ) : inspected?.kind === 'door' ? (
              <div className="mota-inspect-simple">
                <PixelPortrait sprite={inspected.info.sprite} size={26} colorMode={colorMode} />
                <div>
                  <strong>{inspected.info.name}</strong>
                  <p>{inspected.info.desc}</p>
                </div>
              </div>
            ) : (
              <div className="mota-log">
                <span className="mota-log-title">冒险日志</span>
                <ul>
                  {game.log.slice(-3).reverse().map((entry, idx) => (
                    <li key={`${idx}-${entry}`}>{entry}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
