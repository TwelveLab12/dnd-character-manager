import type { AbilityName, AbilityScores } from "../ability-scores";
import type { RaceDefinition, RaceSelection } from "../race";
import { findRaceDefinition } from "../race";

/**
 * Applique les règles de bonus d'une définition de race aux scores de base. Séparée de
 * `effectiveAbilityScores` pour rester testable avec une `RaceDefinition` synthétique, sans
 * dépendre du registre global `RACE_DEFINITIONS`.
 */
export function applyRaceBonuses(
  baseScores: AbilityScores,
  race: RaceDefinition,
  abilityBonusChoices: AbilityName[],
): AbilityScores {
  const result: AbilityScores = { ...baseScores };
  let choiceIndex = 0;

  for (const rule of race.abilityBonusRules) {
    if (rule.type === "fixed") {
      result[rule.ability] += rule.amount;
      continue;
    }
    const eligible = abilityBonusChoices
      .slice(choiceIndex, choiceIndex + rule.count)
      .filter((ability) => !rule.exclude?.includes(ability));
    for (const ability of eligible) {
      result[ability] += rule.amount;
    }
    choiceIndex += rule.count;
  }

  return result;
}

/**
 * Combine les scores de base saisis par le joueur avec les bonus de la race choisie (voir
 * src/domain/race.ts) pour obtenir les scores effectifs à utiliser dans tous les calculs
 * (modificateurs, jets de sauvegarde, compétences, DD/bonus de sort). Les scores de base restent
 * la seule chose éditée par le joueur ; les bonus raciaux ne sont jamais stockés en dur dedans,
 * pour rester recalculables si la race change.
 */
export function effectiveAbilityScores(
  baseScores: AbilityScores,
  raceSelection: RaceSelection | undefined,
): AbilityScores {
  if (!raceSelection) {
    return baseScores;
  }
  const race = findRaceDefinition(raceSelection.raceId);
  if (!race) {
    return baseScores;
  }
  return applyRaceBonuses(baseScores, race, raceSelection.abilityBonusChoices);
}
