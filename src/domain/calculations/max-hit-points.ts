import type { Character } from "../character";
import { findClassDefinition } from "../character-class";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { abilityModifier } from "./modifiers";
import { clampCharacterLevel } from "./proficiency";

export interface LevelHitPoints {
  level: number;
  /** Valeur du dé retenue : maximum au niveau 1, fixe ou lancée ensuite. */
  die: number;
  constitution: number;
  /** Gain du niveau, au moins 1. */
  total: number;
  /** Mode « dés lancés » sans résultat saisi pour ce niveau : valeur fixe utilisée. */
  missingRoll?: boolean;
}

export interface MaxHitPointsResult {
  total: number;
  /** Dé de vie de la classe, absent pour une classe hors registre (PV max saisis). */
  hitDie?: number;
  method: "fixed" | "rolled" | "manual";
  levels: LevelHitPoints[];
  warnings: string[];
}

/** Gain fixe par niveau après le 1er (règles 2014) : moitié du dé de vie + 1 (d8 → 5). */
export function fixedHitDieValue(hitDie: number): number {
  return hitDie / 2 + 1;
}

/**
 * PV max (règles 2014) : au niveau 1, maximum du dé de vie + mod. de Constitution ; à chaque
 * niveau suivant, valeur fixe (moitié du dé + 1) ou résultat du dé saisi, + mod. de Constitution,
 * au moins 1 par niveau. La Constitution effective s'applique à tous les niveaux : une hausse de
 * Constitution augmente donc les PV max rétroactivement, comme le veut la règle.
 */
export function computeMaxHitPoints(character: Character): MaxHitPointsResult {
  const hitDie = findClassDefinition(character.classId)?.hitDie;
  if (hitDie === undefined) {
    return {
      total: Math.max(1, character.baseMaxHitPoints ?? 1),
      method: "manual",
      levels: [],
      warnings: [],
    };
  }

  const level = clampCharacterLevel(character.level);
  const constitution = abilityModifier(
    effectiveAbilityScores(character.abilityScores, character.raceSelection).constitution,
  );
  const method = character.hitPointMethod ?? "fixed";
  const rolls = character.hitPointRolls ?? [];
  const warnings: string[] = [];

  const levels: LevelHitPoints[] = Array.from({ length: level }, (_, index) => {
    const current = index + 1;
    if (current === 1) {
      return { level: 1, die: hitDie, constitution, total: Math.max(1, hitDie + constitution) };
    }
    const roll = rolls[index - 1];
    const validRoll =
      roll !== undefined && Number.isInteger(roll) && roll >= 1 && roll <= hitDie
        ? roll
        : undefined;
    const missingRoll = method === "rolled" && validRoll === undefined;
    if (missingRoll) {
      warnings.push(
        `Niveau ${current} : résultat du d${hitDie} non saisi, valeur fixe (${fixedHitDieValue(hitDie)}) utilisée.`,
      );
    }
    const die =
      method === "rolled" && validRoll !== undefined ? validRoll : fixedHitDieValue(hitDie);
    return {
      level: current,
      die,
      constitution,
      total: Math.max(1, die + constitution),
      ...(missingRoll ? { missingRoll } : {}),
    };
  });

  return {
    total: levels.reduce((sum, entry) => sum + entry.total, 0),
    hitDie,
    method,
    levels,
    warnings,
  };
}
