import { describe, expect, it } from "vitest";
import { barbarianFastMovement, rageUses } from "@/domain/character-class";
import type { Character } from "@/domain/character";
import { makeTestCharacter } from "@/test/fixtures";
import { computeArmorClass } from "./armor-class";
import { changeClass } from "./class-change";
import { computeClassResources } from "./class-resources";
import { computeSpeed, effectiveSavingThrowProficiencies } from "./combat-stats";
import { computeMaxHitPoints } from "./max-hit-points";

/** Murrik : nain des collines barbare niv. 3, Dex 13, Con 14 + 2. */
function murrik(overrides: Partial<Character> = {}) {
  return makeTestCharacter({
    class: "Barbare",
    classId: "barbare",
    level: 3,
    raceSelection: { raceId: "nain-des-collines", abilityBonusChoices: [] },
    abilityScores: {
      strength: 15,
      dexterity: 13,
      constitution: 14,
      intelligence: 8,
      wisdom: 12,
      charisma: 10,
    },
    ...overrides,
  });
}

const shield = {
  id: "bouclier",
  name: "Bouclier",
  quantity: 1,
  equipped: true,
  armor: { category: "shield" as const, baseArmorClass: 2 },
};
const plate = {
  id: "harnois",
  name: "Harnois",
  quantity: 1,
  equipped: true,
  armor: { category: "heavy" as const, baseArmorClass: 18, strengthRequirement: 15 },
};

describe("Barbare (règles 2014)", () => {
  it.each([
    [1, 2, 0],
    [3, 3, 0],
    [5, 3, 3],
    [6, 4, 3],
    [12, 5, 3],
    [17, 6, 3],
  ])("level %i → %i rages, +%i m", (level, rages, movement) => {
    expect(rageUses(level)).toBe(rages);
    expect(barbarianFastMovement(level)).toBe(movement);
  });

  it("computes d12 hit points (with Dwarven Toughness), saves and the Rage pool", () => {
    const character = murrik();
    expect(computeMaxHitPoints(character).total).toBe(38);
    expect(effectiveSavingThrowProficiencies(character)).toEqual(["strength", "constitution"]);
    expect(computeClassResources(character)).toEqual([
      { id: "rage", name: "Rage", recharge: "longRest", max: 3, used: 0, remaining: 3 },
    ]);
  });

  it("adds Constitution to the AC without armor, shield allowed", () => {
    expect(computeArmorClass(murrik()).total).toBe(14);
    expect(computeArmorClass(murrik({ inventory: [shield] })).breakdown).toEqual([
      { label: "Base", value: 10 },
      { label: "Dex", value: 1 },
      { label: "Con (Défense sans armure)", value: 3 },
      { label: "Bouclier", value: 2 },
    ]);
  });

  it("gains Fast Movement at level 5, lost in heavy armor only", () => {
    expect(computeSpeed(murrik()).total).toBe(7.5);
    expect(computeSpeed(murrik({ level: 5, inventory: [shield] })).total).toBe(10.5);
    // Nain : pas de pénalité d'armure lourde, mais le Déplacement rapide est perdu.
    expect(computeSpeed(murrik({ level: 5, inventory: [plate] })).total).toBe(7.5);
  });
});

describe("changeClass → Barbare (Murrik importé en texte libre)", () => {
  it("removes the manual values the rules now compute, keeping the final ones", () => {
    const before = murrik({
      classId: undefined,
      subclass: "Voie du guerrier totémique (Ours)",
      baseMaxHitPoints: 38,
      savingThrowProficiencies: ["strength", "constitution"],
      armorClassEffects: [
        {
          id: "defense-sans-armure",
          name: "Défense sans armure (Con)",
          bonus: 3,
          trigger: { type: "manual", active: true },
        },
      ],
      features: [
        {
          id: "rage",
          name: "Rage",
          source: "Barbare",
          description: "Action bonus.",
          usesMax: 3,
          usesCurrent: 3,
          recharge: "longRest",
        },
      ],
    });
    const patch = changeClass(before, "barbare");
    expect(patch).toMatchObject({
      classId: "barbare",
      subclassId: "guerrier-totemique",
      savingThrowProficiencies: [],
      baseMaxHitPoints: undefined,
      armorClassEffects: undefined,
      features: [{ id: "rage", name: "Rage", source: "Barbare", description: "Action bonus." }],
    });

    const after = { ...before, ...patch };
    expect(computeArmorClass(after).total).toBe(computeArmorClass(before).total);
    expect(computeMaxHitPoints(after).total).toBe(38);
    expect(effectiveSavingThrowProficiencies(after)).toEqual(["strength", "constitution"]);
  });
});
