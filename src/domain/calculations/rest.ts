import type { Character } from "../character";
import type { CharacterFeature, FeatureRecharge } from "../feature";
import { restoreClassResources } from "./class-resources";
import { hitDiceUsedAfterLongRest, spendHitDice } from "./hit-dice";
import { computeMaxHitPoints } from "./max-hit-points";

function resetFeaturesForRecharge(
  features: CharacterFeature[],
  recharges: readonly FeatureRecharge[],
): CharacterFeature[] {
  return features.map((feature) =>
    feature.recharge !== undefined &&
    recharges.includes(feature.recharge) &&
    feature.usesMax !== undefined
      ? { ...feature, usesCurrent: feature.usesMax }
      : feature,
  );
}

/**
 * Repos court : dépense les dés de vie lancés (`hitDieRolls`, un jet par dé — voir spendHitDice)
 * et restaure les capacités et les ressources de classe (ex : Canalisation divine) récupérées au
 * repos court. Ne touche pas aux emplacements de sorts (réservés au repos long).
 */
export function applyShortRest(
  character: Character,
  hitDieRolls: readonly number[] = [],
): Partial<Character> {
  return {
    ...spendHitDice(character, hitDieRolls),
    features: resetFeaturesForRecharge(character.features, ["shortRest"]),
    classResourcesUsed: restoreClassResources(character, "shortRest"),
    // Une rage dure 1 minute : un repos y met toujours fin.
    raging: undefined,
  };
}

/**
 * Repos long : PV courants restaurés au maximum (les PV temporaires ne sont pas remboursés — ils
 * disparaissent normalement avant le prochain repos), dés de vie récupérés à hauteur de la moitié
 * du niveau (au moins 1), emplacements de sorts vidés, capacités et ressources de classe restaurées
 * — y compris celles du repos court, qu'un repos long récupère aussi.
 */
export function applyLongRest(character: Character): Partial<Character> {
  return {
    hitPoints: { ...character.hitPoints, current: computeMaxHitPoints(character).total },
    hitDiceUsed: hitDiceUsedAfterLongRest(character),
    spellSlotsUsed: {},
    features: resetFeaturesForRecharge(character.features, ["shortRest", "longRest"]),
    classResourcesUsed: restoreClassResources(character, "longRest"),
    raging: undefined,
  };
}
