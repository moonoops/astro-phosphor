import type { Direction, FloorDef, TileKind } from './types';

export const MAP_SIZE = 11;

const TILE_TOKENS: Readonly<Record<string, TileKind>> = {
  '.': { type: 'floor' },
  '#': { type: 'wall' },
  '~': { type: 'lava' },
  '>': { type: 'stairsUp' },
  '<': { type: 'stairsDown' },

  // Doors
  'Y': { type: 'door', door: 'yellow' },
  'B': { type: 'door', door: 'blue' },
  'R': { type: 'door', door: 'red' },
  'S': { type: 'door', door: 'special' },
  'C': { type: 'door', door: 'crackedWall' },

  // Keys & consumables
  'y': { type: 'item', itemId: 'yellowKey' },
  'b': { type: 'item', itemId: 'blueKey' },
  'r': { type: 'item', itemId: 'redKey' },
  'K': { type: 'item', itemId: 'keyBox' },
  'a': { type: 'item', itemId: 'redGem' },
  'd': { type: 'item', itemId: 'blueGem' },
  'A': { type: 'item', itemId: 'bigRedGem' },
  'D': { type: 'item', itemId: 'bigBlueGem' },
  'p': { type: 'item', itemId: 'redPotion' },
  'P': { type: 'item', itemId: 'bluePotion' },
  'H': { type: 'item', itemId: 'holyWater' },
  '$': { type: 'item', itemId: 'goldBag' },
  'f': { type: 'item', itemId: 'featherSmall' },
  'F': { type: 'item', itemId: 'featherBig' },

  // Equipment
  '1': { type: 'item', itemId: 'sword1' },
  '2': { type: 'item', itemId: 'shield1' },
  '3': { type: 'item', itemId: 'sword2' },
  '4': { type: 'item', itemId: 'shield2' },
  '5': { type: 'item', itemId: 'sword3' },
  '6': { type: 'item', itemId: 'shield3' },
  '7': { type: 'item', itemId: 'sword4' },
  '8': { type: 'item', itemId: 'shield4' },
  '9': { type: 'item', itemId: 'sword5' },
  '0': { type: 'item', itemId: 'shield5' },

  // Relics
  'M': { type: 'item', itemId: 'book' },
  'W': { type: 'item', itemId: 'fly' },
  'X': { type: 'item', itemId: 'cross' },
  'T': { type: 'item', itemId: 'pickaxe' },
  'G': { type: 'item', itemId: 'coin' },

  // Monsters
  'sg': { type: 'monster', monsterId: 'greenSlime' },
  'sr': { type: 'monster', monsterId: 'redSlime' },
  'bt': { type: 'monster', monsterId: 'bat' },
  'sk': { type: 'monster', monsterId: 'skeleton' },
  'sb': { type: 'monster', monsterId: 'blackSlime' },
  'ss': { type: 'monster', monsterId: 'skeletonSoldier' },
  'bp': { type: 'monster', monsterId: 'bluePriest' },
  'bb': { type: 'monster', monsterId: 'bigBat' },
  'or': { type: 'monster', monsterId: 'orc' },
  'sc': { type: 'monster', monsterId: 'skeletonCaptain' },
  'rk': { type: 'monster', monsterId: 'rock' },
  'g1': { type: 'monster', monsterId: 'guard1' },
  'rb': { type: 'monster', monsterId: 'redBat' },
  'w1': { type: 'monster', monsterId: 'wizard1' },
  'sl': { type: 'monster', monsterId: 'slimeLord' },
  'rp': { type: 'monster', monsterId: 'redPriest' },
  'mg': { type: 'monster', monsterId: 'magicGuard' },
  'k1': { type: 'monster', monsterId: 'knight1' },
  'w2': { type: 'monster', monsterId: 'wizard2' },
  'ow': { type: 'monster', monsterId: 'orcWarrior' },
  'g2': { type: 'monster', monsterId: 'guard2' },
  'g3': { type: 'monster', monsterId: 'guard3' },
  'sw': { type: 'monster', monsterId: 'swordsman' },
  'dk': { type: 'monster', monsterId: 'redDemonKing' },
  'ds': { type: 'monster', monsterId: 'darkSoldier' },
  'k2': { type: 'monster', monsterId: 'knight2' },
  'gm': { type: 'monster', monsterId: 'ghostMage' },
  'gc': { type: 'monster', monsterId: 'ghostCaptain' },
  'gw': { type: 'monster', monsterId: 'ghostWarrior' },
  'sh': { type: 'monster', monsterId: 'shadowWarrior' },
  'gl': { type: 'monster', monsterId: 'ghostLord' },
  'fb': { type: 'monster', monsterId: 'finalBoss' },

  // NPCs
  'n0': { type: 'npc', npcId: 'fairy0f' },
  'n1': { type: 'npc', npcId: 'sage1f' },
  'n2': { type: 'npc', npcId: 'blacksmith2f' },
  'n3': { type: 'npc', npcId: 'armorer2f' },
  'n4': { type: 'npc', npcId: 'thief4f' },
  'n7': { type: 'npc', npcId: 'guide7f' },
  'nA': { type: 'npc', npcId: 'guide10f' },
  'nE': { type: 'npc', npcId: 'sage15fAtk' },
  'nG': { type: 'npc', npcId: 'sage15fDef' },
  'n8': { type: 'npc', npcId: 'decoy18f' },
  'nW': { type: 'npc', npcId: 'warning20f' },
  'nP': { type: 'npc', npcId: 'princess21f' },

  // Shops
  's3': { type: 'shop', shopId: 'shop3f' },
  'e5': { type: 'shop', shopId: 'exp5f' },
  'k5': { type: 'shop', shopId: 'key5f' },
  'sB': { type: 'shop', shopId: 'shop11f' },
  'kC': { type: 'shop', shopId: 'sell12f' },
  'eD': { type: 'shop', shopId: 'exp13f' },
};

function buildFloor(
  floor: number,
  name: string,
  act: 1 | 2 | 3,
  rows: ReadonlyArray<string>,
  fromBelow: { x: number; y: number; dir?: Direction },
  fromAbove?: { x: number; y: number; dir?: Direction },
  canFly = true,
): FloorDef {
  if (rows.length !== MAP_SIZE) {
    throw new Error(`Floor ${floor} must have ${MAP_SIZE} rows, got ${rows.length}`);
  }
  const grid: TileKind[][] = rows.map((row, y) => {
    const tokens = row.trim().split(/\s+/);
    if (tokens.length !== MAP_SIZE) {
      throw new Error(`Floor ${floor} row ${y} must have ${MAP_SIZE} cells, got ${tokens.length}`);
    }
    return tokens.map((tok, x) => {
      const def = TILE_TOKENS[tok];
      if (!def) {
        throw new Error(`Unknown tile token "${tok}" at floor ${floor} (${x},${y})`);
      }
      return def;
    });
  });

  return { floor, name, act, grid, fromBelow, fromAbove, canFly };
}

/**
 * 22 Classic-Paced Magic Tower Floors (0F — 21F), 11×11 grid each.
 *
 * Act 1 (0F–7F): Gate & Lower Spire — basics, Monster Manual, 3F/5F shops, Thief, Cross & Teleporter.
 * Act 2 (8F–16F): Mid Citadel — Magic Attack, Solid, Vampire mechanics, 11F/12F/13F/15F shops, Red Demon King.
 * Act 3 (17F–21F): High Spire — 18F secret passage, Ghost Lord, Divine gear, and Final Sovereign showdown.
 */
export const FLOORS: ReadonlyArray<FloorDef> = [
  // 0F — Entrance Courtyard
  buildFloor(
    0,
    '0F · 魔塔入口',
    1,
    [
      '#  #  #  #  #  >  #  #  #  #  #',
      '#  #  #  #  #  .  #  #  #  #  #',
      '#  #  #  #  #  .  #  #  #  #  #',
      '#  #  #  #  #  .  #  #  #  #  #',
      '#  #  #  #  #  .  #  #  #  #  #',
      '#  #  #  #  #  .  #  #  #  #  #',
      '#  #  #  #  #  .  #  #  #  #  #',
      '#  #  #  #  #  S  #  #  #  #  #',
      '~  ~  ~  #  n0 .  #  ~  ~  ~  ~',
      '~  ~  ~  #  .  .  .  #  ~  ~  ~',
      '~  ~  ~  #  #  #  #  #  ~  ~  ~',
    ],
    { x: 5, y: 9, dir: 'up' },
    { x: 5, y: 1, dir: 'down' },
  ),

  // 1F — First Hall (Monster Manual right ahead, starter slimes/bats/skeletons)
  buildFloor(
    1,
    '1F · 启程大厅',
    1,
    [
      '>  .  sg sr sg .  .  .  .  y  y ',
      '#  #  #  #  #  #  #  #  #  #  . ',
      'p  y  .  Y  sk .  #  y  a  #  . ',
      'y  sk .  #  .  .  #  y  p  #  . ',
      '#  Y  #  #  bt .  #  #  Y  #  . ',
      'y  .  .  #  .  .  Y  .  .  .  . ',
      'bt .  d  #  #  #  #  #  .  #  # ',
      '#  Y  #  #  .  .  .  #  .  #  y ',
      'p  .  .  Y  .  M  .  .  .  #  a ',
      'y  sr p  #  n1 .  .  #  sg .  d ',
      '#  #  #  #  #  <  #  #  #  #  # ',
    ],
    { x: 5, y: 9, dir: 'up' },
    { x: 1, y: 0, dir: 'right' },
  ),

  // 2F — Twin Cells (Bottom-left prison locked behind special door S at (1,8) opened by Thief on 4F)
  buildFloor(
    2,
    '2F · 囚徒回廊',
    1,
    [
      '<  #  .  .  .  .  .  .  .  .  > ',
      '.  .  .  #  #  Y  #  #  .  #  # ',
      '.  #  .  #  y  .  a  #  .  #  y ',
      '.  #  .  #  d  .  p  #  .  #  p ',
      '.  #  .  #  #  #  #  #  .  #  . ',
      '.  #  .  .  bt .  sk .  .  #  . ',
      '#  #  .  #  #  Y  #  #  .  #  . ',
      'n2 #  .  #  y  .  y  #  .  #  . ',
      '.  S  .  #  a  .  d  #  .  Y  . ',
      'n3 #  .  #  p  sg p  #  .  #  . ',
      '#  #  .  #  #  #  #  #  .  #  # ',
    ],
    { x: 0, y: 1, dir: 'right' },
    { x: 9, y: 0, dir: 'left' },
  ),

  // 3F — Altar of Greed (3F Gold Shop + Iron Sword)
  buildFloor(
    3,
    '3F · 贪婪祭坛',
    1,
    [
      '1  bt .  #  #  s3 #  #  .  .  < ',
      'a  .  .  #  .  .  .  #  .  #  # ',
      'p  y  #  #  .  .  .  #  .  .  y ',
      '#  Y  #  .  .  sg .  .  #  Y  # ',
      '.  .  .  .  #  Y  #  .  .  sr . ',
      '.  #  #  .  #  p  #  .  #  #  . ',
      '.  #  y  .  .  .  .  .  y  #  . ',
      '.  #  d  #  #  Y  #  #  a  #  . ',
      '.  .  .  .  sk .  bt .  .  .  . ',
      '#  #  Y  #  #  .  #  #  Y  #  # ',
      '>  .  .  y  .  .  .  y  p  b  # ',
    ],
    { x: 9, y: 0, dir: 'left' },
    { x: 1, y: 10, dir: 'right' },
  ),

  // 4F — Thief Jack's Cell (Talk to Thief to unlock 2F secret door & later 18F!)
  buildFloor(
    4,
    '4F · 盗贼地牢',
    1,
    [
      '#  y  a  #  .  .  .  #  d  y  # ',
      '#  p  .  Y  .  ss .  Y  .  p  # ',
      '#  #  #  #  .  #  .  #  #  #  # ',
      'y  .  sk .  .  #  .  .  bt .  y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  n4 .  .  Y  .  .  sb #  . ',
      '.  #  #  #  #  #  #  #  .  #  . ',
      '.  .  .  .  sg .  sr .  .  .  . ',
      '#  #  Y  #  #  .  #  #  Y  #  # ',
      '<  .  .  #  y  .  y  #  .  .  > ',
      '#  #  #  #  p  b  a  #  #  #  # ',
    ],
    { x: 1, y: 9, dir: 'right' },
    { x: 9, y: 9, dir: 'left' },
  ),

  // 5F — Twin Sages (EXP Shop + Key Merchant + Iron Shield)
  buildFloor(
    5,
    '5F · 修行与市集',
    1,
    [
      '2  .  bp #  #  e5 #  #  y  k5 # ',
      'd  p  .  #  .  .  .  #  .  .  # ',
      '#  Y  #  #  .  .  .  #  #  Y  # ',
      '.  .  .  .  .  sk .  .  .  .  . ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  y  .  #  P  #  .  y  #  . ',
      '.  #  a  .  Y  sb Y  .  d  #  . ',
      '.  #  #  #  #  .  #  #  #  #  . ',
      '.  .  bt .  .  .  .  .  ss .  . ',
      '>  #  #  Y  #  .  #  Y  #  #  < ',
      '#  y  a  .  y  p  y  .  d  y  # ',
    ],
    { x: 10, y: 8, dir: 'up' },
    { x: 0, y: 8, dir: 'up' },
  ),

  // 6F — Citadel Barracks (Introduces Stone Golem [Solid], Big Bat, Orc, Silver Sword)
  buildFloor(
    6,
    '6F · 试炼兵营',
    1,
    [
      '#  3  a  #  .  .  .  #  d  P  # ',
      '#  .  sc B  .  bb .  Y  .  y  # ',
      '#  #  #  #  .  #  .  #  #  #  # ',
      'y  bp .  .  .  #  .  .  .  or y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  p  .  Y  rk Y  .  p  #  . ',
      '.  #  a  .  #  $  #  .  d  #  . ',
      '.  #  #  #  #  #  #  #  #  #  . ',
      '.  .  ss .  .  .  .  .  sb .  . ',
      '<  #  #  Y  #  .  #  Y  #  #  > ',
      '#  y  p  .  y  b  y  .  p  y  # ',
    ],
    { x: 0, y: 8, dir: 'up' },
    { x: 10, y: 8, dir: 'up' },
  ),

  // 7F — Act 1 Summit (Red Bat Boss Gate, Silver Shield, Cross, Floor Teleporter!)
  buildFloor(
    7,
    '7F · 十字圣堂',
    1,
    [
      '#  W  P  #  #  >  #  #  P  X  # ',
      '#  4  b  B  .  .  .  B  y  K  # ',
      '#  #  #  #  #  rb #  #  #  #  # ',
      'a  .  g1 .  .  .  .  .  sc .  d ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  y  .  .  n7 .  .  y  #  . ',
      '.  #  p  .  #  Y  #  .  p  #  . ',
      '.  #  #  #  #  .  #  #  #  #  . ',
      '.  .  bb .  .  .  .  .  or .  . ',
      '#  #  Y  #  #  .  #  #  Y  #  < ',
      'y  a  .  .  y  .  y  .  d  #  # ',
    ],
    { x: 10, y: 8, dir: 'up' },
    { x: 5, y: 1, dir: 'down' },
  ),

  // 8F — Act 2 Entry (Introduces Magic Attack Warlock & Slime King)
  buildFloor(
    8,
    '8F · 魔导前庭',
    2,
    [
      '#  y  a  #  #  <  #  #  d  y  # ',
      '#  P  .  Y  .  .  .  Y  .  P  # ',
      '#  #  #  #  #  w1 #  #  #  #  # ',
      'a  .  .  .  .  .  .  .  .  .  d ',
      '.  #  #  B  #  #  #  Y  #  #  . ',
      '.  #  f  .  #  sl #  .  K  #  . ',
      '.  #  .  .  Y  .  Y  .  .  #  . ',
      '.  #  #  #  #  .  #  #  #  #  . ',
      '.  .  g1 .  .  .  .  .  rp .  . ',
      '>  #  #  Y  #  .  #  Y  #  #  # ',
      '#  y  .  .  y  P  y  .  .  b  # ',
    ],
    { x: 5, y: 1, dir: 'down' },
    { x: 0, y: 8, dir: 'up' },
  ),

  // 9F — Armory of Runes (Knight Sword + Vampire Runic Sentinel)
  buildFloor(
    9,
    '9F · 符文武库',
    2,
    [
      '#  5  P  #  .  .  .  #  b  y  # ',
      '#  a  .  R  .  mg .  B  .  d  # ',
      '#  #  #  #  .  #  .  #  #  #  # ',
      'y  .  rp .  .  #  .  .  sl .  y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  a  .  Y  .  Y  .  d  #  . ',
      '.  #  p  .  #  w1 #  .  p  #  . ',
      '.  #  #  #  #  .  #  #  #  #  . ',
      '.  .  g1 .  .  .  .  .  rb .  . ',
      '<  #  #  Y  #  .  #  Y  #  #  > ',
      '#  y  .  .  y  P  y  .  .  y  # ',
    ],
    { x: 0, y: 8, dir: 'up' },
    { x: 10, y: 8, dir: 'up' },
  ),

  // 10F — Bastion Checkpoint (Knight Shield + Pickaxe for Thief Jack + Cracked Wall Vault)
  buildFloor(
    10,
    '10F · 破壁要塞',
    2,
    [
      '#  T  P  #  #  >  #  #  6  P  # ',
      '#  y  .  B  .  .  .  B  .  y  # ',
      '#  #  #  #  #  k1 #  #  #  #  # ',
      'A  .  .  C  .  .  .  .  mg .  D ',
      '#  #  #  #  .  .  .  #  #  #  . ',
      'y  .  .  Y  nA .  .  Y  .  .  . ',
      'P  .  sl #  #  Y  #  #  rp .  y ',
      '#  #  #  #  .  .  .  #  #  #  # ',
      '.  .  w1 .  .  .  .  .  g1 .  . ',
      '#  #  Y  #  #  .  #  #  Y  #  < ',
      'a  d  .  .  y  .  y  .  y  #  # ',
    ],
    { x: 10, y: 8, dir: 'up' },
    { x: 5, y: 1, dir: 'down' },
  ),

  // 11F — High Altar (11F Advanced Gold Shop + Big Gems)
  buildFloor(
    11,
    '11F · 高阶祭坛',
    2,
    [
      '#  A  P  #  #  sB #  #  P  D  # ',
      '#  y  .  B  .  .  .  B  .  y  # ',
      '#  #  #  #  #  k1 #  #  #  #  # ',
      'y  .  .  .  .  .  .  .  .  .  y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  $  .  Y  ow Y  .  f  #  . ',
      '.  #  A  .  #  #  #  .  D  #  . ',
      '.  #  #  #  #  .  #  #  #  #  . ',
      '.  .  w2 .  .  .  .  .  g2 .  . ',
      '<  #  #  Y  #  .  #  Y  #  #  > ',
      '#  y  .  .  y  b  y  .  .  y  # ',
    ],
    { x: 0, y: 8, dir: 'up' },
    { x: 10, y: 8, dir: 'up' },
  ),

  // 12F — Key Exchange & Lucky Coin Vault (double gold!)
  buildFloor(
    12,
    '12F · 黄金回廊',
    2,
    [
      '#  G  P  #  .  kC .  #  K  P  # ',
      '#  A  .  R  .  .  .  B  .  D  # ',
      '#  #  #  #  #  ow #  #  #  #  # ',
      'y  .  g2 .  .  .  .  .  k1 .  y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  y  .  Y  w2 Y  .  y  #  . ',
      '.  #  P  .  #  $  #  .  P  #  . ',
      '.  #  #  #  #  #  #  #  #  #  . ',
      '.  .  g2 .  .  .  .  .  ow .  . ',
      '>  #  #  Y  #  .  #  Y  #  #  < ',
      '#  y  .  .  y  r  y  .  .  y  # ',
    ],
    { x: 10, y: 8, dir: 'up' },
    { x: 0, y: 8, dir: 'up' },
  ),

  // 13F — Grand Sage Sanctum (13F Advanced EXP Shop)
  buildFloor(
    13,
    '13F · 宗师殿堂',
    2,
    [
      '#  A  P  #  #  eD #  #  P  D  # ',
      '#  b  .  B  .  .  .  B  .  y  # ',
      '#  #  #  #  #  g3 #  #  #  #  # ',
      'y  .  sw .  .  .  .  .  g2 .  y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  A  .  Y  ow Y  .  D  #  . ',
      '.  #  P  .  #  K  #  .  P  #  . ',
      '.  #  #  #  #  #  #  #  #  #  . ',
      '.  .  w2 .  .  .  .  .  g3 .  . ',
      '<  #  #  Y  #  .  #  Y  #  #  > ',
      '#  y  .  .  y  P  y  .  .  y  # ',
    ],
    { x: 0, y: 8, dir: 'up' },
    { x: 10, y: 8, dir: 'up' },
  ),

  // 14F — Sacred Blade Hall (Sacred Sword + Heavy Guards & Twinblades)
  buildFloor(
    14,
    '14F · 圣剑大厅',
    2,
    [
      '#  7  P  #  #  >  #  #  F  P  # ',
      '#  A  .  R  .  .  .  B  .  D  # ',
      '#  #  #  #  #  sw #  #  #  #  # ',
      'y  .  g3 .  .  .  .  .  g3 .  y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  $  .  Y  w2 Y  .  K  #  . ',
      '.  #  P  .  #  A  #  .  P  #  . ',
      '.  #  #  #  #  #  #  #  #  #  . ',
      '.  .  ow .  .  .  .  .  g2 .  . ',
      '#  #  Y  #  #  .  #  #  Y  #  < ',
      'y  D  .  .  y  .  y  .  y  #  # ',
    ],
    { x: 10, y: 8, dir: 'up' },
    { x: 5, y: 1, dir: 'down' },
  ),

  // 15F — Twin Masters & Sacred Shield + Holy Water!
  buildFloor(
    15,
    '15F · 双贤密室',
    2,
    [
      '#  8  P  #  #  <  #  #  H  P  # ',
      '#  D  .  B  .  .  .  R  .  A  # ',
      '#  #  #  #  #  sw #  #  #  #  # ',
      'nE .  .  Y  .  .  .  Y  .  .  nG',
      '#  #  #  #  .  #  .  #  #  #  # ',
      'y  .  g3 .  .  Y  .  .  g3 .  y ',
      '.  #  #  #  #  .  #  #  #  #  . ',
      '.  #  A  P  Y  .  Y  P  D  #  . ',
      '.  .  .  .  .  .  .  .  .  .  . ',
      '>  #  #  Y  #  .  #  Y  #  #  # ',
      '#  y  .  .  y  r  y  .  .  b  # ',
    ],
    { x: 5, y: 1, dir: 'down' },
    { x: 0, y: 8, dir: 'up' },
  ),

  // 16F — Act 2 Boss Arena: Crimson Lord (红衣魔王)
  buildFloor(
    16,
    '16F · 红衣魔王殿',
    2,
    [
      '#  #  #  #  #  >  #  #  #  #  # ',
      '#  P  A  #  .  .  .  #  D  P  # ',
      '#  r  .  B  .  .  .  B  .  K  # ',
      '#  #  #  #  #  dk #  #  #  #  # ',
      '#  .  .  .  .  .  .  .  .  .  # ',
      '#  .  #  #  #  R  #  #  #  .  # ',
      '#  .  #  A  .  .  .  D  #  .  # ',
      '#  .  #  P  .  .  .  P  #  .  # ',
      '#  .  #  #  #  .  #  #  #  .  # ',
      '<  .  .  .  .  .  .  .  .  .  # ',
      '#  #  #  #  #  #  #  #  #  #  # ',
    ],
    { x: 1, y: 9, dir: 'right' },
    { x: 5, y: 1, dir: 'down' },
  ),

  // 17F — Act 3 Entry: High Spire (Divine Sword + Wraiths & Soul Casters)
  buildFloor(
    17,
    '17F · 冥界前廊',
    3,
    [
      '#  9  P  #  #  <  #  #  F  P  # ',
      '#  A  .  R  .  .  .  B  .  D  # ',
      '#  #  #  #  #  ds #  #  #  #  # ',
      'y  .  k2 .  .  .  .  .  k2 .  y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  A  .  Y  gm Y  .  D  #  . ',
      '.  #  P  .  #  K  #  .  P  #  . ',
      '.  #  #  #  #  #  #  #  #  #  . ',
      '.  .  ds .  .  .  .  .  gc .  . ',
      '#  #  Y  #  #  .  #  #  Y  #  > ',
      'y  P  .  .  y  .  y  .  y  #  # ',
    ],
    { x: 5, y: 1, dir: 'down' },
    { x: 10, y: 8, dir: 'up' },
  ),

  // 18F — Chamber of Echoes (Special door S at (5,5) opened by Jack after Pickaxe -> decoy opens S at (9,7) to 19F!)
  buildFloor(
    18,
    '18F · 镜像密室',
    3,
    [
      '#  #  #  #  #  #  #  #  #  #  # ',
      '#  A  P  #  .  .  .  #  P  D  # ',
      '#  K  .  Y  .  n8 .  Y  .  H  # ',
      '#  #  #  #  .  .  .  #  #  #  # ',
      '#  .  .  #  #  .  #  #  .  .  # ',
      '#  .  #  #  #  S  #  #  #  .  # ',
      '#  .  .  .  .  .  .  .  .  .  # ',
      '#  #  #  #  #  .  #  #  #  S  # ',
      'y  .  gc .  .  .  .  .  #  >  # ',
      '.  #  #  #  #  .  #  #  #  #  # ',
      'A  P  D  y  .  .  .  .  .  .  < ',
    ],
    { x: 9, y: 10, dir: 'left' },
    { x: 9, y: 7, dir: 'up' },
  ),

  // 19F — Spectral Hall (Divine Shield + Ghost Lord Sub-Boss)
  buildFloor(
    19,
    '19F · 冥灵魔殿',
    3,
    [
      '#  0  P  #  #  >  #  #  F  P  # ',
      '#  D  .  R  .  .  .  B  .  A  # ',
      '#  #  #  #  #  gl #  #  #  #  # ',
      'y  .  gw .  .  .  .  .  gw .  y ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  A  .  Y  sh Y  .  D  #  . ',
      '.  #  P  .  #  K  #  .  P  #  . ',
      '.  #  #  #  #  #  #  #  #  #  . ',
      '.  .  gc .  .  .  .  .  k2 .  . ',
      '<  #  #  Y  #  .  #  Y  #  #  # ',
      '#  y  .  .  y  P  y  .  .  r  # ',
    ],
    { x: 0, y: 8, dir: 'up' },
    { x: 5, y: 1, dir: 'down' },
  ),

  // 20F — Final Prep Hall (Final caches, warning sage, last chance to fly back to shops!)
  buildFloor(
    20,
    '20F · 决战前夜',
    3,
    [
      '#  A  P  #  #  >  #  #  P  D  # ',
      '#  P  .  B  .  .  .  B  .  P  # ',
      '#  #  #  #  #  sh #  #  #  #  # ',
      'A  .  gw .  .  .  .  .  gm .  D ',
      '.  #  #  Y  #  #  #  Y  #  #  . ',
      '.  #  K  .  .  nW .  .  $  #  . ',
      '.  #  P  .  #  Y  #  .  P  #  . ',
      '.  #  #  #  #  .  #  #  #  #  . ',
      '.  .  sh .  .  .  .  .  gw .  . ',
      '#  #  Y  #  #  .  #  #  Y  #  < ',
      'A  D  .  .  y  .  y  .  P  #  # ',
    ],
    { x: 10, y: 8, dir: 'up' },
    { x: 5, y: 1, dir: 'down' },
  ),

  // 21F — The Tower Crown (Final Sovereign Boss & Rescue)
  buildFloor(
    21,
    '21F · 塔顶王座',
    3,
    [
      '#  #  #  #  #  #  #  #  #  #  # ',
      '#  ~  ~  #  P  nP P  #  ~  ~  # ',
      '#  ~  ~  #  #  S  #  #  ~  ~  # ',
      '#  ~  #  #  .  fb .  #  #  ~  # ',
      '#  #  #  .  .  .  .  .  #  #  # ',
      '#  A  .  .  #  .  #  .  .  D  # ',
      '#  P  .  #  #  .  #  #  .  P  # ',
      '#  #  #  #  .  .  .  #  #  #  # ',
      '#  ~  ~  #  .  .  .  #  ~  ~  # ',
      '#  ~  ~  #  #  .  #  #  ~  ~  # ',
      '#  #  #  #  #  <  #  #  #  #  # ',
    ],
    { x: 5, y: 9, dir: 'up' },
    undefined,
    true,
  ),
];
