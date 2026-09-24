import { compareNames } from "./names";

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
 * Allonge, chargement, munitions, lourde… ne sont pas modélisées (aucun effet sur les chiffres
 * affichés).
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
  /** Deux mains : occupe les deux mains — équiper l'arme déséquipe bouclier et arme secondaire. */
  twoHanded?: boolean;
  /** Légère : peut être tenue en main secondaire (combat à deux armes), voir canWieldOffHand. */
  light?: boolean;
  /** Lancer : l'arme de corps à corps peut être lancée, mêmes chiffres, portées en mètres. */
  thrown?: ThrownRange;
  /** Arme de moine explicite (ex : coutelas). Les armes courantes de corps à corps qui ne sont pas
   * à deux mains le sont d'office — voir isMonkWeapon. */
  monkWeapon?: boolean;
}

export interface ThrownRange {
  /** Portée normale, en mètres. */
  normal: number;
  /** Portée longue (désavantage), en mètres. */
  long: number;
}

/** Main qui tient une arme équipée. Absente = main principale. */
export type WeaponHand = "main" | "off";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  equipped?: boolean;
  /** Main d'une arme équipée — voir src/domain/equipment.ts. */
  hand?: WeaponHand;
  armor?: ArmorProperties;
  weapon?: WeaponProperties;
  /** Bonus magique à la CA quand l'objet est équipé (armure +1, anneau de protection…). */
  armorClassBonus?: number;
}

/** Ajoute `delta` à la quantité d'un objet, sans descendre sous 0 (l'objet reste dans la liste). */
export function adjustItemQuantity(
  inventory: readonly InventoryItem[],
  itemId: string,
  delta: number,
): InventoryItem[] {
  return inventory.map((item) =>
    item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
  );
}

/** Poids total porté, en kg (poids unitaire × quantité ; un objet sans poids compte pour 0). */
export function totalInventoryWeight(inventory: readonly InventoryItem[]): number {
  return inventory.reduce((sum, item) => sum + (item.weight ?? 0) * item.quantity, 0);
}

/** Arme, armure ou bouclier : rangé dans « Armes & armures » plutôt que dans le sac. */
export function isGear(item: InventoryItem): boolean {
  return item.weapon !== undefined || item.armor !== undefined;
}

/**
 * Ordre d'affichage par défaut d'un groupe d'objets (docs/adr/0036) : alphabétique (voir
 * `compareNames`). Le stockage garde l'ordre d'ajout : aucun ordre manuel n'est encore enregistré.
 * `nameOf` permet de trier sur un autre nom que le nom courant, ex : celui d'un objet en cours
 * d'édition, figé pour qu'il ne change pas de place à chaque frappe.
 */
export function sortInventoryByName(
  items: readonly InventoryItem[],
  nameOf: (item: InventoryItem) => string = (item) => item.name,
): InventoryItem[] {
  return [...items].sort((a, b) => compareNames(nameOf(a), nameOf(b)));
}
