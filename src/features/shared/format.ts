/** Affiche un modificateur signé (+3, -1, +0) comme sur une fiche D&D papier. */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}
