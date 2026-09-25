import { describe, expect, it } from "vitest";
import { rageDamageBonus } from "@/domain/character-class";
import type { Character } from "@/domain/character";
import type { InventoryItem } from "@/domain/inventory";
import { makeTestCharacter } from "@/test/fixtures";
import { endRage, rageEffects, rageUnavailableReason, startRage } from "./rage";
import { applyLongRest, applyShortRest } from "./rest";
import { computeReadyWeaponAttacks, computeWeaponAttacks } from "./weapon-attack";

const greatsword: InventoryItem = {
  id: "greatsword",
  name: "Épée à deux mains",
  quantity: 1,
  equipped: true,
  weapon: {
    category: "martial",
    range: "melee",
    damageDice: "1d12",
    damageType: "slashing",
    twoHanded: true,
  },
};
const crossbow: InventoryItem = {
  id: "crossbow",
  name: "Arbalète légère",
  quantity: 1,
  weapon: { category: "simple", range: "ranged", damageDice: "1d8", damageType: "piercing" },
};

/** Murrik : barbare niv. 3, voie du guerrier totémique (Ours), Force 15. */
function murrik(overrides: Partial<Character> = {}) {
  return makeTestCharacter({
    classId: "barbare",
    level: 3,
    subclassId: "guerrier-totemique",
    subclass: "Voie du guerrier totémique (Ours)",
    abilityScores: { ...makeTestCharacter().abilityScores, strength: 15 },
    inventory: [greatsword, crossbow],
    ...overrides,
  });
}

describe("Rage (règles 2014)", () => {
  it.each([
    [1, 2],
    [8, 2],
    [9, 3],
    [16, 4],
  ])("level %i → +%i damage", (level, bonus) => {
    expect(rageDamageBonus(level)).toBe(bonus);
  });

  it("starts a rage: spends one use and ends concentration", () => {
    expect(startRage(murrik({ concentration: { active: true, spellId: "x" } }))).toEqual({
      raging: true,
      classResourcesUsed: { rage: 1 },
      concentration: { active: false },
    });
    expect(endRage()).toEqual({ raging: undefined });
  });

  it("cannot start without a rage left, in heavy armor, or for another class", () => {
    expect(rageUnavailableReason(murrik())).toBeUndefined();
    expect(rageUnavailableReason(murrik({ classResourcesUsed: { rage: 3 } }))).toMatch(
      /repos long/,
    );
    const plate: InventoryItem = {
      id: "plate",
      name: "Harnois",
      quantity: 1,
      equipped: true,
      armor: { category: "heavy", baseArmorClass: 18 },
    };
    expect(rageUnavailableReason(murrik({ inventory: [plate] }))).toMatch(/armure lourde/);
    expect(startRage(murrik({ classResourcesUsed: { rage: 3 } }))).toEqual({});
    expect(rageUnavailableReason(makeTestCharacter({ classId: "clerc" }))).toBeDefined();
  });

  it("adds the rage bonus to Strength melee attacks only", () => {
    const raging = murrik({ raging: true });
    expect(computeWeaponAttacks(raging)[0]).toMatchObject({ damage: "1d12+4", rageBonus: 2 });
    expect(computeReadyWeaponAttacks(raging)[0]).toMatchObject({ damage: "1d8" });
    expect(computeReadyWeaponAttacks(raging)[0]).not.toHaveProperty("rageBonus");
    expect(computeWeaponAttacks(murrik())[0]).toMatchObject({ damage: "1d12+2" });
  });

  it("describes the resistances, extended by the bear totem spirit", () => {
    expect(rageEffects(murrik()).resistances).toMatch(/sauf psychiques/);
    expect(
      rageEffects(murrik({ subclass: "Voie du guerrier totémique (Aigle)" })).resistances,
    ).toBe("dégâts contondants, perforants et tranchants");
  });

  it("ends on any rest", () => {
    expect(applyShortRest(murrik({ raging: true })).raging).toBeUndefined();
    expect(applyLongRest(murrik({ raging: true })).raging).toBeUndefined();
  });
});
