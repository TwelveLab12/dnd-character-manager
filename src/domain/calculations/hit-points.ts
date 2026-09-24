import type { HitPoints } from "../character";

/** Inflige des dégâts : absorbés par les PV temporaires d'abord, puis les PV courants (plancher 0). */
export function applyDamage(hitPoints: HitPoints, amount: number): HitPoints {
  const damage = Math.max(0, amount);
  const absorbedByTemporary = Math.min(hitPoints.temporary, damage);
  const remaining = damage - absorbedByTemporary;
  return {
    ...hitPoints,
    temporary: hitPoints.temporary - absorbedByTemporary,
    current: Math.max(0, hitPoints.current - remaining),
  };
}

/** Soigne les PV courants, plafonnés au maximum calculé (voir computeMaxHitPoints). Ne touche pas
 * les PV temporaires. */
export function applyHealing(hitPoints: HitPoints, amount: number, max: number): HitPoints {
  const healing = Math.max(0, amount);
  return { ...hitPoints, current: Math.min(max, hitPoints.current + healing) };
}

/**
 * Fixe les PV temporaires à une valeur absolue (plancher 0). Le widget de PV en mode jeu affiche
 * la valeur actuelle et permet de la corriger directement — le "pas de cumul" RAW (les PV
 * temporaires ne s'additionnent pas) reste de la responsabilité du joueur, qui compare lui-même
 * avant de saisir une nouvelle valeur, comme sur une fiche papier.
 */
export function setTemporaryHitPoints(hitPoints: HitPoints, amount: number): HitPoints {
  return { ...hitPoints, temporary: Math.max(0, amount) };
}

/** Fixe les PV courants à une valeur absolue, bornée à [0, max]. Ne touche pas temporary. */
export function setCurrentHitPoints(hitPoints: HitPoints, value: number, max: number): HitPoints {
  return { ...hitPoints, current: Math.max(0, Math.min(max, value)) };
}
