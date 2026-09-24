import { describe, expect, it } from "vitest";
import type { AbilityScores } from "../ability-scores";
import type { InventoryItem, WeaponProperties } from "../inventory";
import { makeTestCharacter } from "@/test/fixtures";
import {
  UNARMED_STRIKE_ID,
  computeWeaponAttack,
  computeWeaponAttacks,
  formatDamage,
  isMonkWeapon,
  isValidDamageDice,
  martialArtsDie,
  weaponAttackWarnings,
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
    const magicMace = weaponItem("Masse +1", {
      category: "simple",
      range: "melee",
      damageDice: "1d6",
      damageType: "bludgeoning",
      magicBonus: 1,
    });
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

const shield: InventoryItem = {
  id: "shield",
  name: "Bouclier",
  quantity: 1,
  equipped: true,
  armor: { category: "shield", baseArmorClass: 2 },
};
const greataxe = weaponItem("Hache à deux mains", {
  category: "martial",
  range: "melee",
  damageDice: "1d12",
  damageType: "slashing",
  twoHanded: true,
});
const handaxe = weaponItem("Hachette", {
  category: "simple",
  range: "melee",
  damageDice: "1d6",
  damageType: "slashing",
  thrown: { normal: 6, long: 18 },
});
const quarterstaff = weaponItem("Bâton", {
  category: "simple",
  range: "melee",
  damageDice: "1d6",
  versatileDamageDice: "1d8",
  damageType: "bludgeoning",
});
const dagger = weaponItem("Dague", {
  category: "simple",
  range: "melee",
  damageDice: "1d4",
  damageType: "piercing",
  finesse: true,
});
const shortsword = weaponItem("Coutelas", {
  category: "martial",
  range: "melee",
  damageDice: "1d6",
  damageType: "piercing",
  finesse: true,
  monkWeapon: true,
});

describe("two-handed and versatile weapons", () => {
  it("warns about a two-handed weapon wielded with a shield", () => {
    const character = makeTestCharacter({ inventory: [greataxe, shield] });
    expect(weaponAttackWarnings(character)).toEqual([expect.stringMatching(/deux mains/)]);
    expect(computeWeaponAttack(character, greataxe)?.twoHanded).toBe(true);
  });

  it("drops the two-handed damage of a versatile weapon when a shield is equipped", () => {
    const character = makeTestCharacter({ inventory: [quarterstaff, shield] });
    expect(computeWeaponAttack(character, quarterstaff)?.versatileDamage).toBeUndefined();
    expect(weaponAttackWarnings(character)).toEqual([]);
  });
});

describe("thrown weapons", () => {
  it("keeps the melee numbers and exposes the thrown range", () => {
    const character = makeTestCharacter({
      abilityScores: scores(14, 10),
      weaponProficiencies: ["simple"],
    });
    expect(computeWeaponAttack(character, handaxe)).toMatchObject({
      ability: "strength",
      attackBonus: 4,
      damage: "1d6+2",
      thrown: { normal: 6, long: 18 },
    });
  });
});

describe("martial arts", () => {
  it("scales the martial arts die with level", () => {
    expect([1, 4, 5, 10, 11, 16, 17, 20].map(martialArtsDie)).toEqual([
      "1d4",
      "1d4",
      "1d6",
      "1d6",
      "1d8",
      "1d8",
      "1d10",
      "1d10",
    ]);
  });

  it("recognizes monk weapons", () => {
    expect(isMonkWeapon(quarterstaff.weapon!)).toBe(true);
    expect(isMonkWeapon(shortsword.weapon!)).toBe(true);
    expect(isMonkWeapon(lightCrossbow.weapon!)).toBe(false);
    expect(isMonkWeapon(greataxe.weapon!)).toBe(false);
    expect(isMonkWeapon(longsword.weapon!)).toBe(false);
  });

  it("uses Dex and the martial arts die when it is better", () => {
    const monk = makeTestCharacter({
      level: 5,
      martialArts: true,
      abilityScores: scores(10, 16),
      inventory: [dagger, quarterstaff],
    });
    expect(computeWeaponAttack(monk, dagger)).toMatchObject({
      ability: "dexterity",
      proficient: true,
      attackBonus: 6,
      damage: "1d6+3",
      martialArts: true,
    });
    // Le bâton garde son d6 (égal au dé d'Arts martiaux) mais passe à la Dex.
    expect(computeWeaponAttack(monk, quarterstaff)?.damage).toBe("1d6+3");
  });

  it("treats the shortsword as a proficient monk weapon", () => {
    const monk = makeTestCharacter({ martialArts: true, weaponProficiencies: ["simple"] });
    expect(computeWeaponAttack(monk, shortsword)?.proficient).toBe(true);
  });

  it("adds an unarmed strike while martial arts are active", () => {
    const monk = makeTestCharacter({
      level: 11,
      martialArts: true,
      abilityScores: scores(12, 18),
    });
    const unarmed = computeWeaponAttacks(monk).find(
      (attack) => attack.itemId === UNARMED_STRIKE_ID,
    );
    expect(unarmed).toMatchObject({
      name: "Mains nues",
      attackBonus: 8,
      damage: "1d8+4",
      damageType: "bludgeoning",
    });
  });

  it("is inactive with armor or a shield, with a warning", () => {
    const monk = makeTestCharacter({
      level: 5,
      martialArts: true,
      abilityScores: scores(14, 16),
      inventory: [dagger, shield],
    });
    expect(computeWeaponAttack(monk, dagger)).toMatchObject({
      martialArts: false,
      damage: "1d4+3",
    });
    expect(computeWeaponAttacks(monk).some((a) => a.itemId === UNARMED_STRIKE_ID)).toBe(false);
    expect(weaponAttackWarnings(monk)).toEqual([expect.stringMatching(/Arts martiaux inactifs/)]);
  });

  it("does nothing without the martial arts toggle", () => {
    const character = makeTestCharacter({
      abilityScores: scores(10, 16),
      inventory: [quarterstaff],
    });
    expect(computeWeaponAttack(character, quarterstaff)).toMatchObject({
      ability: "strength",
      martialArts: false,
    });
    expect(computeWeaponAttacks(character)).toHaveLength(1);
  });
});

describe("off-hand attacks", () => {
  const shortswordMain: InventoryItem = {
    ...weaponItem("Épée courte", {
      category: "martial",
      range: "melee",
      damageDice: "1d6",
      damageType: "piercing",
      light: true,
    }),
  };
  const daggerOff: InventoryItem = {
    ...weaponItem("Dague", {
      category: "simple",
      range: "melee",
      damageDice: "1d4",
      damageType: "piercing",
      light: true,
      finesse: true,
    }),
    hand: "off",
  };

  it("drops the positive ability modifier from off-hand damage", () => {
    const character = makeTestCharacter({
      abilityScores: scores(16, 14),
      weaponProficiencies: ["simple", "martial"],
      inventory: [shortswordMain, daggerOff],
    });
    expect(computeWeaponAttack(character, daggerOff)).toMatchObject({
      offHand: true,
      attackBonus: 5,
      damage: "1d4",
    });
    expect(computeWeaponAttack(character, shortswordMain)?.damage).toBe("1d6+3");
  });

  it("keeps a negative modifier and the magic bonus off-hand", () => {
    const character = makeTestCharacter({ abilityScores: scores(8, 8) });
    const magicDagger = { ...daggerOff, weapon: { ...daggerOff.weapon!, magicBonus: 1 } };
    // mod -1 conservé en main secondaire, + 1 magique = 0.
    expect(computeWeaponAttack(character, magicDagger)?.damage).toBe("1d4");
  });

  it("adds the modifier with the Two-Weapon Fighting style", () => {
    const character = makeTestCharacter({
      abilityScores: scores(16, 14),
      twoWeaponFightingStyle: true,
      inventory: [shortswordMain, daggerOff],
    });
    expect(computeWeaponAttack(character, daggerOff)?.damage).toBe("1d4+3");
  });

  it("hides versatile damage when the off hand is busy", () => {
    const quarterstaffMain = weaponItem("Bâton", {
      category: "simple",
      range: "melee",
      damageDice: "1d6",
      versatileDamageDice: "1d8",
      damageType: "bludgeoning",
    });
    const character = makeTestCharacter({ inventory: [quarterstaffMain, daggerOff] });
    expect(computeWeaponAttack(character, quarterstaffMain)?.versatileDamage).toBeUndefined();
  });

  it("warns about an off-hand weapon that is not allowed there", () => {
    const longswordOff = { ...longsword, hand: "off" as const };
    const character = makeTestCharacter({ inventory: [longswordOff] });
    expect(weaponAttackWarnings(character)).toEqual([expect.stringMatching(/main secondaire/)]);
    expect(weaponAttackWarnings({ ...character, dualWielder: true })).toEqual([]);
  });
});
