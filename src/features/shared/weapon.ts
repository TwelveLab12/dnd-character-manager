import type { WeaponAttack } from "@/domain/calculations/weapon-attack";
import type { DamageType, WeaponCategory, WeaponRange } from "@/domain/inventory";
import { formatModifier } from "./format";

export const WEAPON_CATEGORY_LABELS: Record<WeaponCategory, string> = {
  simple: "courante",
  martial: "de guerre",
};

export const WEAPON_RANGE_LABELS: Record<WeaponRange, string> = {
  melee: "Corps à corps",
  ranged: "Distance",
};

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  bludgeoning: "contondant",
  piercing: "perforant",
  slashing: "tranchant",
  acid: "acide",
  cold: "froid",
  fire: "feu",
  force: "force",
  lightning: "foudre",
  necrotic: "nécrotique",
  poison: "poison",
  psychic: "psychique",
  radiant: "radiant",
  thunder: "tonnerre",
};

/** Dégâts d'une attaque, ex : « 1d8+3 tranchant · 1d10+3 à deux mains ». */
export function formatWeaponDamage(attack: WeaponAttack): string {
  const versatile = attack.versatileDamage ? ` · ${attack.versatileDamage} à deux mains` : "";
  return `${attack.damage} ${DAMAGE_TYPE_LABELS[attack.damageType]}${versatile}`;
}

/** Propriétés utiles en partie, ex : [« Main secondaire (action bonus) », « Deux mains »,
 * « Lancer 6/18 m », « Arts martiaux »]. */
export function weaponAttackTags(attack: WeaponAttack): string[] {
  return [
    ...(attack.offHand ? ["Main secondaire (action bonus)"] : []),
    ...(attack.twoHanded ? ["Deux mains"] : []),
    ...(attack.thrown ? [`Lancer ${attack.thrown.normal}/${attack.thrown.long} m`] : []),
    ...(attack.martialArts ? ["Arts martiaux"] : []),
  ];
}

/** Résumé compact d'une attaque, ex : « +5 · 1d8+3 tranchant · 1d10+3 à deux mains ». */
export function formatWeaponAttack(attack: WeaponAttack): string {
  return [
    formatModifier(attack.attackBonus),
    formatWeaponDamage(attack),
    ...weaponAttackTags(attack),
  ].join(" · ");
}
