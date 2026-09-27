import { describe, expect, it } from "vitest";
import type { Character } from "../character";
import type { BeastForm } from "../wild-shape";
import { makeTestCharacter } from "@/test/fixtures";
import { computeArmorClass } from "./armor-class";
import { computeInitiative, computeSpeed } from "./combat-stats";
import { applyLongRest, applyShortRest } from "./rest";
import { computeReadyWeaponAttacks, computeWeaponAttacks } from "./weapon-attack";
import {
  displayedHitPoints,
  healInPlay,
  setHitPointsInPlay,
  startWildShape,
  takeDamage,
  wildShapeUnavailableReason,
} from "./wild-shape";
import {
  parseChallengeRating,
  playAbilityScores,
  wildShapeDurationHours,
  wildShapeFormWarnings,
} from "./wild-shape-form";

const wolf: BeastForm = {
  id: "wolf",
  name: "Loup",
  challengeRating: "1/4",
  strength: 12,
  dexterity: 15,
  constitution: 12,
  armorClass: 13,
  maxHitPoints: 11,
  speed: 12,
  attacks: [
    {
      id: "bite",
      name: "Morsure",
      attackBonus: 4,
      damageDice: "2d4",
      damageBonus: 2,
      damageType: "piercing",
      notes: "JS de Force DD 11 ou à terre.",
    },
  ],
};
const crocodile: BeastForm = {
  ...wolf,
  id: "croc",
  name: "Crocodile",
  challengeRating: "1/2",
  swimSpeed: 9,
};

function druid(overrides: Partial<Character> = {}): Character {
  return makeTestCharacter({
    classId: "druide",
    level: 3,
    abilityScores: {
      strength: 8,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 16,
      charisma: 10,
    },
    hitPoints: { current: 20, temporary: 0 },
    wildShapeForms: [wolf, crocodile],
    ...overrides,
  });
}

const shaped = (overrides: Partial<Character> = {}) =>
  druid({ wildShape: { formId: "wolf", hitPoints: 11 }, ...overrides });

describe("Forme sauvage", () => {
  it("parses challenge ratings and checks the level limits", () => {
    expect(parseChallengeRating("1/4")).toBe(0.25);
    expect(parseChallengeRating("2")).toBe(2);
    expect(parseChallengeRating("?")).toBeUndefined();
    expect(wildShapeFormWarnings(druid(), wolf)).toEqual([]);
    expect(wildShapeFormWarnings(druid(), crocodile)).toHaveLength(2);
    expect(wildShapeFormWarnings(druid({ level: 4 }), crocodile)).toEqual([]);
    expect(wildShapeDurationHours(3)).toBe(1);
  });

  it("spends a use, fills the beast HP and ends the symbiotic entity", () => {
    const patch = startWildShape(druid({ symbioticEntity: true }), "wolf");
    expect(patch.wildShape).toEqual({ formId: "wolf", hitPoints: 11 });
    expect(patch.classResourcesUsed?.["wild-shape"]).toBe(1);
    expect("symbioticEntity" in patch).toBe(true);
    expect(patch.symbioticEntity).toBeUndefined();
    const spent = druid({ classResourcesUsed: { "wild-shape": 2 } });
    expect(wildShapeUnavailableReason(spent)).toBeDefined();
    expect(startWildShape(spent, "wolf")).toEqual({});
  });

  it("swaps physical abilities, AC, speed, initiative and attacks", () => {
    const character = shaped();
    expect(playAbilityScores(character)).toMatchObject({
      strength: 12,
      dexterity: 15,
      constitution: 12,
      wisdom: 16,
    });
    expect(computeArmorClass(character).total).toBe(13);
    expect(computeSpeed(character).total).toBe(12);
    expect(computeInitiative(character).total).toBe(2);
    const [bite] = computeWeaponAttacks(character);
    expect(bite).toMatchObject({ name: "Morsure", attackBonus: 4, damage: "2d4+2" });
    expect(computeReadyWeaponAttacks(character)).toEqual([]);
    expect(displayedHitPoints(character)).toMatchObject({ current: 11, max: 11, formName: "Loup" });
  });

  it("damages the beast first, then carries the excess over when it drops to 0", () => {
    expect(takeDamage(shaped(), 4)).toMatchObject({ wildShape: { formId: "wolf", hitPoints: 7 } });
    const reverted = takeDamage(shaped({ hitPoints: { current: 20, temporary: 3 } }), 18);
    // 3 PV temporaires, 11 PV de loup, 4 de surplus.
    expect(reverted.wildShape).toBeUndefined();
    expect("wildShape" in reverted).toBe(true);
    expect(reverted.hitPoints).toEqual({ current: 16, temporary: 0 });
    expect(takeDamage(druid(), 5).hitPoints).toEqual({ current: 15, temporary: 0 });
  });

  it("heals and sets the beast HP, 0 meaning a return to normal form", () => {
    const hurt = shaped({ wildShape: { formId: "wolf", hitPoints: 3 } });
    expect(healInPlay(hurt, 20)).toEqual({ wildShape: { formId: "wolf", hitPoints: 11 } });
    expect(setHitPointsInPlay(hurt, 0)).toEqual({ wildShape: undefined });
  });

  it("ends on a long rest, and on a short rest when it only lasts an hour", () => {
    expect("wildShape" in applyLongRest(shaped({ level: 8 }))).toBe(true);
    expect("wildShape" in applyShortRest(shaped())).toBe(true);
    expect("wildShape" in applyShortRest(shaped({ level: 4 }))).toBe(false);
  });
});
