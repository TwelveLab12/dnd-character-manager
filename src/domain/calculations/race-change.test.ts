import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { findRaceDefinitionByLabel } from "../race";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { changeRace } from "./race-change";

const MORDAI_FINAL = {
  strength: 10,
  dexterity: 15,
  constitution: 13,
  intelligence: 13,
  wisdom: 14,
  charisma: 10,
};

describe("findRaceDefinitionByLabel", () => {
  it("matches a known race regardless of case and accents", () => {
    expect(findRaceDefinitionByLabel("tieffelin")?.id).toBe("tieffelin");
    expect(findRaceDefinitionByLabel("Demi-Elfe")?.id).toBe("demi-elfe");
    expect(findRaceDefinitionByLabel("Elfe des bois")).toBeUndefined();
    expect(findRaceDefinitionByLabel(undefined)).toBeUndefined();
  });
});

describe("changeRace", () => {
  it("free text → known race keeps the effective scores and turns extra speed into a bonus", () => {
    const mordai = makeTestCharacter({
      race: "Tieffelin",
      abilityScores: MORDAI_FINAL,
      baseSpeed: 12,
    });
    const patch = changeRace(mordai, "tieffelin");
    expect(patch).toMatchObject({
      race: "Tieffelin",
      raceSelection: { raceId: "tieffelin", abilityBonusChoices: [] },
      abilityScores: { ...MORDAI_FINAL, intelligence: 12, charisma: 8 },
      baseSpeed: undefined,
      speedExtraBonus: 3,
    });
    const next = { ...mordai, ...patch };
    expect(effectiveAbilityScores(next.abilityScores, next.raceSelection)).toEqual(MORDAI_FINAL);
  });

  it("drops a base speed slower than or equal to the race's, without bonus", () => {
    const dwarf = makeTestCharacter({ race: "Nain des collines", baseSpeed: 7.5 });
    const patch = changeRace(dwarf, "nain-des-collines");
    expect(patch.baseSpeed).toBeUndefined();
    expect(patch).not.toHaveProperty("speedExtraBonus");
  });

  it("known race → free text keeps the effective scores and the race speed", () => {
    const halfElf = makeTestCharacter({
      abilityScores: { ...MORDAI_FINAL, charisma: 8 },
      raceSelection: { raceId: "demi-elfe", abilityBonusChoices: ["constitution", "wisdom"] },
    });
    expect(changeRace(halfElf, undefined)).toEqual({
      raceSelection: undefined,
      abilityScores: { ...MORDAI_FINAL, constitution: 14, wisdom: 15, charisma: 10 },
      baseSpeed: 9,
    });
  });

  it("between known races, only changes the race and resets the choices", () => {
    const character = makeTestCharacter({
      raceSelection: { raceId: "demi-elfe", abilityBonusChoices: ["wisdom"] },
    });
    expect(changeRace(character, "tieffelin")).toEqual({
      race: "Tieffelin",
      raceSelection: { raceId: "tieffelin", abilityBonusChoices: [] },
    });
    expect(changeRace(character, "demi-elfe")).toEqual({});
  });
});
