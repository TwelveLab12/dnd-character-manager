import type { Character } from "../character";
import type { CharacterFeature, FeatureRecharge } from "../feature";
import { restoreClassResources } from "./class-resources";
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
 * Repos court : restaure les capacités et les ressources de classe (ex : Canalisation divine)
 * récupérées au repos court. Ne touche ni aux PV ni aux emplacements de sorts (réservés au repos
 * long) — pas de dés de vie modélisés.
 */
export function applyShortRest(character: Character): Partial<Character> {
  return {
    features: resetFeaturesForRecharge(character.features, ["shortRest"]),
    classResourcesUsed: restoreClassResources(character, "shortRest"),
  };
}

/**
 * Repos long : PV courants restaurés au maximum (les PV temporaires ne sont pas remboursés — ils
 * disparaissent normalement avant le prochain repos), emplacements de sorts vidés, capacités et
 * ressources de classe restaurées — y compris celles du repos court, qu'un repos long récupère
 * aussi.
 */
export function applyLongRest(character: Character): Partial<Character> {
  return {
    hitPoints: { ...character.hitPoints, current: computeMaxHitPoints(character).total },
    spellSlotsUsed: {},
    features: resetFeaturesForRecharge(character.features, ["shortRest", "longRest"]),
    classResourcesUsed: restoreClassResources(character, "longRest"),
  };
}
