/** Bonus de maîtrise D&D 5e pour un niveau de personnage donné (1-20). */
export function proficiencyBonusForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new RangeError(`Invalid character level: ${level}`);
  }
  return 2 + Math.floor((level - 1) / 4);
}

/** Niveau de personnage ramené dans la plage valide 1-20, pour des calculs dérivés qui ne doivent
 * jamais planter sur une saisie de formulaire momentanément invalide (ex : champ vidé pendant la
 * frappe). */
export function clampCharacterLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 1;
  }
  return Math.min(20, Math.max(1, Math.trunc(level)));
}
