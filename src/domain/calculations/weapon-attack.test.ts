import { describe, expect, it } from "vitest";
import type { AbilityScores } from "../ability-scores";
import type { InventoryItem, WeaponProperties } from "../inventory";
import { makeTestCharacter } from "@/test/fixtures";
import {
  computeWeaponAttack,
  computeWeaponAttacks,
  formatDamage,
  isValidDamageDice,
} from "./weapon-attack";

function scores(strength: number, dexterity: number): AbilityScores {
  return { strength, dexterity, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
}

function weaponItem(id: string, weapon: WeaponProperties, equipped = true): InventoryItem {
  return { id, name: id, quantity: 1, equipped, weapon };
}

const mace = weaponItem("Masse d'armes", {
  category: "simple",
  range: "melee",
  damageDice: "1d6",
  damageType: "bludgeoning",
});
const longsword = weaponItem("Épée longue", {
  category: "martial",
  range: "melee",
  damageDice: "1d8",
  versatileDamageDice: "1d10",
  damageType: "slashing",
});
const rapier = weaponItem("Rapière", {
  category: "martial",
  range: "melee",
  damageDice: "1d8",
  damageType: "piercing",
  finesse: true,
});
const lightCrossbow = weaponItem("Arbalète légère", {
  category: "simple",
  range: "ranged",
  damageDice: "1d8",
  damageType: "piercing",
});

describe("formatDamage", () => {
  it("appends a signed modifier, omitting zero", () => {
    expect(formatDamage("1d8", 3)).toBe("1d8+3");
    expect(formatDamage("1d6", -1)).toBe("1d6-1");
    expect(formatDamage("2d6", 0)).toBe("2d6");
  });
});

describe("isValidDamageDice", () => {
  it("accepts NdM only", () => {
    expect(isValidDamageDice("1d8")).toBe(true);
    expect(isValidDamageDice("2d6")).toBe(true);
    expect(isValidDamageDice("d8")).toBe(false);
    expect(isValidDamageDice("1d8+2")).toBe(false);
  });
});

describe("computeWeaponAttack", () => {
  it("uses Strength and proficiency for a proficient melee weapon", () => {
    const character = makeTestCharacter({
      level: 5,
      abilityScores: scores(16, 12),
      weaponProficiencies: ["simple"],
    });
    expect(computeWeaponAttack(character, mace)).toMatchObject({
      ability: "strength",
      proficient: true,
      attackBonus: 6, // +3 For, +3 maîtrise (niveau 5)
      damage: "1d6+3",
      damageType: "bludgeoning",
    });
  });

  it("uses Dexterity for a ranged weapon", () => {
    const character = makeTestCharacter({
      abilityScores: scores(8, 14),
      weaponProficiencies: ["simple"],
    });
    expect(computeWeaponAttack(character, lightCrossbow)).toMatchObject({
      ability: "dexterity",
      attackBonus: 4,
      damage: "1d8+2",
    });
  });

  it("uses the better of Strength and Dexterity for a finesse weapon", () => {
    const dexterous = makeTestCharacter({
      abilityScores: scores(10, 16),
      weaponProficiencies: ["martial"],
    });
    expect(computeWeaponAttack(dexterous, rapier)).toMatchObject({
      ability: "dexterity",
      attackBonus: 5,
      damage: "1d8+3",
    });

    const strong = makeTestCharacter({
      abilityScores: scores(18, 12),
      weaponProficiencies: ["martial"],
    });
    expect(computeWeaponAttack(strong, rapier)?.ability).toBe("strength");
  });

  it("omits the proficiency bonus for a non-proficient category", () => {
    const character = makeTestCharacter({
      abilityScores: scores(14, 10),
      weaponProficiencies: ["simple"],
    });
    expect(computeWeaponAttack(character, longsword)).toMatchObject({
      proficient: false,
      attackBonus: 2,
    });
  });

  it("gives the two-handed damage of a versatile weapon", () => {
    const character = makeTestCharacter({ abilityScores: scores(14, 10) });
    expect(computeWeaponAttack(character, longsword)).toMatchObject({
      damage: "1d8+2",
      versatileDamage: "1d10+2",
    });
  });

  it("adds the magic bonus to both attack and damage", () => {
    const character = makeTestCharacter({
      abilityScores: scores(14, 10),
      weaponProficiencies: ["simple"],
    });
    const magicMace = { ...mace, weapon: { ...mace.weapon!, magicBonus: 1 } };
    expect(computeWeaponAttack(character, magicMace)).toMatchObject({
      attackBonus: 5,
      damage: "1d6+3",
    });
  });

  it("uses the racial ability bonus", () => {
    const character = makeTestCharacter({
      abilityScores: scores(15, 10),
      raceSelection: { raceId: "humain-variant", abilityBonusChoices: ["strength", "wisdom"] },
    });
    expect(computeWeaponAttack(character, mace)?.damage).toBe("1d6+3");
  });

  it("returns undefined for a non-weapon item", () => {
    const character = makeTestCharacter();
    expect(computeWeaponAttack(character, { id: "rope", name: "Corde", quantity: 1 })).toBe(
      undefined,
    );
  });
});

describe("computeWeaponAttacks", () => {
  it("lists equipped weapons only, melee first", () => {
    const character = makeTestCharacter({
      inventory: [lightCrossbow, { ...longsword, equipped: false }, mace],
    });
    expect(computeWeaponAttacks(character).map((attack) => attack.itemId)).toEqual([
      "Masse d'armes",
      "Arbalète légère",
    ]);
  });
});
