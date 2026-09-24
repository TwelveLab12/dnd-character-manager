import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import {
  computeInitiative,
  computeSpeed,
  effectiveSavingThrowProficiencies,
  savingThrowGrantedBy,
} from "./combat-stats";

const HUMAN_VARIANT = { raceId: "humain-variant", abilityBonusChoices: [] };

describe("effectiveSavingThrowProficiencies", () => {
  it("grants the class saving throws and keeps extra ones from the sheet", () => {
    const character = makeTestCharacter({
      classId: "clerc",
      savingThrowProficiencies: ["constitution"],
    });
    expect(effectiveSavingThrowProficiencies(character)).toEqual([
      "wisdom",
      "charisma",
      "constitution",
    ]);
    expect(savingThrowGrantedBy(character, "wisdom")).toBe("Clerc");
    expect(savingThrowGrantedBy(character, "constitution")).toBeUndefined();
  });

  it("uses only the sheet for a class outside the registry", () => {
    const character = makeTestCharacter({ savingThrowProficiencies: ["strength"] });
    expect(effectiveSavingThrowProficiencies(character)).toEqual(["strength"]);
  });

  it("drops a class saving throw removed for this character, keeping its rule source", () => {
    const character = makeTestCharacter({
      classId: "clerc",
      removedSavingThrowProficiencies: ["charisma"],
    });
    expect(effectiveSavingThrowProficiencies(character)).toEqual(["wisdom"]);
    expect(savingThrowGrantedBy(character, "charisma")).toBe("Clerc");
  });
});

describe("computeInitiative", () => {
  it("is the effective Dexterity modifier (racial bonus included)", () => {
    const character = makeTestCharacter({
      abilityScores: { ...makeTestCharacter().abilityScores, dexterity: 13 },
      raceSelection: { raceId: "humain-variant", abilityBonusChoices: ["dexterity"] },
    });
    expect(computeInitiative(character)).toEqual({
      total: 2,
      breakdown: [{ label: "Dex", value: 2 }],
    });
  });

  it("adds an extra bonus outside the rules (ex : Alert feat)", () => {
    const character = makeTestCharacter({ initiativeExtraBonus: 5 });
    expect(computeInitiative(character).total).toBe(5);
  });
});

describe("computeSpeed", () => {
  it("takes the speed of a known race", () => {
    expect(computeSpeed(makeTestCharacter({ raceSelection: HUMAN_VARIANT })).total).toBe(9);
  });

  it("falls back to the base speed, then to 9 m, for a race outside the registry", () => {
    expect(computeSpeed(makeTestCharacter({ baseSpeed: 7.5 })).total).toBe(7.5);
    expect(computeSpeed(makeTestCharacter()).total).toBe(9);
  });

  it("removes 3 m in heavy armor worn without the required Strength", () => {
    const heavy = {
      id: "plate",
      name: "Harnois",
      quantity: 1,
      equipped: true,
      armor: { category: "heavy" as const, baseArmorClass: 18, strengthRequirement: 15 },
    };
    const weak = makeTestCharacter({ raceSelection: HUMAN_VARIANT, inventory: [heavy] });
    expect(computeSpeed(weak).total).toBe(6);

    const strong = makeTestCharacter({
      raceSelection: HUMAN_VARIANT,
      inventory: [heavy],
      abilityScores: { ...makeTestCharacter().abilityScores, strength: 15 },
    });
    expect(computeSpeed(strong).total).toBe(9);
  });
});
