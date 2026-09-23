/** Affiche un modificateur signé (+3, -1, +0) comme sur une fiche D&D papier. */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/** Niveau de personnage ramené dans la plage valide 1-20, pour des calculs dérivés qui ne doivent
 * jamais planter l'affichage sur une saisie de formulaire momentanément invalide. */
export function clampCharacterLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 1;
  }
  return Math.min(20, Math.max(1, Math.trunc(level)));
}
