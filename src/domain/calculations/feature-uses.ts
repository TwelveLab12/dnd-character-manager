import type { CharacterFeature } from "../feature";

/**
 * Ajuste `usesCurrent` d'une capacité, borné à [0, usesMax]. No-op si `usesMax` n'est pas défini
 * (capacité sans limite d'utilisation suivie).
 */
export function adjustFeatureUses(feature: CharacterFeature, delta: number): CharacterFeature {
  if (feature.usesMax === undefined) {
    return feature;
  }
  const current = feature.usesCurrent ?? feature.usesMax;
  const next = Math.min(feature.usesMax, Math.max(0, current + delta));
  return { ...feature, usesCurrent: next };
}
