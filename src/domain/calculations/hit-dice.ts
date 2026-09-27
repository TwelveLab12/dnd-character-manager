import type { Character } from "../character";
import { findClassDefinition } from "../character-class";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { applyHealing } from "./hit-points";
import { computeMaxHitPoints } from "./max-hit-points";
import { abilityModifier } from "./modifiers";
import { clampCharacterLevel } from "./proficiency";

/** Réserve de dés de vie (règles 2014, docs/adr/0059) : un dé de la classe par niveau. */
export interface HitDice {
  /** Nombre de faces du dé de vie de la classe (ex : 10 pour d10). */
  die: number;
  total: number;
  used: number;
  remaining: number;
  /** Modificateur de Constitution effectif, ajouté à chaque dé dépensé. */
  constitution: number;
}

/** Dés de vie du personnage, `undefined` pour une classe hors registre (dé inconnu). */
export function computeHitDice(character: Character): HitDice | undefined {
  const die = findClassDefinition(character.classId)?.hitDie;
  if (die === undefined) {
    return undefined;
  }
  const total = clampCharacterLevel(character.level);
  const used = Math.min(total, Math.max(0, Math.trunc(character.hitDiceUsed ?? 0)));
  const constitution = abilityModifier(
    effectiveAbilityScores(character.abilityScores, character.raceSelection).constitution,
  );
  return { die, total, used, remaining: total - used, constitution };
}

/** Résultat valide d'un dé de vie : entier entre 1 et le nombre de faces. */
export function isValidHitDieRoll(roll: number, die: number): boolean {
  return Number.isInteger(roll) && roll >= 1 && roll <= die;
}

/** PV rendus par un dé de vie dépensé : jet + mod. de Constitution, jamais négatif. */
export function hitDieHealing(roll: number, constitution: number): number {
  return Math.max(0, roll + constitution);
}

/** Jet d'un dé à `faces` faces ; `random` est injectable pour les tests. */
export function rollDie(faces: number, random: () => number = Math.random): number {
  return Math.min(faces, Math.floor(random() * faces) + 1);
}

/**
 * Dépense des dés de vie pendant un repos court : chaque jet valide, dans la limite des dés
 * restants, rend jet + Con, plafonné aux PV max. Les jets invalides ou en trop sont ignorés.
 */
export function spendHitDice(character: Character, rolls: readonly number[]): Partial<Character> {
  const hitDice = computeHitDice(character);
  if (!hitDice) {
    return {};
  }
  const spent = rolls
    .filter((roll) => isValidHitDieRoll(roll, hitDice.die))
    .slice(0, hitDice.remaining);
  if (spent.length === 0) {
    return {};
  }
  const healing = spent.reduce((sum, roll) => sum + hitDieHealing(roll, hitDice.constitution), 0);
  return {
    hitDiceUsed: hitDice.used + spent.length,
    hitPoints: applyHealing(character.hitPoints, healing, computeMaxHitPoints(character).total),
  };
}

/** Dés de vie récupérés à un repos long : la moitié du niveau, au moins 1. */
export function hitDiceRecoveredOnLongRest(level: number): number {
  return Math.max(1, Math.floor(clampCharacterLevel(level) / 2));
}

/** Dés de vie dépensés après un repos long (jamais négatif). */
export function hitDiceUsedAfterLongRest(character: Character): number {
  const used = Math.max(0, Math.trunc(character.hitDiceUsed ?? 0));
  return Math.max(0, used - hitDiceRecoveredOnLongRest(character.level));
}
