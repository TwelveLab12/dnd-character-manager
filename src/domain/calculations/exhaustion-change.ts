import type { Character } from "../character";
import { MAX_EXHAUSTION } from "./exhaustion";
import { computeMaxHitPoints } from "./max-hit-points";

/**
 * Fixe le niveau d'épuisement (0 à 6). Les PV actuels sont ramenés au nouveau maximum s'ils le
 * dépassent (épuisement 4 : PV max / 2) ; ils ne remontent pas quand l'épuisement baisse
 * (docs/adr/0066).
 */
export function setExhaustion(character: Character, level: number): Partial<Character> {
  const exhaustion = Math.min(MAX_EXHAUSTION, Math.max(0, Math.trunc(level)));
  const next = { ...character, exhaustion };
  const max = computeMaxHitPoints(next).total;
  return {
    exhaustion: exhaustion === 0 ? undefined : exhaustion,
    ...(character.hitPoints.current > max
      ? { hitPoints: { ...character.hitPoints, current: max } }
      : {}),
  };
}
