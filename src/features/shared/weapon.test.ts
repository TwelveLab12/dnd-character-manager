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
      }),
    ).toBe("+5 · 1d8+3 tranchant (1d10+3 à deux mains)");
  });
});
