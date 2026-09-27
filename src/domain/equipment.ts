import type { Character } from "./character";
import type { InventoryItem, WeaponHand, WeaponProperties } from "./inventory";

/**
 * Emplacement d'équipement choisi pour un objet : `null` = non équipé ; pour une arme, la prise
 * (une arme à deux mains est toujours en main principale et occupe aussi la secondaire ; une arme
 * polyvalente peut être tenue à deux mains, docs/adr/0057).
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

/** Arme polyvalente : dé de dégâts à deux mains renseigné, et pas déjà une arme à deux mains. */
export function canWieldTwoHanded(weapon: WeaponProperties): boolean {
  return weapon.versatileDamageDice !== undefined && !weapon.twoHanded;
}

/**
 * Prise effective d'une arme (docs/adr/0057) : une arme à deux mains est toujours « both » ; une
 * prise enregistrée que l'arme ne permet plus (polyvalence ou main secondaire retirées dans
 * l'éditeur) retombe en main principale.
 */
export function weaponGrip(
  character: Pick<Character, "dualWielder">,
  weapon: WeaponProperties,
  hand: WeaponHand | undefined,
): WeaponHand {
  if (weapon.twoHanded) {
    return "both";
  }
  if (hand === "both" && canWieldTwoHanded(weapon)) {
    return "both";
  }
  if (hand === "off" && canWieldOffHand(character, weapon)) {
    return "off";
  }
  return "main";
}

type Occupation = "body" | "main" | "off";

/** Emplacements occupés par un objet une fois équipé. Un objet sans armure ni arme (anneau,
 * cape…) n'occupe rien et ne déséquipe jamais rien. */
function occupiedSlots(item: InventoryItem, hand: WeaponHand | undefined): Occupation[] {
  if (item.armor) {
    return item.armor.category === "shield" ? ["off"] : ["body"];
  }
  if (item.weapon) {
    if (item.weapon.twoHanded || (hand === "both" && canWieldTwoHanded(item.weapon))) {
      return ["main", "off"];
    }
    // Une main secondaire non permise (données importées) occupe quand même cette main.
    return [hand === "off" ? "off" : "main"];
  }
  return [];
}

/**
 * Équipe (ou déséquipe) un objet en libérant automatiquement ce qui occupe déjà ses emplacements :
 * une seule armure, une arme en main principale, une arme ou un bouclier en main secondaire, et
 * une arme à deux mains (ou polyvalente tenue à deux mains) prend les deux mains. Une prise que
 * l'arme ne permet pas (voir weaponGrip) retombe en main principale.
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
    const requested = slot === "equipped" ? "main" : slot;
    // Une arme à deux mains s'enregistre en main principale : sa prise découle de l'arme.
    hand = target.weapon.twoHanded ? "main" : weaponGrip(character, target.weapon, requested);
  }
  const taken = occupiedSlots(target, hand);

  return character.inventory.map((item) => {
    if (item.id === itemId) {
      const { stowed: _stowed, ...rest } = item;
      const equipped: InventoryItem = { ...rest, equipped: true };
      return hand === "off" || hand === "both" ? { ...equipped, hand } : withoutHand(equipped);
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
  if (placement !== "bag" && placement !== "ready") {
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
