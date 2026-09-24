import type { Character } from "../character";
import type { ArmorCategory, InventoryItem } from "../inventory";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { abilityModifier } from "./modifiers";
import { effectiveArmorProficiencies } from "./class-features";

export const UNARMORED_BASE_ARMOR_CLASS = 10;
export const MEDIUM_ARMOR_DEX_CAP = 2;
export const MEDIUM_ARMOR_MASTER_DEX_CAP = 3;

export interface ArmorClassPart {
  label: string;
  value: number;
}

export interface ArmorClassResult {
  total: number;
  /** Détail lisible du calcul, dans l'ordre : base, Dextérité, bouclier, bonus d'objets, effets. */
  breakdown: ArmorClassPart[];
  warnings: string[];
}

const CATEGORY_LABELS: Record<ArmorCategory, string> = {
  light: "armure légère",
  medium: "armure intermédiaire",
  heavy: "armure lourde",
  shield: "bouclier",
};

/** Part de Dextérité ajoutée selon la catégorie d'armure (règles 5e 2014). */
export function dexterityContribution(
  category: ArmorCategory | undefined,
  dexterityModifier: number,
  mediumArmorMaster = false,
): number {
  switch (category) {
    case "medium":
      return Math.min(
        dexterityModifier,
        mediumArmorMaster ? MEDIUM_ARMOR_MASTER_DEX_CAP : MEDIUM_ARMOR_DEX_CAP,
      );
    case "heavy":
      return 0;
    default:
      return dexterityModifier;
  }
}

function isEquippedArmor(item: InventoryItem): boolean {
  return item.equipped === true && item.armor !== undefined;
}

/**
 * CA calculée à partir de l'armure et du bouclier équipés, de la Dextérité effective (bonus racial
 * inclus), des bonus magiques des objets équipés et des effets actifs (voir
 * src/domain/armor-class-effect.ts). La maîtrise d'armure ne change pas la CA en 5e 2014 : son
 * absence ne produit qu'un avertissement (désavantage For/Dex, pas de sorts).
 */
export function computeArmorClass(character: Character): ArmorClassResult {
  const scores = effectiveAbilityScores(character.abilityScores, character.raceSelection);
  const dexterityModifier = abilityModifier(scores.dexterity);
  const mediumArmorMaster = character.mediumArmorMaster ?? false;
  const proficiencies = effectiveArmorProficiencies(character);
  const warnings: string[] = [];

  const equipped = character.inventory.filter(isEquippedArmor);
  const bodyArmors = equipped.filter((item) => item.armor?.category !== "shield");
  const shields = equipped.filter((item) => item.armor?.category === "shield");

  const armorValue = (item: InventoryItem) =>
    (item.armor?.baseArmorClass ?? 0) +
    dexterityContribution(item.armor?.category, dexterityModifier, mediumArmorMaster);
  const best = (items: InventoryItem[], score: (item: InventoryItem) => number) =>
    items.reduce<InventoryItem | undefined>(
      (current, item) => (current === undefined || score(item) > score(current) ? item : current),
      undefined,
    );

  const armor = best(bodyArmors, armorValue);
  const shield = best(shields, (item) => item.armor?.baseArmorClass ?? 0);

  if (bodyArmors.length > 1) {
    warnings.push("Plusieurs armures équipées : seule la meilleure est comptée.");
  }
  if (shields.length > 1) {
    warnings.push("Plusieurs boucliers équipés : seul le meilleur est compté.");
  }

  const breakdown: ArmorClassPart[] = [];
  if (armor?.armor) {
    breakdown.push({ label: armor.name || "Armure", value: armor.armor.baseArmorClass });
  } else {
    breakdown.push({ label: "Base", value: UNARMORED_BASE_ARMOR_CLASS });
  }

  const dexterity = dexterityContribution(
    armor?.armor?.category,
    dexterityModifier,
    mediumArmorMaster,
  );
  if (armor?.armor?.category !== "heavy") {
    breakdown.push({ label: "Dex", value: dexterity });
  }

  if (shield?.armor) {
    breakdown.push({ label: shield.name || "Bouclier", value: shield.armor.baseArmorClass });
  }

  // Bonus magique : seuls les objets réellement comptés (armure/bouclier retenus) ou sans
  // propriété d'armure (anneau, cape…) l'apportent — une armure en double ne cumule pas.
  const countedItems = character.inventory.filter(
    (item) =>
      item.equipped === true &&
      item.armorClassBonus !== undefined &&
      item.armorClassBonus !== 0 &&
      (item.armor === undefined || item === armor || item === shield),
  );
  for (const item of countedItems) {
    const label = item.name || "Objet";
    breakdown.push({
      label: item.armor ? `${label} (magie)` : label,
      value: item.armorClassBonus ?? 0,
    });
  }

  for (const effect of character.armorClassEffects ?? []) {
    const active =
      effect.trigger.type === "manual"
        ? effect.trigger.active
        : character.concentration.active &&
          character.concentration.spellId === effect.trigger.spellId;
    if (active && effect.bonus !== 0) {
      breakdown.push({ label: effect.name || "Effet", value: effect.bonus });
    }
  }

  for (const item of [armor, shield]) {
    const category = item?.armor?.category;
    if (category && !proficiencies.includes(category)) {
      warnings.push(
        `${item.name || "Armure"} : ${CATEGORY_LABELS[category]} non maîtrisée — désavantage aux tests, sauvegardes et attaques de Force/Dextérité, pas de sorts.`,
      );
    }
  }

  const strengthRequirement = armor?.armor?.strengthRequirement;
  if (
    armor?.armor?.category === "heavy" &&
    strengthRequirement !== undefined &&
    scores.strength < strengthRequirement
  ) {
    warnings.push(
      `${armor.name || "Armure"} : Force ${scores.strength} < ${strengthRequirement} requise — vitesse réduite de 3 m.`,
    );
  }

  const total = breakdown.reduce((sum, part) => sum + part.value, 0);
  return { total, breakdown, warnings };
}
