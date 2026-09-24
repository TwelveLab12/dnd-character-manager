import { describe, expect, it } from "vitest";
import type { Character } from "../character";
import type { CharacterSpellTag } from "../spell-tag";
import { isAlwaysAvailable, playAvailableSpellIds, spellDomainTags } from "./spell-availability";

function makeTag(overrides: Partial<CharacterSpellTag> = {}): CharacterSpellTag {
  return { spellId: "spell-1", alwaysPrepared: false, ...overrides };
}

const BASE: Character = {
  id: "char-1",
  name: "Test",
  class: "Clerc",
  level: 5,
  hitPoints: { current: 30, temporary: 0 },
  baseMaxHitPoints: 30,
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
  spellSlotsUsed: {},
  classResourcesUsed: {},
  knownSpellIds: ["cure-wounds", "guidance", "moonbeam"],
  preparedSpellIds: ["cure-wounds"],
  spellTags: [],
  inventory: [],
  features: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("playAvailableSpellIds", () => {
  it("returns only prepared spells when no tag is always-prepared", () => {
    const character: Character = {
      ...BASE,
      spellTags: [makeTag({ spellId: "guidance", domain: "Domaine de la Lune" })],
    };
    expect(playAvailableSpellIds(character)).toEqual(["cure-wounds"]);
  });

  it("adds always-prepared spells even if not in preparedSpellIds", () => {
    const character: Character = {
      ...BASE,
      spellTags: [
        makeTag({ spellId: "moonbeam", domain: "Domaine de la Lune", alwaysPrepared: true }),
      ],
    };
    expect(playAvailableSpellIds(character)).toEqual(["cure-wounds", "moonbeam"]);
  });

  it("deduplicates a spell that is both prepared and always-prepared", () => {
    const character: Character = {
      ...BASE,
      spellTags: [makeTag({ spellId: "cure-wounds", alwaysPrepared: true })],
    };
    expect(playAvailableSpellIds(character)).toEqual(["cure-wounds"]);
  });
});

describe("spellDomainTags", () => {
  it("returns distinct non-empty domains", () => {
    const character: Character = {
      ...BASE,
      spellTags: [
        makeTag({ spellId: "moonbeam", domain: "Domaine de la Lune" }),
        makeTag({ spellId: "guidance", domain: "Domaine de la Lune" }),
        makeTag({ spellId: "cure-wounds" }),
      ],
    };
    expect(spellDomainTags(character)).toEqual(["Domaine de la Lune"]);
  });

  it("returns an empty array when no tag has a domain", () => {
    expect(spellDomainTags({ ...BASE, spellTags: [makeTag()] })).toEqual([]);
  });
});

describe("isAlwaysAvailable", () => {
  it("is true only for a tagged always-prepared spell", () => {
    const character: Character = {
      ...BASE,
      spellTags: [makeTag({ spellId: "moonbeam", alwaysPrepared: true })],
    };
    expect(isAlwaysAvailable(character, "moonbeam")).toBe(true);
    expect(isAlwaysAvailable(character, "guidance")).toBe(false);
  });
});
