export type Direction = 'up' | 'down' | 'left' | 'right';

export type Difficulty = 'standard' | 'hard';

export type ColorMode = 'hybrid' | 'color';

/**
 * Monster special abilities modeled after ckcz123/mota-js (BSD-3-Clause).
 */
export type MonsterSpecial =
  | 'firstStrike' // 先攻: monster hits once before hero's first strike
  | 'magic'       // 魔攻: ignores hero's DEF completely
  | 'solid'       // 坚固: monster DEF is at least hero ATK - 1
  | 'doubleHit'   // 2连击: monster hits twice per round
  | 'tripleHit'   // 3连击: monster hits 3 times per round
  | 'vampire'     // 吸血: drains a fraction of hero's current HP before battle
  | 'armorBreak'  // 破甲: ignores a fraction of hero's DEF (default 40%)
  | 'berserk'     // 狂暴: monster ATK escalates each round (default +12%/round)
  | 'thorns';     // 反伤: reflects a fraction of monster ATK as true damage on each non-lethal hit

export interface MonsterDef {
  id: string;
  name: string;
  title: string;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  exp: number;
  special?: ReadonlyArray<MonsterSpecial>;
  vampireRatio?: number;
  armorBreakRatio?: number;
  berserkRate?: number;
  thornsRatio?: number;
  sprite: string;
  tier: 1 | 2 | 3 | 4;
}

export type ItemId =
  | 'yellowKey'
  | 'blueKey'
  | 'redKey'
  | 'keyBox'
  | 'redGem'
  | 'blueGem'
  | 'bigRedGem'
  | 'bigBlueGem'
  | 'redPotion'
  | 'bluePotion'
  | 'holyWater'
  | 'sword1'
  | 'shield1'
  | 'sword2'
  | 'shield2'
  | 'sword3'
  | 'shield3'
  | 'sword4'
  | 'shield4'
  | 'sword5'
  | 'shield5'
  | 'book'
  | 'fly'
  | 'cross'
  | 'pickaxe'
  | 'coin'
  | 'goldBag'
  | 'featherSmall'
  | 'featherBig';

export interface ItemDef {
  id: ItemId;
  name: string;
  shortDesc: string;
  mapTag: string;
  sprite: string;
  kind: 'key' | 'gem' | 'potion' | 'equip' | 'relic' | 'treasure';
}

export type DoorKind = 'yellow' | 'blue' | 'red' | 'special' | 'crackedWall';

export type ShopId =
  | 'shop3f'
  | 'exp5f'
  | 'key5f'
  | 'shop11f'
  | 'sell12f'
  | 'exp13f';

export interface ShopOption {
  id: string;
  label: string;
  costText: string;
  currency: 'gold' | 'exp' | 'yellowKey' | 'blueKey' | 'redKey';
  cost: number;
  /** Optional per-purchase price escalation (classic 50F / mota4 style). */
  costStep?: number;
  effect: {
    hp?: number;
    atk?: number;
    def?: number;
    lv?: number;
    gold?: number;
    yellowKey?: number;
    blueKey?: number;
    redKey?: number;
  };
}

export interface ShopDef {
  id: ShopId;
  floor: number;
  name: string;
  speaker: string;
  sprite: string;
  greeting: string;
  escalating?: boolean;
  options: ReadonlyArray<ShopOption>;
}

export type NpcId =
  | 'fairy0f'
  | 'sage1f'
  | 'blacksmith2f'
  | 'armorer2f'
  | 'thief4f'
  | 'guide7f'
  | 'guide10f'
  | 'sage15fAtk'
  | 'sage15fDef'
  | 'decoy18f'
  | 'warning20f'
  | 'princess21f';

export type TileKind =
  | { type: 'floor' }
  | { type: 'wall' }
  | { type: 'lava' }
  | { type: 'stairsUp' }
  | { type: 'stairsDown' }
  | { type: 'door'; door: DoorKind; lockedReason?: string }
  | { type: 'item'; itemId: ItemId }
  | { type: 'monster'; monsterId: string }
  | { type: 'npc'; npcId: NpcId }
  | { type: 'shop'; shopId: ShopId };

export interface FloorDef {
  floor: number;
  name: string;
  act: 1 | 2 | 3 | 4;
  grid: ReadonlyArray<ReadonlyArray<TileKind>>;
  /** Spawn point when arriving from floor - 1 (going up). */
  fromBelow: { x: number; y: number; dir?: Direction };
  /** Spawn point when arriving from floor + 1 (going down). */
  fromAbove?: { x: number; y: number; dir?: Direction };
  /** Whether floor teleporter can jump away from / into this floor. */
  canFly?: boolean;
}

export interface HeroStats {
  lv: number;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  exp: number;
  yellowKeys: number;
  blueKeys: number;
  redKeys: number;
  weaponName: string;
  shieldName: string;
}

export interface HeroRelics {
  book: boolean;
  fly: boolean;
  cross: boolean;
  pickaxe: boolean;
  coin: boolean;
}

export interface DialogueState {
  speaker: string;
  sprite: string;
  lines: ReadonlyArray<string>;
  index: number;
  choice?: {
    prompt: string;
    confirmLabel: string;
    cancelLabel: string;
    actionId: 'sage15fAtk' | 'sage15fDef';
  };
}

export interface GameFlags {
  gate0fOpened: boolean;
  crossDelivered: boolean;
  thiefHelped2f: boolean;
  thiefHelped18f: boolean;
  blacksmithRewarded: boolean;
  armorerRewarded: boolean;
  sage15fAtkBought: boolean;
  sage15fDefBought: boolean;
  decoy18fRevealed: boolean;
  boss21fDefeated: boolean;
  victory: boolean;
  discoveredShops: ShopId[];
}

export interface GameState {
  difficulty: Difficulty;
  floor: number;
  maxFloor: number;
  visitedFloors: number[];
  hero: HeroStats;
  relics: HeroRelics;
  x: number;
  y: number;
  dir: Direction;
  steps: number;
  battlesWon: number;
  playSeconds: number;
  /** Purchase counts per escalating shop. */
  shopPurchases: Partial<Record<ShopId, number>>;
  /** Cleared tile keys per floor ("x,y") — removed monsters, picked items, opened doors. */
  cleared: Record<number, string[]>;
  flags: GameFlags;
  log: string[];
  dialogue: DialogueState | null;
  activeShop: ShopId | null;
  lastCombat: {
    monsterId: string;
    monsterName: string;
    damage: number;
    gold: number;
    exp: number;
    x: number;
    y: number;
    tick: number;
  } | null;
}

export interface DamageInfo {
  monHp: number;
  monAtk: number;
  monDef: number;
  initDamage: number;
  perDamage: number;
  heroPerDamage: number;
  turns: number;
  damage: number;
}

export interface CriticalInfo {
  atkNeeded: number;
  damageReduced: number;
}

export type SaveSlotId = 'auto' | 'slot-1' | 'slot-2' | 'slot-3';

export interface SerializedSavePayload {
  v: 1;
  difficulty?: Difficulty;
  floor: number;
  maxFloor: number;
  visitedFloors: number[];
  hero: HeroStats;
  relics: HeroRelics;
  x: number;
  y: number;
  dir: Direction;
  steps: number;
  battlesWon: number;
  playSeconds: number;
  shopPurchases?: Partial<Record<ShopId, number>>;
  cleared: Record<string, string[]>;
  flags: GameFlags;
}

export interface SaveSlotSummary {
  floor: number;
  floorName: string;
  lv: number;
  hp: number;
  atk: number;
  def: number;
  steps: number;
  victory: boolean;
  difficulty?: Difficulty;
}

export interface StoredSaveRecord {
  slot: SaveSlotId;
  summary: SaveSlotSummary;
  payload: SerializedSavePayload;
  updatedAt: string;
  source: 'local' | 'cloud';
}
