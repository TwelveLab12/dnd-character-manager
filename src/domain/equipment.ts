import type { Character } from "./character";
import type { InventoryItem, WeaponHand, WeaponProperties } from "./inventory";

/**
 * Emplacement d'équipement choisi pour un objet : `null` = non équipé ; pour une arme, la main
 * (une arme à deux mains est toujours en main principale et occupe aussi la secondaire).
 */
export type EquipSlot = null | "equipped" | WeaponHand;

/**
 * Combat à deux armes (règles 2014) : arme de corps à corps, pas à deux mains, et légère — sauf
 * avec le don Ambidextre.
 */
export function canWieldOffHand(
  character: Pick<Character, "dualWielder">,
  weapon: WeaponProperties,
): boolean {
  return (
    weapon.range === "melee" &&
    !weapon.twoHanded &&
    (weapon.light === true || character.dualWielder === true)
  );
}

type Occupation = "body" | "main" | "off";

/** Emplacements occupés par un objet une fois équipé. Un objet sans armure ni arme (anneau,
 * cape…) n'occupe rien et ne déséquipe jamais rien. */
function occupiedSlots(item: InventoryItem, hand: WeaponHand | undefined): Occupation[] {
  if (item.armor) {
    return item.armor.category === "shield" ? ["off"] : ["body"];
  }
  if (item.weapon) {
    if (item.weapon.twoHanded) {
      return ["main", "off"];
    }
    return [hand ?? "main"];
  }
  return [];
}

/**
 * Équipe (ou déséquipe) un objet en libérant automatiquement ce qui occupe déjà ses emplacements :
 * une seule armure, une arme en main principale, une arme ou un bouclier en main secondaire, et
 * une arme à deux mains prend les deux mains. Une main secondaire demandée pour une arme qui ne
 * le permet pas (voir canWieldOffHand) retombe en main principale.
 */
export function equipItem(
  character: Pick<Character, "inventory" | "dualWielder">,
  itemId: string,
  slot: EquipSlot,
): InventoryItem[] {
  const target = character.inventory.find((item) => item.id === itemId);
  if (!target) {
    return character.inventory;
  }

  if (slot === null) {
    return character.inventory.map((item) =>
      item.id === itemId ? withoutHand({ ...item, equipped: false }) : item,
    );
  }

  let hand: WeaponHand | undefined;
  if (target.weapon) {
    hand =
      slot === "off" && canWieldOffHand(character, target.weapon) && !target.weapon.twoHanded
        ? "off"
        : "main";
  }
  const taken = occupiedSlots(target, hand);

  return character.inventory.map((item) => {
    if (item.id === itemId) {
      const { stowed: _stowed, ...rest } = item;
      const equipped: InventoryItem = { ...rest, equipped: true };
      return hand === "off" ? { ...equipped, hand } : withoutHand(equipped);
    }
    if (item.equipped !== true) {
      return item;
    }
    const conflict = occupiedSlots(item, item.hand).some((occupied) => taken.includes(occupied));
    return conflict ? withoutHand({ ...item, equipped: false }) : item;
  });
}

function withoutHand(item: InventoryItem): InventoryItem {
  const { hand: _hand, ...rest } = item;
  return rest;
}

/** Emplacement actuel d'un objet, pour pré-remplir les contrôles d'équipement. */
export function currentSlot(item: InventoryItem): EquipSlot {
  if (item.equipped !== true) {
    return null;
  }
  if (item.weapon) {
    return item.hand ?? "main";
  }
  return "equipped";
}

/**
 * Emplacement d'une arme (docs/adr/0054) : rangée dans le sac, prête à dégainer (à la ceinture…),
 * ou en main. Les mains restent exclusives (voir equipItem) ; les armes prêtes, non.
 */
export type WeaponPlacement = "bag" | "ready" | WeaponHand;

export function weaponPlacement(item: InventoryItem): WeaponPlacement {
  if (item.equipped === true) {
    return item.hand ?? "main";
  }
  return item.stowed === true ? "bag" : "ready";
}

/** Place une arme : en main via equipItem (ce qu'elle déloge devient prêt), sinon prête ou
 * rangée. */
export function placeWeapon(
  character: Pick<Character, "inventory" | "dualWielder">,
  itemId: string,
  placement: WeaponPlacement,
): InventoryItem[] {
  if (placement === "main" || placement === "off") {
    return equipItem(character, itemId, placement);
  }
  return equipItem(character, itemId, null).map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    const { stowed: _stowed, ...rest } = item;
    return placement === "bag" ? { ...rest, stowed: true } : rest;
  });
}
