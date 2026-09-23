/** Bonus de maîtrise D&D 5e pour un niveau de personnage donné (1-20). */
export function proficiencyBonusForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new RangeError(`Invalid character level: ${level}`);
  }
  return 2 + Math.floor((level - 1) / 4);
}
