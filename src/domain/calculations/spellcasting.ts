import { abilityModifier } from "./modifiers";
import { clampCharacterLevel, proficiencyBonusForLevel } from "./proficiency";

/** DD de sauvegarde de sort D&D 5e : 8 + bonus de maîtrise + modificateur de la caractéristique d'incantation. */
export function spellSaveDC(proficiencyBonus: number, castingAbilityModifier: number): number {
  return 8 + proficiencyBonus + castingAbilityModifier;
}

/** Bonus d'attaque de sort D&D 5e : bonus de maîtrise + modificateur de la caractéristique d'incantation. */
export function spellAttackBonus(proficiencyBonus: number, castingAbilityModifier: number): number {
  return proficiencyBonus + castingAbilityModifier;
}

/**
 * DD affiché sur la fiche : l'override du personnage prime toujours sur le calcul théorique (la
 * feuille source fige parfois une valeur qui diverge — voir `SpellcastingInfo.spellSaveDCOverride`
 * dans src/domain/character.ts). Le niveau est ramené dans la plage valide pour ne jamais planter
 * sur une saisie de formulaire momentanément invalide.
 */
export function resolvedSpellSaveDC(
  level: number,
  abilityScore: number,
  override?: number,
): number {
  if (override !== undefined) {
    return override;
  }
  return spellSaveDC(
    proficiencyBonusForLevel(clampCharacterLevel(level)),
    abilityModifier(abilityScore),
  );
}

/** Voir resolvedSpellSaveDC — même logique de priorité pour le bonus d'attaque de sort. */
export function resolvedSpellAttackBonus(
  level: number,
  abilityScore: number,
  override?: number,
): number {
  if (override !== undefined) {
    return override;
  }
  return spellAttackBonus(
    proficiencyBonusForLevel(clampCharacterLevel(level)),
    abilityModifier(abilityScore),
  );
}
