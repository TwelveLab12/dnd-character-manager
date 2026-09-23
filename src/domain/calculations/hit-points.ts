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

/** Soigne les PV courants, plafonnés au maximum. Ne touche pas les PV temporaires. */
export function applyHealing(hitPoints: HitPoints, amount: number): HitPoints {
  const healing = Math.max(0, amount);
  return { ...hitPoints, current: Math.min(hitPoints.max, hitPoints.current + healing) };
}

/** Les PV temporaires ne s'additionnent pas en RAW : on garde la plus grande des deux valeurs. */
export function setTemporaryHitPoints(hitPoints: HitPoints, amount: number): HitPoints {
  return { ...hitPoints, temporary: Math.max(hitPoints.temporary, Math.max(0, amount)) };
}
