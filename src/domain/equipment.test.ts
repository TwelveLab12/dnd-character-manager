import { describe, expect, it } from "vitest";
import type { InventoryItem } from "./inventory";
import { canWieldOffHand, currentSlot, equipItem } from "./equipment";

const leather: InventoryItem = {
  id: "leather",
  name: "Cuir",
  quantity: 1,
  armor: { category: "light", baseArmorClass: 11 },
};
const chainMail: InventoryItem = {
  id: "chain",
  name: "Cotte de mailles",
  quantity: 1,
  armor: { category: "heavy", baseArmorClass: 16 },
};
const shield: InventoryItem = {
  id: "shield",
  name: "Bouclier",
  quantity: 1,
  armor: { category: "shield", baseArmorClass: 2 },
};
const longsword: InventoryItem = {
  id: "longsword",
  name: "Épée longue",
  quantity: 1,
  weapon: { category: "martial", range: "melee", damageDice: "1d8", damageType: "slashing" },
};
const shortsword: InventoryItem = {
  id: "shortsword",
  name: "Épée courte",
  quantity: 1,
  weapon: {
    category: "martial",
    range: "melee",
    damageDice: "1d6",
    damageType: "piercing",
    light: true,
  },
};
const dagger: InventoryItem = {
  id: "dagger",
  name: "Dague",
  quantity: 1,
  weapon: {
    category: "simple",
    range: "melee",
    damageDice: "1d4",
    damageType: "piercing",
    light: true,
  },
};
const greatsword: InventoryItem = {
  id: "greatsword",
  name: "Épée à deux mains",
  quantity: 1,
  weapon: {
    category: "martial",
    range: "melee",
    damageDice: "2d6",
    damageType: "slashing",
    twoHanded: true,
  },
};
const ring: InventoryItem = { id: "ring", name: "Anneau", quantity: 1, armorClassBonus: 1 };

function equippedIds(inventory: InventoryItem[]) {
  return inventory
    .filter((item) => item.equipped)
    .map((item) => (item.hand ? `${item.id}:${item.hand}` : item.id));
}

function equipped(item: InventoryItem, hand?: "off"): InventoryItem {
  return { ...item, equipped: true, ...(hand ? { hand } : {}) };
}

describe("canWieldOffHand", () => {
  it("requires a light one-handed melee weapon, unless Dual Wielder", () => {
    expect(canWieldOffHand({}, shortsword.weapon!)).toBe(true);
    expect(canWieldOffHand({}, longsword.weapon!)).toBe(false);
    expect(canWieldOffHand({ dualWielder: true }, longsword.weapon!)).toBe(true);
    expect(canWieldOffHand({ dualWielder: true }, greatsword.weapon!)).toBe(false);
    expect(canWieldOffHand({ dualWielder: true }, { ...dagger.weapon!, range: "ranged" })).toBe(
      false,
    );
  });
});

describe("equipItem", () => {
  it("swaps body armor", () => {
    const inventory = equipItem({ inventory: [equipped(leather), chainMail] }, "chain", "equipped");
    expect(equippedIds(inventory)).toEqual(["chain"]);
  });

  it("swaps the main-hand weapon but keeps the shield", () => {
    const inventory = equipItem(
      { inventory: [equipped(longsword), equipped(shield), dagger] },
      "dagger",
      "main",
    );
    expect(equippedIds(inventory)).toEqual(["shield", "dagger"]);
  });

  it("an off-hand weapon replaces the shield, a shield replaces the off-hand weapon", () => {
    const withOffHand = equipItem(
      { inventory: [equipped(shortsword), equipped(shield), dagger] },
      "dagger",
      "off",
    );
    expect(equippedIds(withOffHand)).toEqual(["shortsword", "dagger:off"]);

    const backToShield = equipItem({ inventory: withOffHand }, "shield", "equipped");
    expect(equippedIds(backToShield)).toEqual(["shortsword", "shield"]);
    expect(backToShield.find((item) => item.id === "dagger")?.hand).toBeUndefined();
  });

  it("falls back to the main hand for a weapon that cannot be wielded off-hand", () => {
    const inventory = equipItem({ inventory: [equipped(dagger), longsword] }, "longsword", "off");
    expect(equippedIds(inventory)).toEqual(["longsword"]);
    expect(
      equippedIds(equipItem({ inventory: [longsword], dualWielder: true }, "longsword", "off")),
    ).toEqual(["longsword:off"]);
  });

  it("a two-handed weapon frees both hands, and is freed by a shield", () => {
    const twoHands = equipItem(
      { inventory: [equipped(shortsword), equipped(dagger, "off"), equipped(ring), greatsword] },
      "greatsword",
      "main",
    );
    expect(equippedIds(twoHands)).toEqual(["ring", "greatsword"]);

    const withShield = equipItem(
      { inventory: [equipped(greatsword), shield] },
      "shield",
      "equipped",
    );
    expect(equippedIds(withShield)).toEqual(["shield"]);
  });

  it("never touches items that occupy no slot", () => {
    const inventory = equipItem({ inventory: [equipped(ring), leather] }, "leather", "equipped");
    expect(equippedIds(inventory)).toEqual(["ring", "leather"]);
  });

  it("unequips and forgets the hand", () => {
    const inventory = equipItem({ inventory: [equipped(dagger, "off")] }, "dagger", null);
    expect(inventory[0]).toEqual({ ...dagger, equipped: false });
  });
});

describe("currentSlot", () => {
  it("reports the slot of an item", () => {
    expect(currentSlot(dagger)).toBe(null);
    expect(currentSlot(equipped(dagger))).toBe("main");
    expect(currentSlot(equipped(dagger, "off"))).toBe("off");
    expect(currentSlot(equipped(shield))).toBe("equipped");
  });
});
