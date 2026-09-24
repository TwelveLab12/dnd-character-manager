import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { adjustSpellSlotsUsed, computeSpellSlots, fullCasterSpellSlots } from "./spell-slot-table";

describe("fullCasterSpellSlots", () => {
  it("returns only non-zero slot levels for level 1 (2 level-1 slots)", () => {
    expect(fullCasterSpellSlots(1)).toEqual([{ level: 1, total: 2, used: 0 }]);
  });

  it("matches the Elara Duskwood level 3 reference sheet (4 level-1 / 2 level-2 slots)", () => {
    expect(fullCasterSpellSlots(3)).toEqual([
      { level: 1, total: 4, used: 0 },
      { level: 2, total: 2, used: 0 },
    ]);
  });

  it("returns all 9 spell levels at character level 20", () => {
    const slots = fullCasterSpellSlots(20);
    expect(slots).toHaveLength(9);
    expect(slots.map((slot) => slot.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(slots[0]).toEqual({ level: 1, total: 4, used: 0 });
    expect(slots[8]).toEqual({ level: 9, total: 1, used: 0 });
  });

  it.each([0, -1, 21, 1.5])("rejects invalid level %s", (level) => {
    expect(() => fullCasterSpellSlots(level)).toThrow(RangeError);
  });
});

describe("computeSpellSlots", () => {
  it("derives totals from the class and level, with the stored usage", () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 3,
      spellSlotsUsed: { "1": 1 },
    });
    expect(computeSpellSlots(character)).toEqual([
      { level: 1, total: 4, used: 1 },
      { level: 2, total: 2, used: 0 },
    ]);
  });

  it("follows the level: a level-up raises the totals without touching stored data", () => {
    const character = makeTestCharacter({ classId: "clerc", level: 5 });
    expect(computeSpellSlots(character).map((slot) => slot.total)).toEqual([4, 3, 2]);
  });

  it("clamps a stored usage above the computed total", () => {
    const character = makeTestCharacter({ classId: "clerc", level: 1, spellSlotsUsed: { "1": 9 } });
    expect(computeSpellSlots(character)).toEqual([{ level: 1, total: 2, used: 2 }]);
  });

  it("returns no slots for an unknown or missing class", () => {
    expect(computeSpellSlots(makeTestCharacter({ classId: undefined }))).toEqual([]);
    expect(computeSpellSlots(makeTestCharacter({ classId: "inconnue" }))).toEqual([]);
  });
});

describe("adjustSpellSlotsUsed", () => {
  const cleric = makeTestCharacter({ classId: "clerc", level: 3, spellSlotsUsed: { "1": 1 } });

  it("spends and recovers a slot", () => {
    expect(adjustSpellSlotsUsed(cleric, 1, 1)).toEqual({ "1": 2 });
    expect(adjustSpellSlotsUsed(cleric, 1, -1)).toEqual({ "1": 0 });
  });

  it("clamps between zero and the computed total", () => {
    expect(adjustSpellSlotsUsed(cleric, 1, -5)).toEqual({ "1": 0 });
    expect(adjustSpellSlotsUsed(cleric, 2, 5)).toEqual({ "1": 1, "2": 2 });
  });

  it("ignores a spell level the character has no slot for", () => {
    expect(adjustSpellSlotsUsed(cleric, 5, 1)).toEqual({ "1": 1 });
  });
});
