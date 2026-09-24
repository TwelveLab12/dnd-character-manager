/** Catégories d'armure 5e (règles 2014) — le bouclier est traité comme une catégorie à part. */
export type ArmorCategory = "light" | "medium" | "heavy" | "shield";

export const ARMOR_CATEGORIES: readonly ArmorCategory[] = ["light", "medium", "heavy", "shield"];

/**
 * Propriétés d'armure d'un objet d'inventaire. `baseArmorClass` est la CA de l'armure (ex : 16
 * pour une cotte de mailles) ou le bonus du bouclier (2) — voir
 * src/domain/calculations/armor-class.ts pour la part de Dextérité propre à chaque catégorie.
 */
export interface ArmorProperties {
  category: ArmorCategory;
  baseArmorClass: number;
  /** Force minimale d'une armure lourde : en dessous, la vitesse baisse de 3 m (10 ft). */
  strengthRequirement?: number;
}

export type WeaponCategory = "simple" | "martial";

export const WEAPON_CATEGORIES: readonly WeaponCategory[] = ["simple", "martial"];

export type WeaponRange = "melee" | "ranged";

export type DamageType =
  | "bludgeoning"
  | "piercing"
  | "slashing"
  | "acid"
  | "cold"
  | "fire"
  | "force"
  | "lightning"
  | "necrotic"
  | "poison"
  | "psychic"
  | "radiant"
  | "thunder";

export const DAMAGE_TYPES: readonly DamageType[] = [
  "bludgeoning",
  "piercing",
  "slashing",
  "acid",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "poison",
  "psychic",
  "radiant",
  "thunder",
];

/**
 * Propriétés d'arme d'un objet d'inventaire — voir src/domain/calculations/weapon-attack.ts.
 * Seules les propriétés qui changent les chiffres sont modélisées (portée, finesse, polyvalente) ;
 * deux mains, lancer, allonge, chargement… viendront plus tard si besoin.
 */
export interface WeaponProperties {
  category: WeaponCategory;
  range: WeaponRange;
  /** Dé(s) de dégâts au format « NdM », ex : « 1d8 », « 2d6 ». */
  damageDice: string;
  /** Dé(s) de dégâts à deux mains d'une arme polyvalente, ex : « 1d10 » pour une épée longue. */
  versatileDamageDice?: string;
  damageType: DamageType;
  /** Finesse : la meilleure de Force et Dextérité, au jet d'attaque comme aux dégâts. */
  finesse?: boolean;
  /** Bonus magique (arme +1…) ajouté au jet d'attaque ET aux dégâts. */
  magicBonus?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  equipped?: boolean;
  armor?: ArmorProperties;
  weapon?: WeaponProperties;
  /** Bonus magique à la CA quand l'objet est équipé (armure +1, anneau de protection…). */
  armorClassBonus?: number;
}
