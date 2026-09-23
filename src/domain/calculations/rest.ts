import type { Character } from "../character";
import type { CharacterFeature, FeatureRecharge } from "../feature";

function resetFeaturesForRecharge(
  features: CharacterFeature[],
  recharge: FeatureRecharge,
): CharacterFeature[] {
  return features.map((feature) =>
    feature.recharge === recharge && feature.usesMax !== undefined
      ? { ...feature, usesCurrent: feature.usesMax }
      : feature,
  );
}

/**
 * Repos court : ne restaure que les capacités marquées `recharge: "shortRest"`. Ne touche ni aux
 * PV ni aux emplacements de sorts (réservés au repos long) — pas de dés de vie modélisés.
 */
export function applyShortRest(character: Character): Partial<Character> {
  return { features: resetFeaturesForRecharge(character.features, "shortRest") };
}

/**
 * Repos long : PV courants restaurés au maximum (les PV temporaires ne sont pas remboursés — ils
 * disparaissent normalement avant le prochain repos), emplacements de sorts vidés, capacités
 * marquées `recharge: "longRest"` restaurées.
 */
export function applyLongRest(character: Character): Partial<Character> {
  return {
    hitPoints: { ...character.hitPoints, current: character.hitPoints.max },
    spellSlots: character.spellSlots.map((slot) => ({ ...slot, used: 0 })),
    features: resetFeaturesForRecharge(character.features, "longRest"),
  };
}
