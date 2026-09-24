import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import {
  preparedSpellsMax,
  resolveSpellcasting,
  resolvedSpellAttackBonus,
  resolvedSpellSaveDC,
  spellAttackBonus,
  spellSaveDC,
} from "./spellcasting";

describe("spellSaveDC", () => {
  it("adds 8 + proficiency + ability modifier", () => {
    expect(spellSaveDC(2, 3)).toBe(13);
    expect(spellSaveDC(6, 5)).toBe(19);
  });
});

describe("spellAttackBonus", () => {
  it("adds proficiency + ability modifier", () => {
    expect(spellAttackBonus(2, 3)).toBe(5);
    expect(spellAttackBonus(6, 5)).toBe(11);
  });
});

describe("resolvedSpellSaveDC", () => {
  it("computes the theoretical DC when there is no override (level 3, WIS 16 -> mod +3, prof +2)", () => {
    expect(resolvedSpellSaveDC(3, 16)).toBe(13);
  });

  it("prefers the override, even when it's 0", () => {
    expect(resolvedSpellSaveDC(3, 16, 99)).toBe(99);
    expect(resolvedSpellSaveDC(3, 16, 0)).toBe(0);
  });

  it("clamps an out-of-range level rather than throwing", () => {
    expect(() => resolvedSpellSaveDC(0, 16)).not.toThrow();
  });
});

describe("resolvedSpellAttackBonus", () => {
  it("computes the theoretical bonus when there is no override", () => {
    expect(resolvedSpellAttackBonus(3, 16)).toBe(5);
  });

  it("prefers the override, even when it's 0", () => {
    expect(resolvedSpellAttackBonus(3, 16, 99)).toBe(99);
    expect(resolvedSpellAttackBonus(3, 16, 0)).toBe(0);
  });
});

describe("preparedSpellsMax", () => {
  it("adds the ability modifier and the level, with a minimum of 1", () => {
    expect(preparedSpellsMax(3, 3)).toBe(6);
    expect(preparedSpellsMax(1, -1)).toBe(1);
    expect(preparedSpellsMax(1, -3)).toBe(1);
  });
});

describe("resolveSpellcasting — preparation", () => {
  const wisdom16 = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 16,
    charisma: 16,
  };

  it("computes the prepared-spell limit of a Cleric, and lets an override take precedence", () => {
    const cleric = makeTestCharacter({ classId: "clerc", level: 3, abilityScores: wisdom16 });
    expect(resolveSpellcasting(cleric)).toMatchObject({
      preparation: "prepared",
      preparedSpellsMax: 6,
      abilityModifier: 3,
      proficiencyBonus: 2,
    });
    const forced = { ...cleric, spellcasting: { preparedSpellsMaxOverride: 8 } };
    expect(resolveSpellcasting(forced)).toMatchObject({
      preparedSpellsMax: 8,
      computed: { preparedSpellsMax: 6 },
    });
  });

  it("has no limit for a Sorcerer (known spells) nor for a class outside the registry", () => {
    const sorcerer = makeTestCharacter({ classId: "ensorceleur", abilityScores: wisdom16 });
    expect(resolveSpellcasting(sorcerer)).toMatchObject({
      preparation: "known",
      preparedSpellsMax: undefined,
    });
    const custom = makeTestCharacter({ spellcasting: { ability: "wisdom" } });
    expect(resolveSpellcasting(custom)).toMatchObject({
      preparation: "prepared",
      preparedSpellsMax: undefined,
    });
  });
});
