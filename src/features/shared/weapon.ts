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

/** Résumé compact d'une attaque, ex : « +5 · 1d8+3 tranchant (1d10+3 à deux mains) ». */
export function formatWeaponAttack(attack: WeaponAttack): string {
  const versatile = attack.versatileDamage ? ` (${attack.versatileDamage} à deux mains)` : "";
  return `${formatModifier(attack.attackBonus)} · ${attack.damage} ${DAMAGE_TYPE_LABELS[attack.damageType]}${versatile}`;
}
