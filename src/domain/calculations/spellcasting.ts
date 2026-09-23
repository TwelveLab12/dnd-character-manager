/** DD de sauvegarde de sort D&D 5e : 8 + bonus de maîtrise + modificateur de la caractéristique d'incantation. */
export function spellSaveDC(proficiencyBonus: number, castingAbilityModifier: number): number {
  return 8 + proficiencyBonus + castingAbilityModifier;
}

/** Bonus d'attaque de sort D&D 5e : bonus de maîtrise + modificateur de la caractéristique d'incantation. */
export function spellAttackBonus(proficiencyBonus: number, castingAbilityModifier: number): number {
  return proficiencyBonus + castingAbilityModifier;
}
