/**
 * Magic Tower combat, damage preview, and critical-threshold formulas.
 *
 * Adapted from ckcz123/mota-js (BSD-3-Clause License, Copyright (c) 2018, ckcz123):
 *   - libs/enemys.js (nextCriticals, getDefDamage, canBattle)
 *   - project/functions.js (getEnemyInfo, getDamageInfo)
 */

import type { CriticalInfo, DamageInfo, HeroStats, MonsterDef, MonsterSpecial } from './types';

export const SPECIAL_META: Record<MonsterSpecial, { name: string; desc: string }> = {
  firstStrike: { name: '先攻', desc: '战斗开始时怪物先攻击一次，堆防收益高' },
  magic: { name: '魔攻', desc: '攻击完全无视勇者防御，需堆攻击速杀' },
  solid: { name: '坚固', desc: '防御不低于勇者攻击 - 1，需堆防御防杀' },
  doubleHit: { name: '2连击', desc: '每回合连续攻击 2 次，防御阈值收益翻倍' },
  tripleHit: { name: '3连击', desc: '每回合连续攻击 3 次，极度考验防御临界' },
  vampire: { name: '吸血', desc: '战前吸取当前生命固定比例，残血击杀最赚' },
  armorBreak: { name: '破甲', desc: '无视勇者部分防御（默认 40%），攻防需兼顾' },
  berserk: { name: '狂暴', desc: '每回合攻击递增（默认 +12%），拖回合会滚雪球' },
  thorns: { name: '反伤', desc: '每次非致死受击反弹真实伤害，缩短回合最关键' },
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

  const turns = Math.ceil(monHp / heroPerDamage);
  const enemyAttacks = Math.max(0, turns - 1);

  const effDef = hasSpecial(monster, 'magic')
    ? 0
    : hasSpecial(monster, 'armorBreak')
      ? Math.floor(heroDef * (1 - (monster.armorBreakRatio ?? 0.4)))
      : heroDef;

  const hitMul = hasSpecial(monster, 'tripleHit') ? 3 : hasSpecial(monster, 'doubleHit') ? 2 : 1;
  const thornsPerHit = hasSpecial(monster, 'thorns')
    ? Math.max(1, Math.floor(monAtk * (monster.thornsRatio ?? 0.25)))
    : 0;
  const berserkRate = hasSpecial(monster, 'berserk') ? (monster.berserkRate ?? 0.12) : 0;

  const roundStrikeDamage = (roundIndex: number): number => {
    const scaledAtk = berserkRate > 0 ? Math.floor(monAtk * (1 + berserkRate * roundIndex)) : monAtk;
    return Math.max(0, scaledAtk - effDef) * hitMul;
  };

  let initDamage = 0;
  if (hasSpecial(monster, 'vampire')) {
    const ratio = monster.vampireRatio ?? 0.25;
    initDamage += Math.floor(heroHp * ratio);
  }
  if (hasSpecial(monster, 'firstStrike')) {
    initDamage += roundStrikeDamage(0);
  }

  let turnDamage = 0;
  for (let i = 0; i < enemyAttacks; i += 1) {
    turnDamage += roundStrikeDamage(i) + thornsPerHit;
  }

  const perDamage = roundStrikeDamage(0) + thornsPerHit;
  const damage = Math.max(0, Math.floor(initDamage + turnDamage));

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

  if (current.turns <= 1 || current.damage <= current.initDamage) {
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
