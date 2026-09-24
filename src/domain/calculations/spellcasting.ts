import type { AbilityName } from "../ability-scores";
import type { Character } from "../character";
import { findClassDefinition } from "../character-class";
import { effectiveAbilityScores } from "./effective-ability-scores";
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

export interface ResolvedSpellcasting {
  ability: AbilityName;
  spellSaveDC: number;
  spellAttackBonus: number;
}

/**
 * Incantation du personnage : caractéristique déduite de la classe connue (ex : Sagesse pour un
 * Clerc), sinon celle saisie pour une classe hors registre ; DD et bonus d'attaque calculés, les
 * surcharges existantes (`spellSaveDCOverride`, `spellAttackBonusOverride`) restant prioritaires.
 * `undefined` si le personnage ne lance pas de sorts.
 */
export function resolveSpellcasting(character: Character): ResolvedSpellcasting | undefined {
  const ability =
    findClassDefinition(character.classId)?.spellcasting?.ability ??
    character.spellcasting?.ability;
  if (!ability) {
    return undefined;
  }
  const score = effectiveAbilityScores(character.abilityScores, character.raceSelection)[ability];
  return {
    ability,
    spellSaveDC: resolvedSpellSaveDC(
      character.level,
      score,
      character.spellcasting?.spellSaveDCOverride,
    ),
    spellAttackBonus: resolvedSpellAttackBonus(
      character.level,
      score,
      character.spellcasting?.spellAttackBonusOverride,
    ),
  };
}
