import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { computeReadyWeaponAttacks, computeWeaponAttacks } from "./calculations/weapon-attack";
import { placeWeapon, weaponPlacement } from "./equipment";
import type { InventoryItem } from "./inventory";

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
const handaxe: InventoryItem = {
  id: "handaxe",
  name: "Hachette",
  quantity: 2,
  weapon: {
    category: "simple",
    range: "melee",
    damageDice: "1d6",
    damageType: "slashing",
    light: true,
    thrown: { normal: 6, long: 18 },
  },
};

/** Murrik : Force 15, épée à deux mains en main, hachettes non équipées. */
function murrik(inventory: InventoryItem[] = [greatsword, handaxe]) {
  return makeTestCharacter({
    level: 3,
    weaponProficiencies: ["simple", "martial"],
    abilityScores: { ...makeTestCharacter().abilityScores, strength: 15 },
    inventory,
  });
}

describe("weaponPlacement", () => {
  it("reads a weapon as in hand, ready (unequipped by default) or stowed", () => {
    expect(weaponPlacement(greatsword)).toBe("main");
    expect(weaponPlacement(handaxe)).toBe("ready");
    expect(weaponPlacement({ ...handaxe, stowed: true })).toBe("bag");
    expect(weaponPlacement({ ...handaxe, equipped: true, hand: "off" })).toBe("off");
  });
});

describe("placeWeapon", () => {
  it("puts a weapon in hand, the two-handed weapon it displaces becoming ready", () => {
    const inventory = placeWeapon(murrik(), "handaxe", "main");
    expect(inventory.map(weaponPlacement)).toEqual(["ready", "main"]);
  });

  it("stows a weapon, then readies it again", () => {
    const stowed = placeWeapon(murrik(), "handaxe", "bag");
    expect(stowed[1]).toMatchObject({ stowed: true });
    const ready = placeWeapon(murrik(stowed), "handaxe", "ready");
    expect(ready[1]).not.toHaveProperty("stowed");
    expect(ready[0]).toBe(stowed[0]);
  });

  it("clears the stowed flag when a stowed weapon goes in hand", () => {
    const inventory = placeWeapon(murrik([{ ...handaxe, stowed: true }]), "handaxe", "main");
    expect(inventory[0]).toEqual({ ...handaxe, equipped: true });
  });
});

describe("computeReadyWeaponAttacks", () => {
  it("lists ready weapons apart from the weapons in hand, not stowed ones", () => {
    const character = murrik();
    expect(computeWeaponAttacks(character).map((attack) => attack.name)).toEqual([
      "Épée à deux mains",
    ]);
    expect(computeReadyWeaponAttacks(character)).toEqual([
      expect.objectContaining({
        name: "Hachette",
        attackBonus: 4,
        damage: "1d6+2",
        thrown: { normal: 6, long: 18 },
      }),
    ]);
    expect(computeReadyWeaponAttacks(murrik([greatsword, { ...handaxe, stowed: true }]))).toEqual(
      [],
    );
  });

  it("leaves out a ready weapon whose quantity is 0 (all thrown or not counted yet)", () => {
    expect(computeReadyWeaponAttacks(murrik([greatsword, { ...handaxe, quantity: 0 }]))).toEqual(
      [],
    );
  });
});
