import { describe, expect, it } from "vitest";
import { formatWeaponAttack } from "./weapon";

describe("formatWeaponAttack", () => {
  it("summarizes attack bonus, damage, type and versatile damage", () => {
    expect(
      formatWeaponAttack({
        itemId: "longsword",
        name: "Épée longue",
        range: "melee",
        ability: "strength",
        proficient: true,
        attackBonus: 5,
        damage: "1d8+3",
        versatileDamage: "1d10+3",
        damageType: "slashing",
        twoHanded: false,
        martialArts: false,
        offHand: false,
      }),
    ).toBe("+5 · 1d8+3 tranchant · 1d10+3 à deux mains");
  });

  it("appends thrown range, two-handed and martial arts tags", () => {
    expect(
      formatWeaponAttack({
        itemId: "handaxe",
        name: "Hachette",
        range: "melee",
        ability: "dexterity",
        proficient: true,
        attackBonus: 5,
        damage: "1d6+3",
        damageType: "slashing",
        twoHanded: true,
        thrown: { normal: 6, long: 18 },
        martialArts: true,
        offHand: false,
      }),
    ).toBe("+5 · 1d6+3 tranchant · Deux mains · Lancer 6/18 m · Arts martiaux");
  });
});
