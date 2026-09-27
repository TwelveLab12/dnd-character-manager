import type { DamageType } from "../inventory";
import type { ExtraDamage, RollTerm, WeaponAttack } from "./weapon-attack";

/**
 * Résolution d'une attaque d'arme (règles 2014, docs/adr/0062) : jet d'attaque (d20 + bonus, avec
 * avantage ou désavantage), comparaison facultative à la CA de la cible, puis jet de dégâts (dés
 * doublés sur un coup critique, pas les bonus).
 */
export type RollMode = "normal" | "advantage" | "disadvantage";

export interface AttackRollResult {
  /** Dés d20 lancés (deux avec avantage ou désavantage). */
  dice: number[];
  /** Dé retenu : le plus haut avec avantage, le plus bas avec désavantage. */
  kept: number;
  total: number;
  terms: RollTerm[];
  /** 20 naturel : touche toujours, dés de dégâts doublés. */
  critical: boolean;
  /** 1 naturel : rate toujours. */
  fumble: boolean;
  /** Issue face à la CA de la cible, `undefined` sans CA connue (le MJ tranche). */
  hit?: boolean;
}

export interface DamageRollResult {
  /** Dés lancés, ex : « 2d8 » sur un coup critique. */
  dice: string;
  diceTotal: number;
  terms: RollTerm[];
  total: number;
}

const DICE_PATTERN = /^(\d+)d(\d+)$/;

export function parseDice(dice: string): { count: number; faces: number } | undefined {
  const match = DICE_PATTERN.exec(dice.trim());
  return match ? { count: Number(match[1]), faces: Number(match[2]) } : undefined;
}

/** Dés d'un coup critique : le nombre de dés est doublé (« 1d8 » → « 2d8 »). */
export function criticalDice(dice: string): string {
  const parsed = parseDice(dice);
  return parsed ? `${parsed.count * 2}d${parsed.faces}` : dice;
}

/** Bornes d'un jet de dés, pour valider une saisie. */
export function diceRange(dice: string): { min: number; max: number } | undefined {
  const parsed = parseDice(dice);
  return parsed ? { min: parsed.count, max: parsed.count * parsed.faces } : undefined;
}

/** Lance des dés « NdM » : un résultat par dé. `random` est injectable pour les tests. */
export function rollDice(dice: string, random: () => number = Math.random): number[] {
  const parsed = parseDice(dice);
  if (!parsed) {
    return [];
  }
  return Array.from({ length: parsed.count }, () =>
    Math.min(parsed.faces, Math.floor(random() * parsed.faces) + 1),
  );
}

function sum(terms: readonly RollTerm[]): number {
  return terms.reduce((total, term) => total + term.value, 0);
}

export function resolveAttackRoll(
  attack: WeaponAttack,
  dice: readonly number[],
  mode: RollMode,
  targetArmorClass?: number,
): AttackRollResult {
  const kept =
    mode === "advantage"
      ? Math.max(...dice)
      : mode === "disadvantage"
        ? Math.min(...dice)
        : dice[0]!;
  const total = kept + sum(attack.attackTerms);
  const critical = kept === 20;
  const fumble = kept === 1;
  let hit: boolean | undefined;
  if (critical) {
    hit = true;
  } else if (fumble) {
    hit = false;
  } else if (targetArmorClass !== undefined) {
    hit = total >= targetArmorClass;
  }
  return {
    dice: [...dice],
    kept,
    total,
    terms: attack.attackTerms,
    critical,
    fumble,
    ...(hit !== undefined ? { hit } : {}),
  };
}

/** Dégâts : total des dés (doublés sur un critique) + modificateurs, jamais négatif. */
export function resolveDamageRoll(
  attack: WeaponAttack,
  diceTotal: number,
  critical: boolean,
): DamageRollResult {
  return {
    dice: critical ? criticalDice(attack.damageDice) : attack.damageDice,
    diceTotal,
    terms: attack.damageTerms,
    total: Math.max(0, diceTotal + sum(attack.damageTerms)),
  };
}

export interface ExtraDamageRollResult {
  label: string;
  /** Dés lancés, doublés sur un coup critique. */
  dice: string;
  damageType: DamageType;
  total: number;
}

/** Dégâts supplémentaires d'un autre type (docs/adr/0069) : dés doublés sur un critique, sans
 * modificateur. */
export function resolveExtraDamageRoll(
  extra: ExtraDamage,
  diceTotal: number,
  critical: boolean,
): ExtraDamageRollResult {
  return {
    label: extra.label,
    dice: critical ? criticalDice(extra.dice) : extra.dice,
    damageType: extra.damageType,
    total: Math.max(0, diceTotal),
  };
}
