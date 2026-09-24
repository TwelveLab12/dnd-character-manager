import type {
  ArmorCategory,
  ArmorProperties,
  InventoryItem,
  WeaponProperties,
} from "@/domain/inventory";

/** Type d'objet affiché en configuration : l'objet simple, l'arme, l'armure ou le bouclier. */
export type ItemKind = "item" | "weapon" | "armor" | "shield";

export const ITEM_KIND_OPTIONS: readonly { value: ItemKind; label: string }[] = [
  { value: "item", label: "Objet" },
  { value: "weapon", label: "Arme" },
  { value: "armor", label: "Armure" },
  { value: "shield", label: "Bouclier" },
];

export function itemKind(item: InventoryItem): ItemKind {
  if (item.weapon) {
    return "weapon";
  }
  if (item.armor) {
    return item.armor.category === "shield" ? "shield" : "armor";
  }
  return "item";
}

export const DEFAULT_WEAPON: WeaponProperties = {
  category: "simple",
  range: "melee",
  damageDice: "1d6",
  damageType: "slashing",
};

/** CA de base proposée pour chaque catégorie (armure de cuir, cuirasse, cotte de mailles,
 * bouclier) : simple point de départ, modifiable ensuite. */
export const DEFAULT_BASE_ARMOR_CLASS: Record<ArmorCategory, number> = {
  light: 11,
  medium: 14,
  heavy: 16,
  shield: 2,
};

/** Change la catégorie d'une armure. La CA de base suit la nouvelle catégorie tant qu'elle n'a pas
 * été modifiée (elle vaut encore le défaut de l'ancienne) ; la Force minimale ne reste que pour une
 * armure lourde. */
export function withArmorCategory(
  armor: ArmorProperties | undefined,
  category: ArmorCategory,
): ArmorProperties {
  const untouched =
    armor === undefined || armor.baseArmorClass === DEFAULT_BASE_ARMOR_CLASS[armor.category];
  return {
    category,
    baseArmorClass: untouched ? DEFAULT_BASE_ARMOR_CLASS[category] : armor.baseArmorClass,
    ...(category === "heavy" && armor?.strengthRequirement !== undefined
      ? { strengthRequirement: armor.strengthRequirement }
      : {}),
  };
}

/**
 * Patch qui change le type d'un objet en gardant ce qui reste pertinent. L'objet est déséquipé :
 * son emplacement (main, armure, bouclier) ne vaut plus pour le nouveau type, et le rééquiper
 * passe par `equipItem`, qui résout les conflits.
 */
export function kindPatch(item: InventoryItem, kind: ItemKind): Partial<InventoryItem> {
  const unequipped = { equipped: undefined, hand: undefined };
  switch (kind) {
    case "item":
      return { ...unequipped, weapon: undefined, armor: undefined };
    case "weapon":
      return {
        ...unequipped,
        armor: undefined,
        armorClassBonus: undefined,
        weapon: item.weapon ?? DEFAULT_WEAPON,
      };
    case "shield":
      return { ...unequipped, weapon: undefined, armor: withArmorCategory(item.armor, "shield") };
    case "armor":
      return {
        ...unequipped,
        weapon: undefined,
        armor:
          item.armor && item.armor.category !== "shield"
            ? item.armor
            : withArmorCategory(undefined, "light"),
      };
  }
}

/** Nouvel objet du type choisi par le bouton d'ajout. */
export function newItem(id: string, kind: ItemKind): InventoryItem {
  const item: InventoryItem = { id, name: "", quantity: 1 };
  if (kind === "weapon") {
    return { ...item, weapon: DEFAULT_WEAPON };
  }
  if (kind === "armor" || kind === "shield") {
    return { ...item, armor: withArmorCategory(undefined, kind === "shield" ? "shield" : "light") };
  }
  return item;
}
