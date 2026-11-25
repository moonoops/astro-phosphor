/**
 * Magic Tower combat, damage preview, and critical-threshold formulas.
 *
 * Adapted from ckcz123/mota-js (BSD-3-Clause License, Copyright (c) 2018, ckcz123):
 *   - libs/enemys.js (nextCriticals, getDefDamage, canBattle)
 *   - project/functions.js (getEnemyInfo, getDamageInfo)
 */

import type { CriticalInfo, DamageInfo, HeroStats, MonsterDef, MonsterSpecial } from './types';

export const SPECIAL_META: Record<MonsterSpecial, { name: string; desc: string }> = {
  firstStrike: { name: '先攻', desc: '战斗开始时怪物先攻击一次' },
  magic: { name: '魔攻', desc: '怪物攻击无视勇者防御力' },
  solid: { name: '坚固', desc: '怪物防御力不低于勇者攻击 - 1' },
  doubleHit: { name: '2连击', desc: '怪物每回合连续攻击 2 次' },
  vampire: { name: '吸血', desc: '战前先吸取勇者当前生命值的固定比例' },
};

export function hasSpecial(monster: MonsterDef, special: MonsterSpecial): boolean {
  return Boolean(monster.special?.includes(special));
}

export function getEffectiveEnemyStats(
  monster: MonsterDef,
  hero: Pick<HeroStats, 'hp' | 'atk' | 'def'>,
): { hp: number; atk: number; def: number } {
  const heroAtk = Math.max(0, Math.floor(hero.atk));
  let monDef = monster.def;
  if (hasSpecial(monster, 'solid') && monDef < heroAtk - 1) {
    monDef = Math.max(0, heroAtk - 1);
  }
  return {
    hp: monster.hp,
    atk: monster.atk,
    def: monDef,
  };
}

/**
 * Exact mota-js turn-based deterministic damage calculation.
 * Returns null when hero cannot break the monster's defense.
 */
export function getDamageInfo(
  monster: MonsterDef,
  hero: Pick<HeroStats, 'hp' | 'atk' | 'def'>,
): DamageInfo | null {
  const heroHp = Math.max(0, Math.floor(hero.hp));
  const heroAtk = Math.max(0, Math.floor(hero.atk));
  const heroDef = Math.max(0, Math.floor(hero.def));

  const effective = getEffectiveEnemyStats(monster, { hp: heroHp, atk: heroAtk, def: heroDef });
  const monHp = effective.hp;
  const monAtk = effective.atk;
  const monDef = effective.def;

  const heroPerDamage = Math.max(heroAtk - monDef, 0);
  if (heroPerDamage <= 0) return null;

  let initDamage = 0;
  if (hasSpecial(monster, 'vampire')) {
    const ratio = monster.vampireRatio ?? 1 / 3;
    initDamage += Math.floor(heroHp * ratio);
  }

  let perDamage = hasSpecial(monster, 'magic') ? monAtk : Math.max(0, monAtk - heroDef);
  if (hasSpecial(monster, 'doubleHit')) {
    perDamage *= 2;
  }

  if (hasSpecial(monster, 'firstStrike')) {
    initDamage += perDamage;
  }

  const turns = Math.ceil(monHp / heroPerDamage);
  const damage = Math.max(0, Math.floor(initDamage + (turns - 1) * perDamage));

  return {
    monHp,
    monAtk,
    monDef,
    initDamage: Math.floor(initDamage),
    perDamage: Math.floor(perDamage),
    heroPerDamage,
    turns,
    damage,
  };
}

export function canBeatMonster(
  monster: MonsterDef,
  hero: Pick<HeroStats, 'hp' | 'atk' | 'def'>,
): boolean {
  const info = getDamageInfo(monster, hero);
  return info !== null && info.damage < hero.hp;
}

/**
 * Computes the next ATK critical point (临界值) and HP saved (临界减伤),
 * matching mota-js's turn-based formula in libs/enemys.js.
 */
export function getNextCritical(
  monster: MonsterDef,
  hero: Pick<HeroStats, 'hp' | 'atk' | 'def'>,
): CriticalInfo | null {
  // Solid monsters always match hero.atk - 1 so ATK criticals do not apply.
  if (hasSpecial(monster, 'solid')) return null;

  const current = getDamageInfo(monster, hero);
  if (current === null) {
    // Cannot break defense yet: report ATK needed to deal 1 damage per hit.
    const needed = monster.def + 1 - Math.floor(hero.atk);
    if (needed <= 0) return null;
    const afterBreak = getDamageInfo(monster, { ...hero, atk: Math.floor(hero.atk) + needed });
    return {
      atkNeeded: needed,
      damageReduced: afterBreak ? -afterBreak.damage : 0,
    };
  }

  if (current.turns <= 1 || current.perDamage <= 0) {
    return { atkNeeded: 0, damageReduced: 0 };
  }

  const nextTurns = current.turns - 1;
  const targetAtk = Math.ceil(current.monHp / nextTurns) + current.monDef;
  const atkNeeded = Math.max(1, targetAtk - Math.floor(hero.atk));
  const nextInfo = getDamageInfo(monster, { ...hero, atk: Math.floor(hero.atk) + atkNeeded });
  if (!nextInfo) return null;

  return {
    atkNeeded,
    damageReduced: Math.max(0, current.damage - nextInfo.damage),
  };
}

/**
 * Computes damage saved by adding `deltaDef` defense (mota-js getDefDamage).
 */
export function getDefDamageReduction(
  monster: MonsterDef,
  hero: Pick<HeroStats, 'hp' | 'atk' | 'def'>,
  deltaDef = 1,
): number | null {
  const now = getDamageInfo(monster, hero);
  if (!now) return null;
  const next = getDamageInfo(monster, { ...hero, def: hero.def + deltaDef });
  if (!next) return null;
  return Math.max(0, now.damage - next.damage);
}

export function formatCompactDamage(damage: number | null): string {
  if (damage === null) return '???';
  if (damage >= 100000) return `${Math.floor(damage / 10000)}w`;
  if (damage >= 10000) return `${(damage / 1000).toFixed(0)}k`;
  if (damage >= 1000) return `${(damage / 1000).toFixed(1)}k`;
  return String(damage);
}
