import { SPECIAL_META, canBeatMonster, getDamageInfo, getDefDamageReduction, getNextCritical } from './combat';
import {
  DIFFICULTY_META,
  ITEMS,
  SHOPS,
  formatShopCostText,
  getMonsterDef,
  getShopOptionCost,
} from './data';
import { FLOORS, MAP_SIZE } from './floors';
import type {
  CriticalInfo,
  DamageInfo,
  DialogueState,
  Difficulty,
  Direction,
  FloorDef,
  GameState,
  ItemId,
  MonsterDef,
  NpcId,
  SaveSlotSummary,
  SerializedSavePayload,
  ShopId,
  TileKind,
} from './types';

export type SoundCue =
  | 'step'
  | 'item'
  | 'gem'
  | 'potion'
  | 'door'
  | 'hit'
  | 'stairs'
  | 'shop'
  | 'error'
  | 'victory'
  | 'talk';

export interface StepOutcome {
  state: GameState;
  changed: boolean;
  /** True when the state changed in a meaningful way suitable for creating an undo checkpoint. */
  checkpoint: boolean;
  sound?: SoundCue;
}

const DIR_DELTA: Readonly<Record<Direction, { dx: number; dy: number }>> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function getFloorDef(floor: number): FloorDef {
  return FLOORS[floor] ?? FLOORS[0];
}

export function createInitialState(difficulty: Difficulty = 'standard'): GameState {
  const start = FLOORS[0].fromBelow;
  const meta = DIFFICULTY_META[difficulty];
  return {
    difficulty,
    floor: 0,
    maxFloor: 0,
    visitedFloors: [0],
    hero: {
      lv: 1,
      hp: meta.initHp,
      atk: 10,
      def: 10,
      gold: 0,
      exp: 0,
      yellowKeys: 0,
      blueKeys: 0,
      redKeys: 0,
      weaponName: '空手',
      shieldName: '无盾',
    },
    relics: {
      book: false,
      fly: false,
      cross: false,
      pickaxe: false,
      coin: false,
    },
    x: start.x,
    y: start.y,
    dir: start.dir ?? 'up',
    steps: 0,
    battlesWon: 0,
    playSeconds: 0,
    shopPurchases: {},
    cleared: {},
    flags: {
      gate0fOpened: false,
      crossDelivered: false,
      thiefHelped2f: false,
      thiefHelped18f: false,
      blacksmithRewarded: false,
      armorerRewarded: false,
      sage15fAtkBought: false,
      sage15fDefBought: false,
      decoy18fRevealed: false,
      boss21fDefeated: false,
      victory: false,
      discoveredShops: [],
    },
    log: [
      `[${meta.label}] 抵达魔塔入口，请与左侧守塔仙子对话开启塔门。`,
    ],
    dialogue: null,
    activeShop: null,
    lastCombat: null,
  };
}

export function cloneState(state: GameState): GameState {
  const cleared: Record<number, string[]> = {};
  for (const [k, list] of Object.entries(state.cleared)) {
    cleared[Number(k)] = [...list];
  }
  return {
    ...state,
    visitedFloors: [...state.visitedFloors],
    hero: { ...state.hero },
    relics: { ...state.relics },
    shopPurchases: { ...state.shopPurchases },
    cleared,
    flags: {
      ...state.flags,
      discoveredShops: [...state.flags.discoveredShops],
    },
    log: [...state.log],
    dialogue: state.dialogue ? { ...state.dialogue, lines: [...state.dialogue.lines] } : null,
    lastCombat: state.lastCombat ? { ...state.lastCombat } : null,
  };
}

function appendLog(log: string[], line: string): string[] {
  const next = [...log, line];
  return next.length > 30 ? next.slice(next.length - 30) : next;
}

export function isCleared(state: GameState, floor: number, x: number, y: number): boolean {
  const list = state.cleared[floor];
  if (!list) return false;
  return list.includes(tileKey(x, y));
}

function markCleared(cleared: Record<number, string[]>, floor: number, x: number, y: number): void {
  const key = tileKey(x, y);
  const existing = cleared[floor] ?? [];
  if (!existing.includes(key)) {
    cleared[floor] = [...existing, key];
  }
}

export function getTileAt(state: GameState, x: number, y: number, floor = state.floor): TileKind {
  if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return { type: 'wall' };
  if (isCleared(state, floor, x, y)) return { type: 'floor' };
  const def = getFloorDef(floor);
  return def.grid[y][x];
}

function isSpecialDoorOpen(state: GameState, floor: number, x: number, y: number): boolean {
  if (floor === 0 && x === 5 && y === 7) return state.flags.gate0fOpened;
  if (floor === 2 && x === 1 && y === 8) return state.flags.thiefHelped2f;
  if (floor === 18 && x === 5 && y === 5) return state.flags.thiefHelped18f;
  if (floor === 18 && x === 9 && y === 7) return state.flags.decoy18fRevealed;
  if (floor === 21 && x === 5 && y === 2) return state.flags.boss21fDefeated;
  return false;
}

export function getEffectiveTile(state: GameState, x: number, y: number, floor = state.floor): TileKind {
  const raw = getTileAt(state, x, y, floor);
  if (raw.type === 'door' && raw.door === 'special' && isSpecialDoorOpen(state, floor, x, y)) {
    return { type: 'floor' };
  }
  return raw;
}

const WEAPON_TIER: Readonly<Record<string, number>> = {
  '空手': 0,
  '铁剑': 1,
  '银剑': 2,
  '骑士剑': 3,
  '圣剑': 4,
  '神圣剑': 5,
};

const SHIELD_TIER: Readonly<Record<string, number>> = {
  '无盾': 0,
  '铁盾': 1,
  '银盾': 2,
  '骑士盾': 3,
  '圣盾': 4,
  '神圣盾': 5,
};

function equipWeaponIfStronger(hero: GameState['hero'], name: string): void {
  if ((WEAPON_TIER[name] ?? 0) > (WEAPON_TIER[hero.weaponName] ?? 0)) {
    hero.weaponName = name;
  }
}

function equipShieldIfStronger(hero: GameState['hero'], name: string): void {
  if ((SHIELD_TIER[name] ?? 0) > (SHIELD_TIER[hero.shieldName] ?? 0)) {
    hero.shieldName = name;
  }
}

function applyItemPickup(next: GameState, itemId: ItemId): { log: string; sound: SoundCue } {
  const item = ITEMS[itemId];
  switch (itemId) {
    case 'yellowKey':
      next.hero.yellowKeys += 1;
      return { log: `获得${item.name} ×1`, sound: 'item' };
    case 'blueKey':
      next.hero.blueKeys += 1;
      return { log: `获得${item.name} ×1`, sound: 'item' };
    case 'redKey':
      next.hero.redKeys += 1;
      return { log: `获得${item.name} ×1`, sound: 'item' };
    case 'keyBox':
      next.hero.yellowKeys += 1;
      next.hero.blueKeys += 1;
      next.hero.redKeys += 1;
      return { log: '获得三色钥匙盒：[Y]黄/[B]蓝/[R]红钥匙各 +1', sound: 'item' };
    case 'redGem':
      next.hero.atk += 3;
      return { log: '拾取红攻晶石：攻击 +3', sound: 'gem' };
    case 'blueGem':
      next.hero.def += 3;
      return { log: '拾取蓝防晶石：防御 +3', sound: 'gem' };
    case 'bigRedGem':
      next.hero.atk += 8;
      return { log: '拾取高阶红晶：攻击 +8', sound: 'gem' };
    case 'bigBlueGem':
      next.hero.def += 8;
      return { log: '拾取高阶蓝晶：防御 +8', sound: 'gem' };
    case 'redPotion':
      next.hero.hp += 200;
      return { log: '饮用小回血瓶：生命 +200', sound: 'potion' };
    case 'bluePotion':
      next.hero.hp += 500;
      return { log: '饮用大回血壶：生命 +500', sound: 'potion' };
    case 'holyWater':
      next.hero.hp = Math.min(999999, next.hero.hp * 2);
      return { log: `饮用圣水：生命翻倍至 ${next.hero.hp}！`, sound: 'potion' };
    case 'sword1':
      next.hero.atk += 10;
      equipWeaponIfStronger(next.hero, item.name);
      return { log: '装备铁剑：攻击 +10', sound: 'gem' };
    case 'shield1':
      next.hero.def += 10;
      equipShieldIfStronger(next.hero, item.name);
      return { log: '装备铁盾：防御 +10', sound: 'gem' };
    case 'sword2':
      next.hero.atk += 25;
      equipWeaponIfStronger(next.hero, item.name);
      return { log: '装备银剑：攻击 +25', sound: 'gem' };
    case 'shield2':
      next.hero.def += 25;
      equipShieldIfStronger(next.hero, item.name);
      return { log: '装备银盾：防御 +25', sound: 'gem' };
    case 'sword3':
      next.hero.atk += 50;
      equipWeaponIfStronger(next.hero, item.name);
      return { log: '装备骑士剑：攻击 +50', sound: 'gem' };
    case 'shield3':
      next.hero.def += 50;
      equipShieldIfStronger(next.hero, item.name);
      return { log: '装备骑士盾：防御 +50', sound: 'gem' };
    case 'sword4':
      next.hero.atk += 85;
      equipWeaponIfStronger(next.hero, item.name);
      return { log: '装备圣剑：攻击 +85', sound: 'gem' };
    case 'shield4':
      next.hero.def += 85;
      equipShieldIfStronger(next.hero, item.name);
      return { log: '装备圣盾：防御 +85', sound: 'gem' };
    case 'sword5':
      next.hero.atk += 130;
      equipWeaponIfStronger(next.hero, item.name);
      return { log: '装备神圣剑：攻击 +130', sound: 'gem' };
    case 'shield5':
      next.hero.def += 130;
      equipShieldIfStronger(next.hero, item.name);
      return { log: '装备神圣盾：防御 +130', sound: 'gem' };
    case 'book':
      next.relics.book = true;
      return { log: '获得【怪物手册】：已解锁地图显伤与临界图鉴 (按 B 查看)', sound: 'gem' };
    case 'fly':
      next.relics.fly = true;
      return { log: '获得【楼层传送器】：可自由飞往已到达的楼层 (按 F 传送)', sound: 'gem' };
    case 'cross':
      next.relics.cross = true;
      return { log: '获得【圣光十字架】：留到后期再交给 0F 守塔仙子，百分比增幅最惊人！', sound: 'gem' };
    case 'pickaxe':
      next.relics.pickaxe = true;
      return { log: '获得【破墙镐】：可击碎 10F 裂纹暗墙，交给 4F 杰克可开 18F 密门', sound: 'gem' };
    case 'coin':
      next.relics.coin = true;
      return { log: '获得【幸运金币】：此后击杀怪物获得双倍金币！', sound: 'gem' };
    case 'goldBag':
      next.hero.gold += 300;
      return { log: '拾取钱袋：金币 +300', sound: 'item' };
    case 'featherSmall':
      next.hero.lv += 1;
      next.hero.hp += 600;
      next.hero.atk += 6;
      next.hero.def += 6;
      return { log: '获得小飞羽：等级 +1 (HP+600 攻+6 防+6)', sound: 'gem' };
    case 'featherBig':
      next.hero.lv += 3;
      next.hero.hp += 1600;
      next.hero.atk += 16;
      next.hero.def += 16;
      return { log: '获得大飞羽：等级 +3 (HP+1600 攻+16 防+16)', sound: 'gem' };
  }
}

function handleNpcInteraction(next: GameState, npcId: NpcId): StepOutcome {
  const showDialogue = (dialogue: DialogueState, logLine?: string, sound: SoundCue = 'talk'): StepOutcome => {
    next.dialogue = dialogue;
    if (logLine) next.log = appendLog(next.log, logLine);
    return { state: next, changed: true, checkpoint: Boolean(logLine), sound };
  };

  const diffMeta = DIFFICULTY_META[next.difficulty];
  const crossPct = next.difficulty === 'hard' ? '28%' : '33%';

  switch (npcId) {
    case 'fairy0f': {
      if (!next.flags.gate0fOpened) {
        next.flags.gate0fOpened = true;
        next.hero.yellowKeys += 1;
        next.hero.blueKeys += 1;
        next.hero.redKeys += 1;
        return showDialogue(
          {
            speaker: '守塔仙子 (0F)',
            sprite: 'npc_fairy',
            lines: [
              `冒险者，这座 21 层魔塔（${diffMeta.label}）每层机关格局迥异，钥匙与商店均已紧平衡设计。`,
              '我为你打开塔门，并赠你 [Y]黄、[B]蓝、[R]红钥匙各一把——每扇门都请三思再开。',
              '1F 入口处放着【怪物手册】，拾取后即可查看每位怪物的战损分级与攻击临界值。',
              `若你在 7F 找回【圣光十字架】，切记留到 20F 决战前再交给我，全属性 +${crossPct} 的增幅才能最大化！`,
            ],
            index: 0,
          },
          '守塔仙子开启了 0F 塔门，并赠送 [Y]/[B]/[R] 钥匙各 1 把。',
          'door',
        );
      }
      if (next.relics.cross && !next.flags.crossDelivered) {
        next.flags.crossDelivered = true;
        const hpGain = Math.floor(next.hero.hp * diffMeta.crossRatio);
        const atkGain = Math.floor(next.hero.atk * diffMeta.crossRatio);
        const defGain = Math.floor(next.hero.def * diffMeta.crossRatio);
        next.hero.hp += hpGain;
        next.hero.atk += atkGain;
        next.hero.def += defGain;
        return showDialogue(
          {
            speaker: '守塔仙子 (0F)',
            sprite: 'npc_fairy',
            lines: [
              '你真的找回了圣光十字架！以圣光为誓，我将你的力量全面升华！',
              `生命 +${hpGain}，攻击 +${atkGain}，防御 +${defGain}（全属性提升 ${crossPct}）。`,
              '带着这份力量直冲塔顶王座吧！',
            ],
            index: 0,
          },
          `献上圣光十字架：HP+${hpGain} 攻+${atkGain} 防+${defGain}！`,
          'victory',
        );
      }
      if (next.flags.victory) {
        return showDialogue({
          speaker: '守塔仙子 (0F)',
          sprite: 'npc_fairy',
          lines: ['塔顶的阴霾已经驱散，感谢你，勇者！'],
          index: 0,
        });
      }
      return showDialogue({
        speaker: '守塔仙子 (0F)',
        sprite: 'npc_fairy',
        lines: [
          next.flags.crossDelivered
            ? '圣光已与你同在，随时可用快捷键 G 存档、Z 撤回、C 切换色彩风格。祝你登顶成功！'
            : `找到 7F 的【圣光十字架】后再回来找我吧。越晚提交（如 20F 决战前），+${crossPct} 收益越高！`,
        ],
        index: 0,
      });
    }

    case 'sage1f':
      return showDialogue({
        speaker: '引路老人 (1F)',
        sprite: 'npc_sage',
        lines: [
          '先拿走正前方的【怪物手册】吧！按 B 键可随时打开当前楼层的怪物图鉴。',
          '3F 与 11F 祭坛每次购买都会涨价，前期切忌把金币全部花光；多余钥匙可在 12F 卖出换钱！',
          '走错步或开错门也别慌，按 Z 键可随时撤回上一步，按 C 键可切换荧光彩标 / 全彩复古风格。',
        ],
        index: 0,
      });

    case 'blacksmith2f':
      if (!next.flags.blacksmithRewarded) {
        next.flags.blacksmithRewarded = true;
        next.hero.atk += 15;
        return showDialogue(
          {
            speaker: '铁匠大师 (2F)',
            sprite: 'npc_sage',
            lines: ['多亏你与杰克打开了牢门！这把秘锻钢刃送给你，攻击力 +15！'],
            index: 0,
          },
          '铁匠大师赠予钢刃：攻击 +15！',
          'gem',
        );
      }
      return showDialogue({
        speaker: '铁匠大师 (2F)',
        sprite: 'npc_sage',
        lines: ['遇到 6F【坚固】石头怪时，堆攻击没用，提升防御力就能大幅减伤甚至无伤防杀！'],
        index: 0,
      });

    case 'armorer2f':
      if (!next.flags.armorerRewarded) {
        next.flags.armorerRewarded = true;
        next.hero.def += 15;
        return showDialogue(
          {
            speaker: '护甲匠 (2F)',
            sprite: 'npc_merchant',
            lines: ['终于重见天日！这面精钢轻盾请收下，防御力 +15！'],
            index: 0,
          },
          '护甲匠赠予轻盾：防御 +15！',
          'gem',
        );
      }
      return showDialogue({
        speaker: '护甲匠 (2F)',
        sprite: 'npc_merchant',
        lines: ['全塔仅在 15F 有一瓶【圣水】可将当前生命翻倍，务必留到决战前高血量时饮用！'],
        index: 0,
      });

    case 'thief4f':
      if (!next.flags.thiefHelped2f) {
        next.flags.thiefHelped2f = true;
        return showDialogue(
          {
            speaker: '盗贼杰克 (4F)',
            sprite: 'npc_thief',
            lines: [
              '谢天谢地！我叫杰克，擅长开各种机关暗门。',
              '作为报答，我已经顺手帮你撬开了 2F 左下角的囚室机关门，里面的匠人会送你攻防装备！',
              '另外，如果你在 10F 找到我弄丢的【破墙镐】，带回来给我，我还能帮你打开 18F 的密室大门！',
            ],
            index: 0,
          },
          '盗贼杰克撬开了 2F 囚室机关门！',
          'door',
        );
      }
      if (next.relics.pickaxe && !next.flags.thiefHelped18f) {
        next.flags.thiefHelped18f = true;
        return showDialogue(
          {
            speaker: '盗贼杰克 (4F)',
            sprite: 'npc_thief',
            lines: [
              '哈哈，你真的把【破墙镐】找回来了！',
              '说话算话——我已经帮你解开了 18F 镜像密室中央的机关封印，现在可以直接通往 19F 以上了！',
            ],
            index: 0,
          },
          '盗贼杰克解开了 18F 密室机关门！',
          'door',
        );
      }
      return showDialogue({
        speaker: '盗贼杰克 (4F)',
        sprite: 'npc_thief',
        lines: [
          next.flags.thiefHelped18f
            ? '18F 密室门已经为你打开，祝你早日击败顶层暗影大魔王！'
            : '2F 左下角的囚室已经开了。如果找到了 10F 的【破墙镐】，记得回来找我！',
        ],
        index: 0,
      });

    case 'guide7f':
      return showDialogue({
        speaker: '守望学者 (7F)',
        sprite: 'npc_sage',
        lines: [
          '本塔共 21 层分 4 大试炼区：1–5F(骷髅队长)、6–10F(重甲铁骑)、11–16F(炎魔领主)、17–21F(暗影大魔王)。',
          '北端左右蓝门内藏着【楼层传送器】与【圣光十字架】。拿到楼传后按 F 键即可随时飞回低层清怪与逛商店！',
          `切记：把【圣光十字架】留到 20F 消费完金币与经验后再交 0F 仙子，+${crossPct} 的倍率收益远超前期！`,
        ],
        index: 0,
      });

    case 'guide10f':
      return showDialogue({
        speaker: '老兵向导 (10F)',
        sprite: 'npc_sage',
        lines: [
          '高层 9 大战术词条应对口诀：',
          '【魔攻/狂暴/反伤】怕高攻速杀与临界点；【坚固/先攻/2连/3连】极吃高防防杀；【破甲】无视部分防御需攻防兼修；【吸血】趁残血击杀最省血！',
          '西北角有【破墙镐】，拿到后既可敲碎西侧裂纹墙拿高阶双晶，也能回去找 4F 杰克解锁 18F 密室。',
        ],
        index: 0,
      });

    case 'sage15fAtk':
      if (next.flags.sage15fAtkBought) {
        return showDialogue({
          speaker: '剑道宗师 (15F)',
          sprite: 'npc_sage',
          lines: ['剑意已倾囊相授，用它斩破 16F 炎魔领主吧！'],
          index: 0,
        });
      }
      return showDialogue({
        speaker: '剑道宗师 (15F)',
        sprite: 'npc_sage',
        lines: ['我可以传授你终极剑术（攻击 +90），但需要 500 点经验值作为代价。'],
        index: 0,
        choice: {
          prompt: '消耗 500 经验换取攻击 +90？',
          confirmLabel: '支付 500 经验 (+90 攻)',
          cancelLabel: '暂不交换',
          actionId: 'sage15fAtk',
        },
      });

    case 'sage15fDef':
      if (next.flags.sage15fDefBought) {
        return showDialogue({
          speaker: '铁壁商神 (15F)',
          sprite: 'npc_merchant',
          lines: ['不动如山，记得统筹好东北角唯一一瓶【圣水】与 12F【幸运金币】！'],
          index: 0,
        });
      }
      return showDialogue({
        speaker: '铁壁商神 (15F)',
        sprite: 'npc_merchant',
        lines: ['我手里有一套秘传龙鳞护甲（防御 +90），只需 500 金币即可成交。'],
        index: 0,
        choice: {
          prompt: '消耗 500 金币换取防御 +90？',
          confirmLabel: '支付 500 金币 (+90 防)',
          cancelLabel: '暂不购买',
          actionId: 'sage15fDef',
        },
      });

    case 'decoy18f':
      if (!next.flags.decoy18fRevealed) {
        next.flags.decoy18fRevealed = true;
        return showDialogue(
          {
            speaker: '幻影替身 (18F)',
            sprite: 'npc_princess',
            lines: [
              '「哈哈哈……你以为这就救到人了吗？」',
              '「真正的守望者被暗影大魔王锁在 21F 塔顶王座！东南角通往 19F 的封印已为你敞开，有胆量就上来吧！」',
            ],
            index: 0,
          },
          '揭穿 18F 幻影：通往 19F 的楼梯封印已解除！',
          'door',
        );
      }
      return showDialogue({
        speaker: '幻影替身 (18F)',
        sprite: 'npc_princess',
        lines: ['东南角的楼梯已经解锁，暗影大魔王就在 21F 等你！'],
        index: 0,
      });

    case 'warning20f': {
      const fb = getMonsterDef('finalBoss', next.difficulty)!;
      const spText = fb.special?.length
        ? ` · 特技【${fb.special.map((s) => SPECIAL_META[s].name).join(' / ')}】`
        : '';
      return showDialogue({
        speaker: '塔顶信使 (20F)',
        sprite: 'npc_sage',
        lines: [
          `楼上就是 21F 最终王座！暗影大魔王（${diffMeta.label}）拥有 ${fb.hp} 生命、${fb.atk} 攻击、${fb.def} 防御${spText}。`,
          '终战最佳顺序：先去 12F 卖掉所有多余钥匙 → 用快捷商店 (V) 对比 3F/11F/5F/13F 把金币经验花光 → 飞 0F 交十字架 → 最后飞 15F 喝圣水翻倍！',
          '强烈建议现在按 G 键存个档！',
        ],
        index: 0,
      });
    }

    case 'princess21f':
      if (!next.flags.victory) {
        next.flags.victory = true;
        return showDialogue(
          {
            speaker: '守望者 (21F)',
            sprite: 'npc_princess',
            lines: [
              `你真的在【${diffMeta.label}】模式下击败了暗影大魔王，一路登上 21 层塔顶！`,
              '魔塔的封锁已经解除，信号重新回到了这条旧桌面。',
              `最终通关成绩：剩余生命 ${next.hero.hp} · 攻击 ${next.hero.atk} · 防御 ${next.hero.def} · 总步数 ${next.steps}！`,
            ],
            index: 0,
          },
          `恭喜通关魔塔 21F (${diffMeta.shortLabel})！最终生命得分：${next.hero.hp}`,
          'victory',
        );
      }
      return showDialogue({
        speaker: '守望者 (21F)',
        sprite: 'npc_princess',
        lines: [`感谢你再次回到塔顶！当前生命得分：${next.hero.hp}。`],
        index: 0,
      });
  }
}

export function resolveDialogueChoice(state: GameState, confirm: boolean): StepOutcome {
  if (!state.dialogue) return { state, changed: false, checkpoint: false };
  const next = cloneState(state);
  const choice = next.dialogue?.choice;
  next.dialogue = null;

  if (!confirm || !choice) {
    return { state: next, changed: true, checkpoint: false };
  }

  if (choice.actionId === 'sage15fAtk') {
    if (next.hero.exp < 500) {
      next.log = appendLog(next.log, '经验不足 500，无法学习剑道宗师的绝技。');
      return { state: next, changed: true, checkpoint: false, sound: 'error' };
    }
    next.hero.exp -= 500;
    next.hero.atk += 90;
    next.flags.sage15fAtkBought = true;
    next.log = appendLog(next.log, '向剑道宗师支付 500 经验：攻击 +90！');
    return { state: next, changed: true, checkpoint: true, sound: 'shop' };
  }

  if (choice.actionId === 'sage15fDef') {
    if (next.hero.gold < 500) {
      next.log = appendLog(next.log, '金币不足 500，无法购入龙鳞护甲。');
      return { state: next, changed: true, checkpoint: false, sound: 'error' };
    }
    next.hero.gold -= 500;
    next.hero.def += 90;
    next.flags.sage15fDefBought = true;
    next.log = appendLog(next.log, '向铁壁商神支付 500 金币：防御 +90！');
    return { state: next, changed: true, checkpoint: true, sound: 'shop' };
  }

  return { state: next, changed: true, checkpoint: false };
}

export function advanceDialogue(state: GameState): StepOutcome {
  if (!state.dialogue) return { state, changed: false, checkpoint: false };
  const next = cloneState(state);
  if (!next.dialogue) return { state, changed: false, checkpoint: false };
  if (next.dialogue.index + 1 < next.dialogue.lines.length) {
    next.dialogue.index += 1;
    return { state: next, changed: true, checkpoint: false, sound: 'talk' };
  }
  if (next.dialogue.choice) {
    return { state, changed: false, checkpoint: false };
  }
  next.dialogue = null;
  return { state: next, changed: true, checkpoint: false };
}

export function closeActiveShop(state: GameState): GameState {
  if (!state.activeShop) return state;
  const next = cloneState(state);
  next.activeShop = null;
  return next;
}

export function openQuickShop(state: GameState, shopId: ShopId): StepOutcome {
  if (!state.flags.discoveredShops.includes(shopId)) {
    return { state, changed: false, checkpoint: false, sound: 'error' };
  }
  const next = cloneState(state);
  next.dialogue = null;
  next.activeShop = shopId;
  return { state: next, changed: true, checkpoint: false, sound: 'talk' };
}

export function buyShopOption(state: GameState, shopId: ShopId, optionId: string): StepOutcome {
  const shop = SHOPS[shopId];
  const option = shop?.options.find((item) => item.id === optionId);
  if (!shop || !option) return { state, changed: false, checkpoint: false };

  const next = cloneState(state);
  const currencyMap: Record<typeof option.currency, keyof GameState['hero']> = {
    gold: 'gold',
    exp: 'exp',
    yellowKey: 'yellowKeys',
    blueKey: 'blueKeys',
    redKey: 'redKeys',
  };
  const field = currencyMap[option.currency];
  const balance = next.hero[field] as number;
  const currentCost = getShopOptionCost(shopId, optionId, next.shopPurchases);
  const costText = formatShopCostText(shopId, optionId, next.shopPurchases);
  if (balance < currentCost) {
    next.log = appendLog(next.log, `资源不足（当前需要 ${costText}）。`);
    return { state: next, changed: true, checkpoint: false, sound: 'error' };
  }

  (next.hero[field] as number) = balance - currentCost;
  if (shop.escalating && option.costStep) {
    next.shopPurchases[shopId] = (next.shopPurchases[shopId] ?? 0) + 1;
  }
  if (option.effect.hp) next.hero.hp += option.effect.hp;
  if (option.effect.atk) next.hero.atk += option.effect.atk;
  if (option.effect.def) next.hero.def += option.effect.def;
  if (option.effect.lv) next.hero.lv += option.effect.lv;
  if (option.effect.gold) next.hero.gold += option.effect.gold;
  if (option.effect.yellowKey) next.hero.yellowKeys += option.effect.yellowKey;
  if (option.effect.blueKey) next.hero.blueKeys += option.effect.blueKey;
  if (option.effect.redKey) next.hero.redKeys += option.effect.redKey;

  next.log = appendLog(next.log, `[${shop.name}] ${option.label} (-${costText})`);
  return { state: next, changed: true, checkpoint: true, sound: 'shop' };
}

export function flyToFloor(state: GameState, targetFloor: number): StepOutcome {
  if (!state.relics.fly) {
    const next = cloneState(state);
    next.log = appendLog(next.log, '尚未获得【楼层传送器】(7F)。');
    return { state: next, changed: true, checkpoint: false, sound: 'error' };
  }
  if (targetFloor < 0 || targetFloor >= FLOORS.length || !state.visitedFloors.includes(targetFloor)) {
    return { state, changed: false, checkpoint: false, sound: 'error' };
  }
  const destDef = getFloorDef(targetFloor);
  if (destDef.canFly === false) {
    return { state, changed: false, checkpoint: false, sound: 'error' };
  }
  const next = cloneState(state);
  const canUseFromAbove =
    targetFloor < state.floor &&
    state.visitedFloors.includes(targetFloor + 1) &&
    Boolean(destDef.fromAbove);
  const candidate = canUseFromAbove && destDef.fromAbove ? destDef.fromAbove : destDef.fromBelow;
  next.floor = targetFloor;
  const landingTile = getEffectiveTile(next, candidate.x, candidate.y);
  const spawn = landingTile.type === 'floor' ? candidate : destDef.fromBelow;
  next.x = spawn.x;
  next.y = spawn.y;
  next.dir = spawn.dir ?? 'down';
  next.dialogue = null;
  next.activeShop = null;
  next.log = appendLog(next.log, `楼层传送：抵达 ${destDef.name}`);
  return { state: next, changed: true, checkpoint: true, sound: 'stairs' };
}

export function stepMove(state: GameState, dir: Direction): StepOutcome {
  if (state.dialogue || state.activeShop) {
    return { state, changed: false, checkpoint: false };
  }

  const { dx, dy } = DIR_DELTA[dir];
  const nx = state.x + dx;
  const ny = state.y + dy;
  const next = cloneState(state);
  next.dir = dir;

  if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) {
    return { state: next, changed: state.dir !== dir, checkpoint: false };
  }

  const tile = getEffectiveTile(next, nx, ny);

  if (tile.type === 'wall') {
    return { state: next, changed: state.dir !== dir, checkpoint: false };
  }

  if (tile.type === 'lava') {
    if (next.hero.hp <= 100) {
      next.log = appendLog(next.log, '熔岩灼热（扣血 100），生命不足，禁止踏入。');
      return { state: next, changed: true, checkpoint: false, sound: 'error' };
    }
    next.x = nx;
    next.y = ny;
    next.steps += 1;
    next.hero.hp = Math.max(1, next.hero.hp - 100);
    next.log = appendLog(next.log, '踏过熔岩：生命 -100');
    return { state: next, changed: true, checkpoint: true, sound: 'hit' };
  }

  if (tile.type === 'floor') {
    next.x = nx;
    next.y = ny;
    next.steps += 1;
    return { state: next, changed: true, checkpoint: false, sound: 'step' };
  }

  if (tile.type === 'stairsUp') {
    const targetFloor = next.floor + 1;
    if (targetFloor >= FLOORS.length) return { state: next, changed: false, checkpoint: false };
    const dest = getFloorDef(targetFloor);
    next.floor = targetFloor;
    next.maxFloor = Math.max(next.maxFloor, targetFloor);
    if (!next.visitedFloors.includes(targetFloor)) {
      next.visitedFloors = [...next.visitedFloors, targetFloor].sort((a, b) => a - b);
    }
    next.x = dest.fromBelow.x;
    next.y = dest.fromBelow.y;
    next.dir = dest.fromBelow.dir ?? 'up';
    next.steps += 1;
    next.log = appendLog(next.log, `登上 ${dest.name}`);
    return { state: next, changed: true, checkpoint: true, sound: 'stairs' };
  }

  if (tile.type === 'stairsDown') {
    const targetFloor = next.floor - 1;
    if (targetFloor < 0) return { state: next, changed: false, checkpoint: false };
    const dest = getFloorDef(targetFloor);
    next.floor = targetFloor;
    const candidate = dest.fromAbove ?? dest.fromBelow;
    const spawn = getEffectiveTile(next, candidate.x, candidate.y).type === 'floor' ? candidate : dest.fromBelow;
    next.x = spawn.x;
    next.y = spawn.y;
    next.dir = spawn.dir ?? 'down';
    next.steps += 1;
    next.log = appendLog(next.log, `返回 ${dest.name}`);
    return { state: next, changed: true, checkpoint: true, sound: 'stairs' };
  }

  if (tile.type === 'door') {
    if (tile.door === 'yellow') {
      if (next.hero.yellowKeys < 1) {
        next.log = appendLog(next.log, '缺少黄钥匙 [Y]，无法打开黄门 [Y]。');
        return { state: next, changed: true, checkpoint: false, sound: 'error' };
      }
      next.hero.yellowKeys -= 1;
      markCleared(next.cleared, next.floor, nx, ny);
      next.x = nx;
      next.y = ny;
      next.steps += 1;
      next.log = appendLog(next.log, '使用黄钥匙 [Y] 开启黄门。');
      return { state: next, changed: true, checkpoint: true, sound: 'door' };
    }
    if (tile.door === 'blue') {
      if (next.hero.blueKeys < 1) {
        next.log = appendLog(next.log, '缺少蓝钥匙 [B]，无法打开蓝门 [B]。');
        return { state: next, changed: true, checkpoint: false, sound: 'error' };
      }
      next.hero.blueKeys -= 1;
      markCleared(next.cleared, next.floor, nx, ny);
      next.x = nx;
      next.y = ny;
      next.steps += 1;
      next.log = appendLog(next.log, '使用蓝钥匙 [B] 开启蓝门。');
      return { state: next, changed: true, checkpoint: true, sound: 'door' };
    }
    if (tile.door === 'red') {
      if (next.hero.redKeys < 1) {
        next.log = appendLog(next.log, '缺少红钥匙 [R]，无法打开红门 [R]。');
        return { state: next, changed: true, checkpoint: false, sound: 'error' };
      }
      next.hero.redKeys -= 1;
      markCleared(next.cleared, next.floor, nx, ny);
      next.x = nx;
      next.y = ny;
      next.steps += 1;
      next.log = appendLog(next.log, '使用红钥匙 [R] 开启红门。');
      return { state: next, changed: true, checkpoint: true, sound: 'door' };
    }
    if (tile.door === 'crackedWall') {
      if (!next.relics.pickaxe) {
        next.log = appendLog(next.log, '这是一面裂纹暗墙，需要【破墙镐】才能击碎。');
        return { state: next, changed: true, checkpoint: false, sound: 'error' };
      }
      markCleared(next.cleared, next.floor, nx, ny);
      next.x = nx;
      next.y = ny;
      next.steps += 1;
      next.log = appendLog(next.log, '挥动破墙镐击碎了裂纹暗墙！');
      return { state: next, changed: true, checkpoint: true, sound: 'door' };
    }
    const hint =
      next.floor === 0
        ? '先与左侧的守塔仙子对话以开启塔门。'
        : next.floor === 2
          ? '这扇囚室机关门需要 4F 盗贼杰克协助撬开。'
          : next.floor === 18 && nx === 5
            ? '需要带着 10F【破墙镐】去找 4F 盗贼杰克解开密室门。'
            : next.floor === 18 && nx === 9
              ? '进入 18F 中央密室与幻影对话后才能解除此封印。'
              : next.floor === 21
                ? '先击败暗影大魔王，才能解开王座封印！'
                : '机关门紧锁着。';
    next.log = appendLog(next.log, hint);
    return { state: next, changed: true, checkpoint: false, sound: 'error' };
  }

  if (tile.type === 'item') {
    markCleared(next.cleared, next.floor, nx, ny);
    const pickup = applyItemPickup(next, tile.itemId);
    next.x = nx;
    next.y = ny;
    next.steps += 1;
    next.log = appendLog(next.log, pickup.log);
    return { state: next, changed: true, checkpoint: true, sound: pickup.sound };
  }

  if (tile.type === 'monster') {
    const monster = getMonsterDef(tile.monsterId, next.difficulty);
    if (!monster) return { state: next, changed: false, checkpoint: false };
    const info = getDamageInfo(monster, next.hero);
    if (!info) {
      next.log = appendLog(next.log, `无法对【${monster.name}】破防（需攻击 > ${monster.def}）。`);
      return { state: next, changed: true, checkpoint: false, sound: 'error' };
    }
    if (info.damage >= next.hero.hp) {
      next.log = appendLog(next.log, `【${monster.name}】预估伤血 ${info.damage}，超出当前生命 ${next.hero.hp}！`);
      return { state: next, changed: true, checkpoint: false, sound: 'error' };
    }
    next.hero.hp -= info.damage;
    const goldGain = monster.gold * (next.relics.coin ? 2 : 1);
    next.hero.gold += goldGain;
    next.hero.exp += monster.exp;
    next.battlesWon += 1;
    markCleared(next.cleared, next.floor, nx, ny);
    next.x = nx;
    next.y = ny;
    next.steps += 1;
    next.lastCombat = {
      monsterId: monster.id,
      monsterName: monster.name,
      damage: info.damage,
      gold: goldGain,
      exp: monster.exp,
      x: nx,
      y: ny,
      tick: Date.now(),
    };
    let battleNote = `击败【${monster.name}】 · 伤 ${info.damage} · +${goldGain}G +${monster.exp}EXP`;
    if (monster.id === 'finalBoss') {
      next.flags.boss21fDefeated = true;
      battleNote = '斩杀【暗影大魔王】！王座后的封印已解除，快上前解救守望者！';
    }
    next.log = appendLog(next.log, battleNote);
    return {
      state: next,
      changed: true,
      checkpoint: true,
      sound: monster.id === 'finalBoss' ? 'victory' : 'hit',
    };
  }

  if (tile.type === 'npc') {
    return handleNpcInteraction(next, tile.npcId);
  }

  if (tile.type === 'shop') {
    if (!next.flags.discoveredShops.includes(tile.shopId)) {
      next.flags.discoveredShops = [...next.flags.discoveredShops, tile.shopId];
    }
    next.activeShop = tile.shopId;
    next.log = appendLog(next.log, `访问 ${SHOPS[tile.shopId].name}（已加入快捷商店 V）`);
    return { state: next, changed: true, checkpoint: false, sound: 'talk' };
  }

  return { state: next, changed: false, checkpoint: false };
}

/**
 * Shortest-path BFS movement planner modeled after mota-js click-to-move.
 * Walks through passable floor tiles only, allowing the final step to interact with a target.
 */
export function findPathToTile(state: GameState, targetX: number, targetY: number): Direction[] | null {
  if (targetX < 0 || targetY < 0 || targetX >= MAP_SIZE || targetY >= MAP_SIZE) return null;
  if (targetX === state.x && targetY === state.y) return [];

  const targetTile = getEffectiveTile(state, targetX, targetY);
  if (targetTile.type === 'wall') return null;

  const dirs: ReadonlyArray<{ dir: Direction; dx: number; dy: number }> = [
    { dir: 'up', dx: 0, dy: -1 },
    { dir: 'down', dx: 0, dy: 1 },
    { dir: 'left', dx: -1, dy: 0 },
    { dir: 'right', dx: 1, dy: 0 },
  ];

  const queue: Array<{ x: number; y: number; path: Direction[] }> = [{ x: state.x, y: state.y, path: [] }];
  const visited = new Set<string>([tileKey(state.x, state.y)]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const { dir, dx, dy } of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) continue;
      const key = tileKey(nx, ny);
      if (visited.has(key)) continue;

      if (nx === targetX && ny === targetY) {
        return [...current.path, dir];
      }

      const tile = getEffectiveTile(state, nx, ny);
      if (tile.type === 'floor') {
        visited.add(key);
        queue.push({ x: nx, y: ny, path: [...current.path, dir] });
      }
    }
  }

  return null;
}

export interface FloorMonsterEntry {
  monster: MonsterDef;
  count: number;
  damageInfo: DamageInfo | null;
  canBeat: boolean;
  critical: CriticalInfo | null;
  defReduce: number | null;
}

export function getCurrentFloorMonsters(state: GameState): FloorMonsterEntry[] {
  const counts = new Map<string, number>();
  for (let y = 0; y < MAP_SIZE; y += 1) {
    for (let x = 0; x < MAP_SIZE; x += 1) {
      const tile = getEffectiveTile(state, x, y);
      if (tile.type === 'monster') {
        counts.set(tile.monsterId, (counts.get(tile.monsterId) ?? 0) + 1);
      }
    }
  }

  const entries: FloorMonsterEntry[] = [];
  for (const [id, count] of counts.entries()) {
    const monster = getMonsterDef(id, state.difficulty);
    if (!monster) continue;
    const damageInfo = getDamageInfo(monster, state.hero);
    entries.push({
      monster,
      count,
      damageInfo,
      canBeat: canBeatMonster(monster, state.hero),
      critical: getNextCritical(monster, state.hero),
      defReduce: getDefDamageReduction(monster, state.hero, 1),
    });
  }

  entries.sort((a, b) => {
    const da = a.damageInfo?.damage ?? Number.POSITIVE_INFINITY;
    const db = b.damageInfo?.damage ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return a.monster.hp - b.monster.hp;
  });

  return entries;
}

export function buildSaveSummary(state: GameState): SaveSlotSummary {
  const floorDef = getFloorDef(state.floor);
  return {
    floor: state.floor,
    floorName: floorDef.name,
    lv: state.hero.lv,
    hp: state.hero.hp,
    atk: state.hero.atk,
    def: state.hero.def,
    steps: state.steps,
    victory: state.flags.victory,
    difficulty: state.difficulty,
  };
}

export function serializeSavePayload(state: GameState): SerializedSavePayload {
  const cleared: Record<string, string[]> = {};
  for (const [floorKey, keys] of Object.entries(state.cleared)) {
    if (keys.length > 0) cleared[String(floorKey)] = [...keys];
  }
  const shopPurchases: Partial<Record<ShopId, number>> = {};
  for (const [shopKey, count] of Object.entries(state.shopPurchases)) {
    if (typeof count === 'number' && count > 0) {
      shopPurchases[shopKey as ShopId] = Math.floor(count);
    }
  }
  return {
    v: 1,
    difficulty: state.difficulty,
    floor: state.floor,
    maxFloor: state.maxFloor,
    visitedFloors: [...state.visitedFloors],
    hero: { ...state.hero },
    relics: { ...state.relics },
    x: state.x,
    y: state.y,
    dir: state.dir,
    steps: state.steps,
    battlesWon: state.battlesWon,
    playSeconds: state.playSeconds,
    shopPurchases,
    cleared,
    flags: {
      ...state.flags,
      discoveredShops: [...state.flags.discoveredShops],
    },
  };
}

export function deserializeSavePayload(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const data = raw as Partial<SerializedSavePayload>;
  if (data.v !== 1) return null;
  if (typeof data.floor !== 'number' || !Number.isInteger(data.floor) || data.floor < 0 || data.floor >= FLOORS.length) {
    return null;
  }
  if (typeof data.x !== 'number' || typeof data.y !== 'number' || data.x < 0 || data.x >= MAP_SIZE || data.y < 0 || data.y >= MAP_SIZE) {
    return null;
  }
  if (!data.hero || typeof data.hero !== 'object' || !data.relics || typeof data.relics !== 'object' || !data.flags || typeof data.flags !== 'object') {
    return null;
  }

  const difficulty: Difficulty = data.difficulty === 'hard' ? 'hard' : 'standard';
  const base = createInitialState(difficulty);
  const cleared: Record<number, string[]> = {};
  if (data.cleared && typeof data.cleared === 'object') {
    for (const [floorStr, list] of Object.entries(data.cleared)) {
      const f = Number(floorStr);
      if (Number.isInteger(f) && f >= 0 && f < FLOORS.length && Array.isArray(list)) {
        cleared[f] = list.filter((item): item is string => typeof item === 'string');
      }
    }
  }

  const visited = Array.isArray(data.visitedFloors)
    ? Array.from(new Set(data.visitedFloors.filter((f): f is number => Number.isInteger(f) && f >= 0 && f < FLOORS.length))).sort((a, b) => a - b)
    : [0];
  if (!visited.includes(data.floor)) visited.push(data.floor);

  const validDirs: Direction[] = ['up', 'down', 'left', 'right'];
  const dir: Direction = validDirs.includes(data.dir as Direction) ? (data.dir as Direction) : 'down';

  const validShopIds = new Set(Object.keys(SHOPS));
  const discoveredShops = Array.isArray(data.flags.discoveredShops)
    ? data.flags.discoveredShops.filter((id): id is ShopId => typeof id === 'string' && validShopIds.has(id))
    : [];

  const shopPurchases: Partial<Record<ShopId, number>> = {};
  if (data.shopPurchases && typeof data.shopPurchases === 'object') {
    for (const [shopKey, count] of Object.entries(data.shopPurchases)) {
      if (validShopIds.has(shopKey) && typeof count === 'number' && Number.isFinite(count) && count > 0) {
        shopPurchases[shopKey as ShopId] = Math.min(999, Math.floor(count));
      }
    }
  }

  return {
    ...base,
    difficulty,
    floor: data.floor,
    maxFloor: Math.max(data.floor, Number(data.maxFloor) || data.floor),
    visitedFloors: visited,
    hero: {
      lv: Math.max(1, Math.floor(Number(data.hero.lv) || 1)),
      hp: Math.max(1, Math.floor(Number(data.hero.hp) || DIFFICULTY_META[difficulty].initHp)),
      atk: Math.max(0, Math.floor(Number(data.hero.atk) || 10)),
      def: Math.max(0, Math.floor(Number(data.hero.def) || 10)),
      gold: Math.max(0, Math.floor(Number(data.hero.gold) || 0)),
      exp: Math.max(0, Math.floor(Number(data.hero.exp) || 0)),
      yellowKeys: Math.max(0, Math.floor(Number(data.hero.yellowKeys) || 0)),
      blueKeys: Math.max(0, Math.floor(Number(data.hero.blueKeys) || 0)),
      redKeys: Math.max(0, Math.floor(Number(data.hero.redKeys) || 0)),
      weaponName: typeof data.hero.weaponName === 'string' ? data.hero.weaponName.slice(0, 24) : '空手',
      shieldName: typeof data.hero.shieldName === 'string' ? data.hero.shieldName.slice(0, 24) : '无盾',
    },
    relics: {
      book: Boolean(data.relics.book),
      fly: Boolean(data.relics.fly),
      cross: Boolean(data.relics.cross),
      pickaxe: Boolean(data.relics.pickaxe),
      coin: Boolean(data.relics.coin),
    },
    x: Math.floor(data.x),
    y: Math.floor(data.y),
    dir,
    steps: Math.max(0, Math.floor(Number(data.steps) || 0)),
    battlesWon: Math.max(0, Math.floor(Number(data.battlesWon) || 0)),
    playSeconds: Math.max(0, Math.floor(Number(data.playSeconds) || 0)),
    shopPurchases,
    cleared,
    flags: {
      gate0fOpened: Boolean(data.flags.gate0fOpened),
      crossDelivered: Boolean(data.flags.crossDelivered),
      thiefHelped2f: Boolean(data.flags.thiefHelped2f),
      thiefHelped18f: Boolean(data.flags.thiefHelped18f),
      blacksmithRewarded: Boolean(data.flags.blacksmithRewarded),
      armorerRewarded: Boolean(data.flags.armorerRewarded),
      sage15fAtkBought: Boolean(data.flags.sage15fAtkBought),
      sage15fDefBought: Boolean(data.flags.sage15fDefBought),
      decoy18fRevealed: Boolean(data.flags.decoy18fRevealed),
      boss21fDefeated: Boolean(data.flags.boss21fDefeated),
      victory: Boolean(data.flags.victory),
      discoveredShops,
    },
    log: [`已读取存档：${getFloorDef(data.floor).name} (${DIFFICULTY_META[difficulty].shortLabel})`],
    dialogue: null,
    activeShop: null,
    lastCombat: null,
  };
}
