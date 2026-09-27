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

/** Manuelles et actives : effets de CA qu'un repos long désactive (docs/adr/0065). */
export function activeManualArmorClassEffects(character: Character) {
  return (character.armorClassEffects ?? []).filter(
    (effect) => effect.trigger.type === "manual" && effect.trigger.active,
  );
}

/**
 * Repos court : dépense les dés de vie lancés (`hitDieRolls`, un jet par dé — voir spendHitDice)
 * et restaure les capacités et les ressources de classe (ex : Canalisation divine) récupérées au
 * repos court. Ne touche pas aux emplacements de sorts (réservés au repos long). Une heure passe :
 * la concentration prend fin, sauf `keepConcentration` pour un sort plus long (docs/adr/0065).
 */
export function applyShortRest(
  character: Character,
  hitDieRolls: readonly number[] = [],
  { keepConcentration = false }: { keepConcentration?: boolean } = {},
): Partial<Character> {
  return {
    ...spendHitDice(character, hitDieRolls),
    ...(keepConcentration ? {} : { concentration: { active: false } }),
    features: resetFeaturesForRecharge(character.features, ["shortRest"]),
    classResourcesUsed: restoreClassResources(character, "shortRest"),
    // Une rage dure 1 minute : un repos y met toujours fin.
    raging: undefined,
  };
}

/**
 * Repos long : PV courants restaurés au maximum et PV temporaires perdus (ils durent jusqu'à un
 * repos long), dés de vie récupérés à hauteur de la moitié du niveau (au moins 1), emplacements de
 * sorts vidés, capacités et ressources de classe restaurées — y compris celles du repos court. Le
 * sommeil met fin à la concentration, et les effets de CA manuels (Armure du mage…) prennent fin
 * (docs/adr/0065).
 */
export function applyLongRest(character: Character): Partial<Character> {
  return {
    hitPoints: { current: computeMaxHitPoints(character).total, temporary: 0 },
    concentration: { active: false },
    ...(character.armorClassEffects
      ? {
          armorClassEffects: character.armorClassEffects.map((effect) =>
            effect.trigger.type === "manual" && effect.trigger.active
              ? { ...effect, trigger: { type: "manual" as const, active: false } }
              : effect,
          ),
        }
      : {}),
    hitDiceUsed: hitDiceUsedAfterLongRest(character),
    // PV au maximum : plus de jets contre la mort en cours.
    deathSaves: undefined,
    stable: undefined,
    spellSlotsUsed: {},
    features: resetFeaturesForRecharge(character.features, ["shortRest", "longRest"]),
    classResourcesUsed: restoreClassResources(character, "longRest"),
    raging: undefined,
  };
}
