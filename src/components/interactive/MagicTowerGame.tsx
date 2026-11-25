import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $preferences } from '../../stores/osStore';
import {
  SPECIAL_META,
  formatCompactDamage,
  getDamageInfo,
  getDefDamageReduction,
  getEffectiveEnemyStats,
  getNextCritical,
} from '../../games/mota/combat';
import { ITEMS, MONSTERS, SHOPS } from '../../games/mota/data';
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
import { drawSprite, readPhosphorPalette, spriteToRects, type PhosphorPalette } from '../../games/mota/sprites';
import type {
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
const TILE_PX = 64;
const CANVAS_PX = MAP_SIZE * TILE_PX;
const MAX_UNDO = 40;
const SPECIAL_SHORT_TAG: Readonly<Record<string, string>> = {
  firstStrike: '先',
  magic: '魔',
  solid: '固',
  doubleHit: '连',
  vampire: '吸',
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
  sage1f: { sprite: 'npc_sage', name: '引路老人', hint: '基础操作与图鉴提示' },
  blacksmith2f: { sprite: 'npc_sage', name: '铁匠大师', hint: '获救后赠予攻击 +30' },
  armorer2f: { sprite: 'npc_merchant', name: '护甲匠', hint: '获救后赠予防御 +30' },
  thief4f: { sprite: 'npc_thief', name: '盗贼杰克', hint: '解锁 2F 囚室与 18F 密门' },
  guide7f: { sprite: 'npc_sage', name: '守望学者', hint: '三段式攻略与十字架提示' },
  guide10f: { sprite: 'npc_sage', name: '老兵向导', hint: '特殊怪物与破墙镐提示' },
  sage15fAtk: { sprite: 'npc_sage', name: '剑道宗师', hint: '500 经验 → 攻击 +120' },
  sage15fDef: { sprite: 'npc_merchant', name: '铁壁商神', hint: '500 金币 → 防御 +120' },
  decoy18f: { sprite: 'npc_princess', name: '镜像幻影', hint: '解开 18F 东南楼梯封印' },
  warning20f: { sprite: 'npc_sage', name: '塔顶信使', hint: '决战前最终提醒' },
  princess21f: { sprite: 'npc_princess', name: '塔顶守望者', hint: '击败大魔王后即可解救' },
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

function computeRank(hp: number): { grade: string; note: string } {
  if (hp >= 30000) return { grade: 'S', note: '传奇魔塔大师 · 完美控血通关' };
  if (hp >= 15000) return { grade: 'A', note: '资深勇者 · 路线规划精妙' };
  if (hp >= 6000) return { grade: 'B', note: '稳健登顶 · 成功驱散塔顶阴霾' };
  return { grade: 'C', note: '险中求胜 · 终克暗影大魔王' };
}

function PixelPortrait({ sprite, size = 32 }: { sprite: string; size?: number }) {
  const rects = useMemo(() => spriteToRects(sprite), [sprite]);
  const toneFill: Record<'0' | '1' | '2' | '3', string> = {
    '0': 'var(--ground)',
    '1': 'var(--side)',
    '2': 'var(--lit)',
    '3': 'var(--hi)',
  };
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
        <rect key={idx} x={r.x} y={r.y} width={1} height={1} fill={toneFill[r.tone]} />
      ))}
    </svg>
  );
}

export default function MagicTowerGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const walkQueueRef = useRef<Direction[]>([]);
  const walkTimerRef = useRef<number | null>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const paletteRef = useRef<PhosphorPalette | null>(null);
  const animFrameRef = useRef<number>(0);

  const { theme } = useStore($preferences, { ssr: 'initial' });

  const [game, setGame] = useState<GameState>(() => createInitialState());
  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [overlay, setOverlay] = useState<OverlayMode>('title');
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [showMapTags, setShowMapTags] = useState<boolean>(true);
  const [showDpad, setShowDpad] = useState<boolean>(false);
  const [animTick, setAnimTick] = useState<number>(0);

  // Local browser save slots state
  const [saves, setSaves] = useState<Partial<Record<SaveSlotId, StoredSaveRecord>>>({});
  const [syncNotice, setSyncNotice] = useState<string>('');

  useEffect(() => {
    stateRef.current = game;
  }, [game]);

  const floorDef = getFloorDef(game.floor);
  const floorMonsters = useMemo(() => getCurrentFloorMonsters(game), [game]);

  const updateWindowStatus = useCallback((text: string) => {
    const status = hostRef.current?.closest('[data-window-id]')?.querySelector<HTMLElement>('[data-window-status]');
    if (status && status.textContent !== text) status.textContent = text;
  }, []);

  // Update window status bar cleanly.
  useEffect(() => {
    updateWindowStatus(`${floorDef.name} · HP ${game.hero.hp} · 本地存档`);
  }, [floorDef.name, game.hero.hp, updateWindowStatus]);

  // Load saved SFX preference and local saves on mount.
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

  // Subtle idle animation ticker (disabled under prefers-reduced-motion).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setAnimTick((t) => (t + 1) % 60);
    }, 450);
    return () => window.clearInterval(id);
  }, []);

  // Re-read phosphor palette whenever OS theme switches (amber/green/blue/white) via store or data-theme attr.
  useEffect(() => {
    const syncPalette = () => {
      paletteRef.current = readPhosphorPalette(hostRef.current);
      setAnimTick((t) => t + 1);
    };
    syncPalette();
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(syncPalette);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [theme]);

  const stopWalk = useCallback(() => {
    walkQueueRef.current = [];
    if (walkTimerRef.current !== null) {
      window.clearTimeout(walkTimerRef.current);
      walkTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWalk();
    };
  }, [stopWalk]);

  const persistSaveSlot = useCallback(
    (slot: SaveSlotId, snapshot: GameState, silent = false) => {
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
        setSyncNotice(`已保存至 ${label}（本地）`);
      }
    },
    [],
  );

  const scheduleAutoSave = useCallback((snapshot: GameState) => {
    persistSaveSlot('auto', snapshot, true);
  }, [persistSaveSlot]);

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
        scheduleAutoSave(next);
      } else if (checkpoint) {
        scheduleAutoSave(next);
      }
    },
    [sfxEnabled, scheduleAutoSave],
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
      // Stop queued path if dialogue/shop/floor change triggered.
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
        setSyncNotice('存档格式无效，无法读取。');
        playMotaSfx('error', sfxEnabled);
        return;
      }
      stopWalk();
      setUndoStack([]);
      setGame(restored);
      setOverlay('none');
      setSyncNotice(`已读取 ${SAVE_SLOTS.find((s) => s.id === slot)?.label ?? slot}`);
      playMotaSfx('stairs', sfxEnabled);
    },
    [saves, stopWalk, sfxEnabled],
  );

  const handleDeleteSlot = useCallback(
    (slot: SaveSlotId) => {
      setSaves((prev) => {
        const next = { ...prev };
        delete next[slot];
        writeLocalSaves(next);
        return next;
      });
      setSyncNotice(`已清除 ${SAVE_SLOTS.find((s) => s.id === slot)?.label ?? slot}`);
    },
    [],
  );

  const handleNewGame = useCallback(() => {
    stopWalk();
    const fresh = createInitialState();
    setUndoStack([]);
    setGame(fresh);
    setOverlay('none');
    playMotaSfx('stairs', sfxEnabled);
  }, [stopWalk, sfxEnabled]);

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

  // Keyboard controls (capture Escape before WindowFrame when an in-game modal/shop/dialogue is open).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      // Do not steal keys while Start Menu is expanded.
      const startMenu = document.querySelector<HTMLElement>('#start-menu-panel');
      if (startMenu && !startMenu.hidden) return;

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
  }, [overlay, saves.auto, sfxEnabled, handleLoadSlot, handleNewGame, handleUndo, handleManualMove, toggleMapTags]);

  // Compute hovered path preview for canvas.
  const previewPath = useMemo(() => {
    if (!hoverTile || overlay !== 'none' || game.dialogue || game.activeShop) return null;
    return findPathToTile(game, hoverTile.x, hoverTile.y);
  }, [game, hoverTile, overlay]);

  // Draw the 11×11 crisp pixel dungeon canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = paletteRef.current ?? readPhosphorPalette(hostRef.current);
    paletteRef.current = palette;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

    const frameParity = animTick % 2;

    // 1. Tiles
    for (let y = 0; y < MAP_SIZE; y += 1) {
      for (let x = 0; x < MAP_SIZE; x += 1) {
        const px = x * TILE_PX;
        const py = y * TILE_PX;

        // Subtle CRT tile grid
        ctx.fillStyle = palette.ground;
        ctx.fillRect(px, py, TILE_PX, TILE_PX);
        drawSprite(ctx, 'floor', px, py, TILE_PX, palette);

        const tile: TileKind = getEffectiveTile(game, x, y);
        if (tile.type === 'wall') {
          drawSprite(ctx, 'wall', px, py, TILE_PX, palette);
        } else if (tile.type === 'lava') {
          drawSprite(ctx, frameParity === 0 ? 'lava_0' : 'lava_1', px, py, TILE_PX, palette);
        } else if (tile.type === 'stairsUp') {
          drawSprite(ctx, 'stairs_up', px, py, TILE_PX, palette);
        } else if (tile.type === 'stairsDown') {
          drawSprite(ctx, 'stairs_down', px, py, TILE_PX, palette);
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
          drawSprite(ctx, spriteName, px, py, TILE_PX, palette);
        } else if (tile.type === 'item') {
          const item = ITEMS[tile.itemId];
          // Subtle top corner dots mark collectible pickup tiles vs living creatures.
          ctx.fillStyle = palette.lit28;
          ctx.fillRect(px + 3, py + 3, 3, 3);
          ctx.fillRect(px + TILE_PX - 6, py + 3, 3, 3);

          drawSprite(ctx, item.sprite, px, py + 1, TILE_PX, palette);

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
            ctx.fillStyle = palette.ground;
            ctx.fillRect(tx, ty, tagW, tagH);
            // Underline-only pill distinguishes pickups from 4-sided monster combat boxes.
            ctx.fillStyle = isKey ? palette.hi : palette.side;
            ctx.fillRect(tx, ty + tagH - 2, tagW, 2);
            ctx.fillStyle = isKey ? palette.hi : palette.lit;
            ctx.fillText(tagText, px + TILE_PX / 2, ty + tagH / 2 - 0.5);
          }
        } else if (tile.type === 'npc') {
          const npc = NPC_SPRITE[tile.npcId];
          drawSprite(ctx, npc.sprite, px, py, TILE_PX, palette, frameParity === 1 ? -2 : 0);
          if (showMapTags) {
            const bx = px + TILE_PX - 19;
            const by = py + 2;
            ctx.fillStyle = palette.ground;
            ctx.fillRect(bx - 1, by - 1, 19, 19);
            ctx.fillStyle = palette.hi;
            ctx.fillRect(bx, by, 17, 17);
            ctx.font = 'bold 14px "Chivo Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = palette.ground;
            ctx.fillText('!', bx + 8.5, by + 9.5);
          }
        } else if (tile.type === 'shop') {
          const shop = SHOPS[tile.shopId];
          drawSprite(ctx, shop.sprite, px, py, TILE_PX, palette);
          if (showMapTags) {
            const bx = px + TILE_PX - 19;
            const by = py + 2;
            ctx.fillStyle = palette.ground;
            ctx.fillRect(bx - 1, by - 1, 19, 19);
            ctx.fillStyle = palette.hi;
            ctx.fillRect(bx, by, 17, 17);
            ctx.font = 'bold 14px "Chivo Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = palette.ground;
            ctx.fillText('$', bx + 8.5, by + 9.5);
          }
        } else if (tile.type === 'monster') {
          const monster = MONSTERS[tile.monsterId];
          if (monster) {
            drawSprite(ctx, monster.sprite, px, py + 1, TILE_PX, palette, frameParity === 1 ? -2 : 0);

            // Top-left special ability corner chip (先/魔/固/连/吸) so special enemies stand out immediately!
            if (showMapTags && monster.special && monster.special.length > 0) {
              const glyph = SPECIAL_SHORT_TAG[monster.special[0]];
              if (glyph) {
                const sx = px + 2;
                const sy = py + 2;
                ctx.fillStyle = palette.ground;
                ctx.fillRect(sx, sy, 19, 19);
                ctx.strokeStyle = palette.hi;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(sx + 0.75, sy + 0.75, 17.5, 17.5);
                ctx.font = 'bold 13px "Chivo Mono", "PingFang SC", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = palette.hi;
                ctx.fillText(glyph, sx + 9.5, sy + 10);
              }
            }

            // Live on-map 4-sided combat damage box once Monster Manual is owned!
            if (game.relics.book) {
              const dmgInfo = getDamageInfo(monster, game.hero);
              const damage = dmgInfo ? dmgInfo.damage : null;
              const lethal = damage === null || damage >= game.hero.hp;
              const safe = damage !== null && damage === 0;
              const label = formatCompactDamage(damage);

              ctx.font = 'bold 16px "Chivo Mono", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              const badgeW = Math.min(TILE_PX - 4, Math.max(32, Math.ceil(ctx.measureText(label).width) + 10));
              const badgeH = 20;
              const bx = Math.round(px + (TILE_PX - badgeW) / 2);
              const by = py + TILE_PX - badgeH - 1;

              if (lethal) {
                // High-contrast inverted bar for lethal / unbreakable monsters.
                ctx.fillStyle = palette.lit;
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.fillStyle = palette.ground;
                ctx.fillText(label, px + TILE_PX / 2, by + badgeH / 2 + 0.5);
              } else if (safe) {
                ctx.fillStyle = palette.ground;
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.strokeStyle = palette.hi;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx + 0.75, by + 0.75, badgeW - 1.5, badgeH - 1.5);
                ctx.fillStyle = palette.hi;
                ctx.fillText('0', px + TILE_PX / 2, by + badgeH / 2 + 0.5);
              } else {
                ctx.fillStyle = palette.ground;
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.strokeStyle = damage >= game.hero.hp * 0.4 ? palette.hi : palette.lit;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx + 0.75, by + 0.75, badgeW - 1.5, badgeH - 1.5);
                ctx.fillStyle = damage >= game.hero.hp * 0.4 ? palette.hi : palette.lit;
                ctx.fillText(label, px + TILE_PX / 2, by + badgeH / 2 + 0.5);
              }
            }
          }
        }
      }
    }

    // 2. Dotted path preview
    if (previewPath && previewPath.length > 0) {
      let cx = game.x;
      let cy = game.y;
      ctx.fillStyle = palette.lit;
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

    // 3. Hero sprite + crisp tactical corner reticle so hero never gets lost
    const hx = game.x * TILE_PX;
    const hy = game.y * TILE_PX;
    const heroSprite = `hero_${game.dir}`;
    drawSprite(ctx, heroSprite, hx, hy + 2, TILE_PX, palette);
    ctx.fillStyle = palette.hi;
    ctx.fillRect(hx + 2, hy + 2, 8, 2);
    ctx.fillRect(hx + 2, hy + 2, 2, 8);
    ctx.fillRect(hx + TILE_PX - 10, hy + 2, 8, 2);
    ctx.fillRect(hx + TILE_PX - 4, hy + 2, 2, 8);
    ctx.fillRect(hx + 2, hy + TILE_PX - 4, 8, 2);
    ctx.fillRect(hx + 2, hy + TILE_PX - 10, 2, 8);
    ctx.fillRect(hx + TILE_PX - 10, hy + TILE_PX - 4, 8, 2);
    ctx.fillRect(hx + TILE_PX - 4, hy + TILE_PX - 10, 2, 8);

    // 4. Brief pixel combat slash flash
    if (game.lastCombat && Date.now() - game.lastCombat.tick < 240) {
      const sx = game.lastCombat.x * TILE_PX;
      const sy = game.lastCombat.y * TILE_PX;
      ctx.strokeStyle = palette.hi;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + 10);
      ctx.lineTo(sx + TILE_PX - 10, sy + TILE_PX - 10);
      ctx.moveTo(sx + TILE_PX - 10, sy + 10);
      ctx.lineTo(sx + 10, sy + TILE_PX - 10);
      ctx.stroke();
    }

    // 5. Hover reticle
    if (hoverTile && overlay === 'none') {
      ctx.strokeStyle = palette.hi;
      ctx.lineWidth = 3;
      ctx.strokeRect(hoverTile.x * TILE_PX + 1.5, hoverTile.y * TILE_PX + 1.5, TILE_PX - 3, TILE_PX - 3);
    }

    animFrameRef.current += 1;
  }, [game, animTick, hoverTile, previewPath, overlay, showMapTags]);

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

  // Live Tile Inspector data
  const inspected = useMemo(() => {
    if (!hoverTile) return null;
    const tile = getEffectiveTile(game, hoverTile.x, hoverTile.y);
    if (tile.type === 'monster') {
      const monster = MONSTERS[tile.monsterId];
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
        yellow: { name: '铜门 [Y]', desc: '消耗 1 把铜钥匙 [Y] 开启', sprite: 'door_yellow' },
        blue: { name: '银门 [B]', desc: '消耗 1 把银钥匙 [B] 开启', sprite: 'door_blue' },
        red: { name: '金门 [R]', desc: '消耗 1 把金钥匙 [R] 开启', sprite: 'door_red' },
        special: { name: '机关门', desc: '需要完成特定剧情或击败镇守开启', sprite: 'door_special' },
        crackedWall: { name: '裂纹暗墙', desc: '持有【破墙镐】时撞击即可击碎', sprite: 'cracked_wall' },
      };
      return { kind: 'door' as const, info: labels[tile.door] };
    }
    return null;
  }, [game, hoverTile]);

  const activeShopDef = game.activeShop ? SHOPS[game.activeShop] : null;
  const hasAnySave = Boolean(saves.auto || saves['slot-1'] || saves['slot-2'] || saves['slot-3']);
  const victoryRank = computeRank(game.hero.hp);

  return (
    <div className="mota-host" ref={hostRef} data-mota-floor={game.floor} data-mota-overlay={overlay}>
      {/* Compact top control bar */}
      <header className="mota-topbar">
        <div className="mota-floor-chip">
          <PixelIcon name="tower" size={16} />
          <strong className="mota-floor-name">{floorDef.name}</strong>
          <span className="mota-floor-meta">ACT {floorDef.act} · 步数 {game.steps}</span>
        </div>

        <div className="mota-topbar-actions">
          <button
            type="button"
            className="mota-pill-btn"
            data-synced="local"
            onClick={() => setOverlay((o) => (o === 'saves' ? 'none' : 'saves'))}
            title="管理本地浏览器存档"
          >
            <PixelIcon name="save" size={14} />
            <span>本地存档</span>
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

      {syncNotice && (
        <div className="mota-toast-bar" role="status">
          <span>{syncNotice}</span>
          <button type="button" className="mota-toast-close" onClick={() => setSyncNotice('')} aria-label="关闭提示">
            ×
          </button>
        </div>
      )}

      {/* Adaptive workspace: 3-col workstation on wide/maximized/fullscreen, 2-col standard, 1-col mobile */}
      <div className="mota-layout">
        {/* Center/Left: 11x11 Pixel CRT Dungeon Viewport */}
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

            {/* Title / Boot Screen Overlay */}
            {overlay === 'title' && (
              <div className="mota-modal mota-modal--title" role="dialog" aria-label="魔塔开始界面">
                <div className="mota-title-art">
                  <PixelPortrait sprite="demon_boss" size={44} />
                  <PixelPortrait sprite="hero_down" size={44} />
                  <PixelPortrait sprite="npc_fairy" size={44} />
                </div>
                <h1 className="mota-boot-title">MAGIC TOWER</h1>
                <p className="mota-boot-sub">魔塔 21F · 经典数值体系 · 荧光 CRT 版</p>
                <div className="mota-boot-actions">
                  {saves.auto && (
                    <ButtonBase variant="primary" type="button" onClick={() => handleLoadSlot('auto')}>
                      <PixelIcon name="play" size={16} />
                      <span>继续冒险 ({saves.auto.summary.floor}F)</span>
                    </ButtonBase>
                  )}
                  <ButtonBase
                    variant={saves.auto ? 'secondary' : 'primary'}
                    type="button"
                    onClick={handleNewGame}
                  >
                    <PixelIcon name="tower" size={16} />
                    <span>{saves.auto ? '重新开始' : '开始攀登'}</span>
                  </ButtonBase>
                  {hasAnySave && (
                    <ButtonBase variant="secondary" type="button" onClick={() => setOverlay('saves')}>
                      <PixelIcon name="save" size={16} />
                      <span>读取存档</span>
                    </ButtonBase>
                  )}
                </div>
                <p className="mota-boot-credit">
                  战斗伤害 / 临界值 / 怪物特效算法参考开源项目 ckcz123/mota-js (BSD-3-Clause)
                </p>
              </div>
            )}

            {/* NPC Dialogue Overlay */}
            {overlay === 'none' && game.dialogue && (
              <div className="mota-dialogue" role="dialog" aria-label={game.dialogue.speaker}>
                <div className="mota-dialogue-head">
                  <PixelPortrait sprite={game.dialogue.sprite} size={28} />
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

            {/* Active Shop Modal */}
            {overlay === 'none' && activeShopDef && (
              <div className="mota-modal" role="dialog" aria-label={activeShopDef.name}>
                <div className="mota-modal-head">
                  <div className="mota-modal-title">
                    <PixelPortrait sprite={activeShopDef.sprite} size={24} />
                    <strong>{activeShopDef.speaker}</strong>
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
                    const affordable = balance >= opt.cost;
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
                        <span className="mota-shop-cost">{opt.costText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monster Manual (B) */}
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
                      const lethal = !entry.canBeat;
                      return (
                        <div key={entry.monster.id} className="mota-book-row" data-lethal={lethal ? 'true' : undefined}>
                          <PixelPortrait sprite={entry.monster.sprite} size={28} />
                          <div className="mota-book-info">
                            <div className="mota-book-top">
                              <strong>
                                {entry.monster.name}
                                {entry.count > 1 ? ` ×${entry.count}` : ''}
                              </strong>
                              {entry.monster.special?.map((sp) => (
                                <span key={sp} className="mota-tag" title={SPECIAL_META[sp].desc}>
                                  {SPECIAL_META[sp].name}
                                </span>
                              ))}
                              <span className="mota-book-dmg" data-lethal={lethal ? 'true' : undefined}>
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

            {/* Floor Teleporter (F) */}
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

            {/* Quick Shop List (V) */}
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

            {/* Save / Load Manager (G) */}
            {overlay === 'saves' && (
              <div className="mota-modal" role="dialog" aria-label="本地存档管理">
                <div className="mota-modal-head">
                  <div className="mota-modal-title">
                    <PixelIcon name="save" size={16} />
                    <strong>存档管理 · 本地浏览器存储</strong>
                  </div>
                  <button type="button" className="mota-modal-close" onClick={() => setOverlay('none')} aria-label="关闭存档管理">
                    ×
                  </button>
                </div>

                <div className="mota-save-list">
                  {SAVE_SLOTS.map(({ id, label }) => {
                    const rec = saves[id];
                    return (
                      <div key={id} className="mota-save-row" data-slot={id}>
                        <div className="mota-save-meta">
                          <div className="mota-save-title">
                            <strong>{label}</strong>
                            {rec && <span className="mota-tag">本地</span>}
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
                              onClick={() => void handleDeleteSlot(id)}
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

            {/* Help & Credits Modal (H) */}
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
                    <div><dt>G</dt><dd>存档 / 读档与云端同步</dd></div>
                    <div><dt>T</dt><dd>开关地图标注（道具/钥匙/NPC/特殊怪角标）</dd></div>
                  </dl>
                  <div className="mota-help-section">
                    <h3>单色屏图例速查</h3>
                    <ul>
                      <li><strong>方框数字 / 反白「危」</strong>：怪物战损（左上角 <code>先/魔/固/连/吸</code> 为特效）。</li>
                      <li><strong>底部下划线文字</strong>：可拾取道具（<code>[Y]/[B]/[R]</code> 钥匙、尖晶 <code>攻+3</code>、盾晶 <code>防+3</code>、十字瓶 <code>+200/+500</code>）。</li>
                      <li><strong>右上角反白 <code>!</code> / <code>$</code></strong>：友好 NPC 对话 / 属性与钥匙商店。</li>
                    </ul>
                  </div>
                  <div className="mota-help-section">
                    <h3>特殊怪物机制</h3>
                    <ul>
                      <li><strong>先攻</strong>：怪物开局先攻击一次。</li>
                      <li><strong>魔攻</strong>：无视防御，靠堆攻击抢临界回合。</li>
                      <li><strong>坚固</strong>：怪物防御永远为「你的攻击-1」，需靠高防无伤防杀。</li>
                      <li><strong>吸血</strong>：战前按当前生命比例吸血，趁低血量时击杀更划算。</li>
                      <li><strong>2连击</strong>：怪物每回合攻击 2 次，优先提升防御。</li>
                    </ul>
                  </div>
                  <p className="mota-help-credit">
                    战斗公式、临界值算法与魔塔交互理念基于开源项目 <code>ckcz123/mota-js</code>（BSD-3-Clause），结合经典 21 层魔塔数值架构重制。
                  </p>
                </div>
              </div>
            )}

            {/* Victory Screen */}
            {overlay === 'victory' && (
              <div className="mota-modal mota-modal--victory" role="dialog" aria-label="魔塔通关">
                <div className="mota-title-art">
                  <PixelPortrait sprite="hero_down" size={44} />
                  <PixelPortrait sprite="npc_princess" size={44} />
                </div>
                <h2 className="mota-boot-title">VICTORY · {victoryRank.grade}</h2>
                <p className="mota-boot-sub">{victoryRank.note}</p>
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
                  <ButtonBase variant="secondary" type="button" onClick={handleNewGame}>
                    挑战更高分
                  </ButtonBase>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Optional screen D-Pad (toggled from topbar when needed) */}
          {showDpad && (
            <div className="mota-dpad" role="group" aria-label="方向控制">
              <button type="button" className="mota-dpad-btn mota-dpad-up" onClick={() => handleManualMove('up')} aria-label="向上">▲</button>
              <button type="button" className="mota-dpad-btn mota-dpad-left" onClick={() => handleManualMove('left')} aria-label="向左">◀</button>
              <button type="button" className="mota-dpad-btn mota-dpad-down" onClick={() => handleManualMove('down')} aria-label="向下">▼</button>
              <button type="button" className="mota-dpad-btn mota-dpad-right" onClick={() => handleManualMove('right')} aria-label="向右">▶</button>
            </div>
          )}
        </div>

        {/* Hero Status + Keys + Relics + Action Keys */}
        <aside className="mota-hud" aria-label="勇者状态与操作">
          {/* Core stats grid */}
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

          {/* Keys & Relics */}
          <section className="mota-panel">
            <div className="mota-keys-row" aria-label="钥匙数量">
              <div className="mota-key-item" title="铜钥匙 [Y]">
                <PixelPortrait sprite="key_yellow" size={16} />
                <span>铜[Y]</span>
                <strong>{game.hero.yellowKeys}</strong>
              </div>
              <div className="mota-key-item" title="银钥匙 [B]">
                <PixelPortrait sprite="key_blue" size={16} />
                <span>银[B]</span>
                <strong>{game.hero.blueKeys}</strong>
              </div>
              <div className="mota-key-item" title="金钥匙 [R]">
                <PixelPortrait sprite="key_red" size={16} />
                <span>金[R]</span>
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

          {/* Action Keys */}
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
              onClick={handleNewGame}
            >
              <PixelIcon name="tower" size={14} />
              <span>重开</span>
            </ButtonBase>
          </section>

          <section className="mota-panel mota-hud-foot" aria-label="快捷操作提示">
            <div className="mota-hud-foot-row">
              <span>已达最高层</span>
              <strong>{game.maxFloor}F / 21F</strong>
            </div>
            <div className="mota-hud-foot-row">
              <span>击败怪物</span>
              <strong>{game.battlesWon}</strong>
            </div>
            <p className="mota-hud-foot-keys">
              WASD / 点击地图自动寻路 · B 手册 · F 楼传 · V 商店 · Z 撤回 · G 存档 · T 标注
            </p>
          </section>
        </aside>

        {/* Intel Column: Live Floor Monster Radar (wide 3-col) + Hover Inspector / Adventure Log */}
        <aside className="mota-intel" aria-label="本层怪物与情报">
          <section className="mota-panel mota-radar">
            <div className="mota-radar-head">
              <PixelIcon name="book" size={14} />
              <strong>{game.relics.book ? `本层怪物 (${floorMonsters.length})` : '单色图例速查'}</strong>
            </div>

            {!game.relics.book ? (
              <ul className="mota-radar-legend">
                <li><strong>[Y] / [B] / [R]</strong>：铜 / 银 / 金钥匙与对应门</li>
                <li><strong>尖晶 / 盾晶</strong>：攻+3 / 防+3 永久强化</li>
                <li><strong>十字瓶</strong>：小瓶 +200 / 大壶 +500 HP</li>
                <li><strong>! / $</strong>：友好 NPC 对话 / 属性商店</li>
                <li className="mota-radar-hint">登上 1F 拾取【怪物手册】后，此处将实时显示本层所有怪物战损与临界值。</li>
              </ul>
            ) : floorMonsters.length === 0 ? (
              <p className="mota-radar-empty">本层怪物已全部肃清。</p>
            ) : (
              <div className="mota-radar-list">
                {floorMonsters.map((entry) => {
                  const eff = getEffectiveEnemyStats(entry.monster, game.hero);
                  const lethal = !entry.canBeat;
                  return (
                    <div
                      key={entry.monster.id}
                      className="mota-radar-row"
                      data-lethal={lethal ? 'true' : undefined}
                    >
                      <PixelPortrait sprite={entry.monster.sprite} size={24} />
                      <div className="mota-radar-info">
                        <div className="mota-radar-top">
                          <strong>{entry.monster.name}</strong>
                          <span className="mota-radar-count">×{entry.count}</span>
                          <span className="mota-radar-dmg" data-lethal={lethal ? 'true' : undefined}>
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

          {/* Live Tile Inspector OR Event Log */}
          <section className="mota-panel mota-inspector" aria-live="polite">
            {inspected?.kind === 'monster' ? (
              <div className="mota-inspect-monster">
                <div className="mota-inspect-head">
                  <PixelPortrait sprite={inspected.monster.sprite} size={28} />
                  <div>
                    <strong>{inspected.monster.name}</strong>
                    <div className="mota-inspect-tags">
                      {inspected.monster.special?.map((sp) => (
                        <span key={sp} className="mota-tag">{SPECIAL_META[sp].name}</span>
                      ))}
                    </div>
                  </div>
                  <span
                    className="mota-inspect-dmg"
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
                <PixelPortrait sprite={inspected.item.sprite} size={26} />
                <div>
                  <strong>{inspected.item.name}</strong>
                  <p>{inspected.item.shortDesc}</p>
                </div>
              </div>
            ) : inspected?.kind === 'npc' ? (
              <div className="mota-inspect-simple">
                <PixelPortrait sprite={inspected.npc.sprite} size={26} />
                <div>
                  <strong>{inspected.npc.name}</strong>
                  <p>{inspected.npc.hint}</p>
                </div>
              </div>
            ) : inspected?.kind === 'shop' ? (
              <div className="mota-inspect-simple">
                <PixelPortrait sprite={inspected.shop.sprite} size={26} />
                <div>
                  <strong>{inspected.shop.name}</strong>
                  <p>{inspected.shop.greeting}</p>
                </div>
              </div>
            ) : inspected?.kind === 'door' ? (
              <div className="mota-inspect-simple">
                <PixelPortrait sprite={inspected.info.sprite} size={26} />
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
