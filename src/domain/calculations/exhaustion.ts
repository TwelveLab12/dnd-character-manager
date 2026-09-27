import type { Character } from "../character";

/**
 * Épuisement (règles 2014, docs/adr/0066) : six niveaux aux effets cumulés. Un repos long en
 * retire un, à condition d'avoir mangé et bu.
 */
export const MAX_EXHAUSTION = 6;

/** Effet ajouté par chaque niveau, dans les mots du joueur. */
export const EXHAUSTION_EFFECTS: Record<number, string> = {
  1: "Désavantage aux tests de caractéristique (compétences comprises)",
  2: "Vitesse divisée par 2",
  3: "Désavantage aux jets d'attaque et de sauvegarde",
  4: "PV max divisés par 2",
  5: "Vitesse à 0",
  6: "Mort",
};

export function exhaustionLevel(character: Pick<Character, "exhaustion">): number {
  const level = Math.trunc(character.exhaustion ?? 0);
  return Number.isFinite(level) ? Math.min(MAX_EXHAUSTION, Math.max(0, level)) : 0;
}

/** Effets actifs, du niveau 1 au niveau atteint. */
export function activeExhaustionEffects(level: number): string[] {
  return Array.from(
    { length: Math.min(level, MAX_EXHAUSTION) },
    (_, index) => EXHAUSTION_EFFECTS[index + 1]!,
  );
}

/** Niveau 1+ : désavantage aux tests de caractéristique. */
export function hasCheckDisadvantage(character: Pick<Character, "exhaustion">): boolean {
  return exhaustionLevel(character) >= 1;
}

/** Niveau 3+ : désavantage aux jets d'attaque et de sauvegarde. */
export function hasAttackAndSaveDisadvantage(character: Pick<Character, "exhaustion">): boolean {
  return exhaustionLevel(character) >= 3;
}
