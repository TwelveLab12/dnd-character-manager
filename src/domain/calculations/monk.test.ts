import { describe, expect, it } from "vitest";
import { kiPoints, monkUnarmoredMovement } from "@/domain/character-class";
import type { Character } from "@/domain/character";
import { makeTestCharacter } from "@/test/fixtures";
import { computeArmorClass } from "./armor-class";
import { computeClassResourceOptions, hasMartialArts } from "./class-features";
import { changeClass } from "./class-change";
import { computeClassResources } from "./class-resources";
import { computeSpeed, effectiveSavingThrowProficiencies } from "./combat-stats";
import { computeMaxHitPoints } from "./max-hit-points";
import { computeWeaponAttacks } from "./weapon-attack";

/** Mordaï : moine tieffelin niv. 3, Dex 15, Sag 14. */
function mordai(overrides: Partial<Character> = {}) {
  return makeTestCharacter({
    class: "Moine",
    classId: "moine",
    level: 3,
    raceSelection: { raceId: "tieffelin", abilityBonusChoices: [] },
    abilityScores: {
      strength: 10,
      dexterity: 15,
      constitution: 13,
      intelligence: 12,
      wisdom: 14,
      charisma: 8,
    },
    ...overrides,
  });
}

const leather = {
  id: "cuir",
  name: "Armure de cuir",
  quantity: 1,
  equipped: true,
  armor: { category: "light" as const, baseArmorClass: 11 },
};

describe("Moine (règles 2014)", () => {
  it.each([
    [1, 0, 0],
    [2, 2, 3],
    [5, 5, 3],
    [6, 6, 4.5],
    [10, 10, 6],
    [18, 18, 9],
    [20, 20, 9],
  ])("level %i → %i ki, +%f m", (level, ki, movement) => {
    expect(kiPoints(level)).toBe(ki);
    expect(monkUnarmoredMovement(level)).toBe(movement);
  });

  it("computes d8 hit points, Strength and Dexterity saves, and the Ki pool", () => {
    const character = mordai({ classResourcesUsed: { ki: 1 } });
    expect(computeMaxHitPoints(character).total).toBe(21);
    expect(effectiveSavingThrowProficiencies(character)).toEqual(["strength", "dexterity"]);
    expect(computeClassResources(character)).toEqual([
      { id: "ki", name: "Ki", recharge: "shortRest", max: 3, used: 1, remaining: 2 },
    ]);
    expect(computeClassResourceOptions(character, "ki").map((option) => option.name)).toEqual([
      "Déluge de coups",
      "Patience défensive",
      "Déplacement du vent",
    ]);
  });

  it("adds Unarmored Defense and Unarmored Movement only without armor or shield", () => {
    expect(computeArmorClass(mordai()).breakdown).toEqual([
      { label: "Base", value: 10 },
      { label: "Dex", value: 2 },
      { label: "Sag (Défense sans armure)", value: 2 },
    ]);
    expect(computeSpeed(mordai()).total).toBe(12);

    const armored = mordai({ inventory: [leather] });
    expect(computeArmorClass(armored).total).toBe(13);
    expect(computeSpeed(armored).total).toBe(9);
  });

  it("grants Martial Arts, which the player can turn off for this character", () => {
    expect(hasMartialArts(mordai())).toBe(true);
    expect(computeWeaponAttacks(mordai()).map((attack) => attack.name)).toEqual(["Mains nues"]);
    expect(hasMartialArts(mordai({ martialArts: false }))).toBe(false);
    expect(hasMartialArts(makeTestCharacter({ martialArts: true }))).toBe(true);
  });
});

describe("changeClass", () => {
  const freeTextMordai = mordai({
    classId: undefined,
    subclass: "Voie de la main ouverte",
    baseMaxHitPoints: 21,
    savingThrowProficiencies: ["strength", "dexterity"],
    martialArts: true,
    speedExtraBonus: 3,
    armorClassEffects: [
      {
        id: "defense-sans-armure",
        name: "Défense sans armure (Sag)",
        bonus: 2,
        trigger: { type: "manual", active: true },
      },
    ],
    features: [
      {
        id: "ki",
        name: "Ki",
        source: "Moine",
        description: "Points de ki.",
        usesMax: 3,
        usesCurrent: 2,
        recharge: "shortRest",
      },
    ],
  });

  it("free text → Moine removes what the rules now compute, keeping the same values", () => {
    const patch = changeClass(freeTextMordai, "moine");
    expect(patch).toMatchObject({
      classId: "moine",
      class: "Moine",
      subclassId: "main-ouverte",
      savingThrowProficiencies: [],
      baseMaxHitPoints: undefined,
      martialArts: undefined,
      armorClassEffects: undefined,
      speedExtraBonus: undefined,
      features: [{ id: "ki", name: "Ki", source: "Moine", description: "Points de ki." }],
    });

    const before = freeTextMordai;
    const after = { ...before, ...patch };
    expect(computeArmorClass(after).total).toBe(computeArmorClass(before).total);
    expect(computeSpeed(after).total).toBe(computeSpeed(before).total);
    expect(computeMaxHitPoints(after).total).toBe(21);
    expect(effectiveSavingThrowProficiencies(after)).toEqual(["strength", "dexterity"]);
    expect(hasMartialArts(after)).toBe(true);
  });

  it("Moine → free text writes the computed values back as manual entries", () => {
    const monk = mordai();
    const patch = changeClass(monk, undefined);
    const after = { ...monk, ...patch };
    expect(patch).toMatchObject({ classId: undefined, baseMaxHitPoints: 21, speedExtraBonus: 3 });
    expect(computeArmorClass(after).total).toBe(14);
    expect(computeSpeed(after).total).toBe(12);
    expect(effectiveSavingThrowProficiencies(after)).toEqual(["strength", "dexterity"]);
    expect(hasMartialArts(after)).toBe(true);
  });

  it("between known classes, only changes the class and resets the subclass", () => {
    expect(changeClass(mordai(), "clerc")).toEqual({
      classId: "clerc",
      class: "Clerc",
      subclassId: undefined,
      subclass: undefined,
    });
  });
});
