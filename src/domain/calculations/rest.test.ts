import { describe, expect, it } from "vitest";
import type { Character } from "../character";
import type { CharacterFeature } from "../feature";
import { applyLongRest, applyShortRest } from "./rest";

function makeFeature(overrides: Partial<CharacterFeature> = {}): CharacterFeature {
  return {
    id: "feature-1",
    name: "Channel Divinity",
    source: "Clerc",
    description: "",
    ...overrides,
  };
}

const BASE: Character = {
  id: "char-1",
  name: "Test",
  class: "Clerc",
  classId: "clerc",
  level: 5,
  hitPoints: { current: 3, max: 30, temporary: 4 },
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  savingThrowProficiencies: [],
  skillProficiencies: [],
  concentration: { active: false },
  spellSlotsUsed: { "1": 4, "2": 1 },
  classResourcesUsed: { "channel-divinity": 1 },
  knownSpellIds: [],
  preparedSpellIds: [],
  spellTags: [],
  inventory: [],
  features: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("applyLongRest", () => {
  it("restores current hit points to max without touching temporary hit points", () => {
    const result = applyLongRest(BASE);
    expect(result.hitPoints).toEqual({ current: 30, max: 30, temporary: 4 });
  });

  it("resets all spell slots usage to zero", () => {
    expect(applyLongRest(BASE).spellSlotsUsed).toEqual({});
  });

  it("restores class resources, including those recovered on a short rest", () => {
    expect(applyLongRest(BASE).classResourcesUsed).toEqual({});
  });

  it("restores usesCurrent to usesMax for longRest and shortRest features", () => {
    const character: Character = {
      ...BASE,
      features: [
        makeFeature({ id: "a", recharge: "longRest", usesMax: 3, usesCurrent: 0 }),
        makeFeature({ id: "b", recharge: "shortRest", usesMax: 2, usesCurrent: 0 }),
        makeFeature({ id: "c", recharge: "other", usesMax: 1, usesCurrent: 0 }),
        makeFeature({ id: "d" }),
      ],
    };
    const result = applyLongRest(character);
    expect(result.features).toEqual([
      makeFeature({ id: "a", recharge: "longRest", usesMax: 3, usesCurrent: 3 }),
      makeFeature({ id: "b", recharge: "shortRest", usesMax: 2, usesCurrent: 2 }),
      makeFeature({ id: "c", recharge: "other", usesMax: 1, usesCurrent: 0 }),
      makeFeature({ id: "d" }),
    ]);
  });

  it("leaves a longRest feature without usesMax untouched", () => {
    const character: Character = {
      ...BASE,
      features: [makeFeature({ recharge: "longRest" })],
    };
    expect(applyLongRest(character).features).toEqual([makeFeature({ recharge: "longRest" })]);
  });
});

describe("applyShortRest", () => {
  it("restores only shortRest features and resources, ignores hit points and spell slots", () => {
    const character: Character = {
      ...BASE,
      features: [
        makeFeature({ id: "a", recharge: "longRest", usesMax: 3, usesCurrent: 0 }),
        makeFeature({ id: "b", recharge: "shortRest", usesMax: 2, usesCurrent: 0 }),
      ],
    };
    const result = applyShortRest(character);
    expect(result.features).toEqual([
      makeFeature({ id: "a", recharge: "longRest", usesMax: 3, usesCurrent: 0 }),
      makeFeature({ id: "b", recharge: "shortRest", usesMax: 2, usesCurrent: 2 }),
    ]);
    expect(result.classResourcesUsed).toEqual({});
    expect(result.hitPoints).toBeUndefined();
    expect(result.spellSlotsUsed).toBeUndefined();
  });
});
