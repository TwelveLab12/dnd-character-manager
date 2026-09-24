import type { AbilityName } from "../ability-scores";
import type { Character } from "../character";
import type { SpellPreparation } from "../character-class";
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

/** Nombre maximum de sorts préparés (5e 2014) : mod. de caractéristique + niveau, minimum 1. */
export function preparedSpellsMax(level: number, castingAbilityModifier: number): number {
  return Math.max(1, castingAbilityModifier + clampCharacterLevel(level));
}

export interface ResolvedSpellcasting {
  ability: AbilityName;
  abilityModifier: number;
  proficiencyBonus: number;
  spellSaveDC: number;
  spellAttackBonus: number;
  /** « known » : tous les sorts connus sont disponibles, sans préparation (Barde, Ensorceleur). Une
   * classe hors registre est traitée comme « prepared », sans limite calculée. */
  preparation: SpellPreparation;
  /** Limite de sorts préparés (override compris), `undefined` = pas de limite. */
  preparedSpellsMax: number | undefined;
  /** Valeurs calculées, avant override, pour les afficher à côté d'une valeur forcée. */
  computed: {
    spellSaveDC: number;
    spellAttackBonus: number;
    preparedSpellsMax: number | undefined;
  };
}

/**
 * Incantation du personnage : caractéristique déduite de la classe connue (ex : Sagesse pour un
 * Clerc), sinon celle saisie pour une classe hors registre ; DD, bonus d'attaque et limite de sorts
 * préparés calculés, les surcharges (`SpellcastingInfo.*Override`) restant prioritaires.
 * `undefined` si le personnage ne lance pas de sorts.
 */
export function resolveSpellcasting(character: Character): ResolvedSpellcasting | undefined {
  const classSpellcasting = findClassDefinition(character.classId)?.spellcasting;
  const ability = classSpellcasting?.ability ?? character.spellcasting?.ability;
  if (!ability) {
    return undefined;
  }
  const overrides = character.spellcasting ?? {};
  const score = effectiveAbilityScores(character.abilityScores, character.raceSelection)[ability];
  const modifier = abilityModifier(score);
  const preparation = classSpellcasting?.preparation ?? "prepared";
  const computed = {
    spellSaveDC: resolvedSpellSaveDC(character.level, score),
    spellAttackBonus: resolvedSpellAttackBonus(character.level, score),
    preparedSpellsMax: classSpellcasting ? preparedSpellsMax(character.level, modifier) : undefined,
  };
  return {
    ability,
    abilityModifier: modifier,
    proficiencyBonus: proficiencyBonusForLevel(clampCharacterLevel(character.level)),
    spellSaveDC: overrides.spellSaveDCOverride ?? computed.spellSaveDC,
    spellAttackBonus: overrides.spellAttackBonusOverride ?? computed.spellAttackBonus,
    preparation,
    preparedSpellsMax:
      preparation === "known"
        ? undefined
        : (overrides.preparedSpellsMaxOverride ?? computed.preparedSpellsMax),
    computed,
  };
}
