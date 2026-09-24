import type { CharacterFeature, FeatureRecharge } from "@/domain/feature";

export const FEATURE_RECHARGE_LABELS: Record<FeatureRecharge, string> = {
  shortRest: "Repos court",
  longRest: "Repos long",
  other: "Autre",
};

/** Capacité à compteur propre (ex : Yeux de la nuit), mise en avant en mode jeu. Les capacités
 * liées à une ressource de classe puisent dans la réserve commune (HUD) et n'en font pas partie. */
export function hasOwnUses(feature: CharacterFeature): boolean {
  return feature.usesMax !== undefined && feature.usesMax > 0 && !feature.resourceId;
}
