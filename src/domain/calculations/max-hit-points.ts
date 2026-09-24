import type { Character } from "../character";
import { findClassDefinition } from "../character-class";
import { characterFeats } from "../feat";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { abilityModifier } from "./modifiers";
import { clampCharacterLevel } from "./proficiency";

export interface LevelHitPoints {
  level: number;
  /** Valeur du dé retenue : maximum au niveau 1, fixe ou lancée ensuite. */
  die: number;
  constitution: number;
  /** Bonus par niveau hors classe (dons…), ajouté après le plancher de 1. */
  bonus: number;
  /** Gain du niveau : max(1, dé + Con) + bonus. */
  total: number;
  /** Mode « dés lancés » sans résultat saisi pour ce niveau : valeur fixe utilisée. */
  missingRoll?: boolean;
}

export interface MaxHitPointsResult {
  total: number;
  /** Sources des bonus par niveau (ex : « Robuste +2 »). */
  bonusSources: { name: string; perLevel: number }[];
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
 * au moins 1 par niveau, plus les bonus par niveau des dons (ex : Robuste +2). La Constitution effective s'applique à tous les niveaux : une hausse de
 * Constitution augmente donc les PV max rétroactivement, comme le veut la règle.
 */
export function computeMaxHitPoints(character: Character): MaxHitPointsResult {
  const hitDie = findClassDefinition(character.classId)?.hitDie;
  if (hitDie === undefined) {
    return {
      total: Math.max(1, character.baseMaxHitPoints ?? 1),
      bonusSources: [],
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
  const bonusSources = characterFeats(character.featIds).flatMap((feat) =>
    feat.hitPointsPerLevel ? [{ name: feat.name, perLevel: feat.hitPointsPerLevel }] : [],
  );
  const bonus = bonusSources.reduce((sum, source) => sum + source.perLevel, 0);

  const levels: LevelHitPoints[] = Array.from({ length: level }, (_, index) => {
    const current = index + 1;
    if (current === 1) {
      return {
        level: 1,
        die: hitDie,
        constitution,
        bonus,
        total: Math.max(1, hitDie + constitution) + bonus,
      };
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
      bonus,
      total: Math.max(1, die + constitution) + bonus,
      ...(missingRoll ? { missingRoll } : {}),
    };
  });

  return {
    total: levels.reduce((sum, entry) => sum + entry.total, 0),
    bonusSources,
    hitDie,
    method,
    levels,
    warnings,
  };
}
