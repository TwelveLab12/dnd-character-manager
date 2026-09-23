/** Modificateur de caractéristique D&D 5e : floor((score - 10) / 2). */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
