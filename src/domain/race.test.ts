import { describe, expect, it } from "vitest";
import { effectiveAbilityScores } from "./calculations/effective-ability-scores";
import { findRaceDefinition } from "./race";

describe("findRaceDefinition", () => {
  it("finds a known race by id", () => {
    expect(findRaceDefinition("humain-variant")?.name).toBe("Humain variant");
  });

  it("returns undefined for an unknown id", () => {
    expect(findRaceDefinition("inconnue")).toBeUndefined();
  });
});

describe("Demi-elfe", () => {
  it("adds +2 Charisma and +1 to two other chosen abilities", () => {
    expect(
      effectiveAbilityScores(
        {
          strength: 8,
          dexterity: 13,
          constitution: 14,
          intelligence: 12,
          wisdom: 15,
          charisma: 10,
        },
        { raceId: "demi-elfe", abilityBonusChoices: ["constitution", "wisdom"] },
      ),
    ).toEqual({
      strength: 8,
      dexterity: 13,
      constitution: 15,
      intelligence: 12,
      wisdom: 16,
      charisma: 12,
    });
  });

  it("walks at 9 m", () => {
    expect(findRaceDefinition("demi-elfe")?.speed).toBe(9);
  });
});

describe("Nain des collines", () => {
  it("adds +2 Constitution and +1 Wisdom", () => {
    const base = {
      strength: 15,
      dexterity: 13,
      constitution: 14,
      intelligence: 8,
      wisdom: 12,
      charisma: 10,
    };
    expect(
      effectiveAbilityScores(base, { raceId: "nain-des-collines", abilityBonusChoices: [] }),
    ).toEqual({ ...base, constitution: 16, wisdom: 13 });
  });
});

describe("Tieffelin", () => {
  it("adds +2 Charisma and +1 Intelligence, and walks at 9 m", () => {
    const base = {
      strength: 10,
      dexterity: 15,
      constitution: 13,
      intelligence: 12,
      wisdom: 14,
      charisma: 8,
    };
    expect(effectiveAbilityScores(base, { raceId: "tieffelin", abilityBonusChoices: [] })).toEqual({
      ...base,
      intelligence: 13,
      charisma: 10,
    });
    expect(findRaceDefinition("tieffelin")?.speed).toBe(9);
  });
});
