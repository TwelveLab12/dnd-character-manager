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

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  equipped?: boolean;
  armor?: ArmorProperties;
  /** Bonus magique à la CA quand l'objet est équipé (armure +1, anneau de protection…). */
  armorClassBonus?: number;
}
