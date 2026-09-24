import type { AbilityName } from "../ability-scores";
import type { Character } from "../character";
import type { DamageType, InventoryItem, WeaponRange } from "../inventory";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { abilityModifier } from "./modifiers";
import { clampCharacterLevel, proficiencyBonusForLevel } from "./proficiency";

const DICE_PATTERN = /^\d+d\d+$/;

export interface WeaponAttack {
  itemId: string;
  name: string;
  range: WeaponRange;
  ability: AbilityName;
  proficient: boolean;
  attackBonus: number;
  /** Ex : « 1d8+3 », « 1d6-1 », « 2d6 ». */
  damage: string;
  versatileDamage?: string;
  damageType: DamageType;
}

/** Dés valides au format « NdM » (ex : 1d8, 2d6), sans modificateur. */
export function isValidDamageDice(dice: string): boolean {
  return DICE_PATTERN.test(dice.trim());
}

/** Formule de dégâts « 1d8+3 » : le modificateur est omis quand il vaut 0. */
export function formatDamage(dice: string, modifier: number): string {
  const base = dice.trim();
  if (modifier === 0) {
    return base;
  }
  return `${base}${modifier > 0 ? "+" : "-"}${Math.abs(modifier)}`;
}

/**
 * Jet d'attaque et dégâts d'une arme (règles 5e 2014) :
 * - caractéristique : Force au corps à corps, Dextérité à distance, la meilleure des deux pour une
 *   arme de finesse ;
 * - attaque = mod + bonus de maîtrise (si la catégorie courante/de guerre est maîtrisée) + bonus
 *   magique ;
 * - dégâts = dé(s) + mod + bonus magique (dé polyvalent en option pour l'usage à deux mains).
 * Retourne `undefined` pour un objet qui n'est pas une arme.
 */
export function computeWeaponAttack(
  character: Character,
  item: InventoryItem,
): WeaponAttack | undefined {
  const { weapon } = item;
  if (!weapon) {
    return undefined;
  }

  const scores = effectiveAbilityScores(character.abilityScores, character.raceSelection);
  const strength = abilityModifier(scores.strength);
  const dexterity = abilityModifier(scores.dexterity);

  let ability: AbilityName = weapon.range === "ranged" ? "dexterity" : "strength";
  if (weapon.finesse) {
    ability = dexterity > strength ? "dexterity" : "strength";
  }
  const modifier = ability === "dexterity" ? dexterity : strength;

  const proficient = (character.weaponProficiencies ?? []).includes(weapon.category);
  const proficiencyBonus = proficient
    ? proficiencyBonusForLevel(clampCharacterLevel(character.level))
    : 0;
  const magicBonus = weapon.magicBonus ?? 0;
  const damageModifier = modifier + magicBonus;

  return {
    itemId: item.id,
    name: item.name,
    range: weapon.range,
    ability,
    proficient,
    attackBonus: modifier + proficiencyBonus + magicBonus,
    damage: formatDamage(weapon.damageDice, damageModifier),
    ...(weapon.versatileDamageDice
      ? { versatileDamage: formatDamage(weapon.versatileDamageDice, damageModifier) }
      : {}),
    damageType: weapon.damageType,
  };
}

/** Attaques des armes équipées, corps à corps d'abord puis distance, dans l'ordre d'inventaire. */
export function computeWeaponAttacks(character: Character): WeaponAttack[] {
  const attacks = character.inventory
    .filter((item) => item.equipped === true)
    .map((item) => computeWeaponAttack(character, item))
    .filter((attack): attack is WeaponAttack => attack !== undefined);
  return [
    ...attacks.filter((attack) => attack.range === "melee"),
    ...attacks.filter((attack) => attack.range === "ranged"),
  ];
}
