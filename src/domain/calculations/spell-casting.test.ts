import { describe, expect, it } from "vitest";
import { makeTestCharacter, makeTestSpell } from "@/test/fixtures";
import { castOptions, castSpell } from "./spell-casting";

// Clerc niv. 3 : 4 emplacements de niveau 1, 2 de niveau 2.
const cleric = makeTestCharacter({ classId: "clerc", level: 3, spellSlotsUsed: { "1": 4 } });

describe("castOptions", () => {
  it("proposes the lowest available slot at or above the spell level", () => {
    const options = castOptions(cleric, makeTestSpell({ level: 1 }));
    expect(options.slots).toEqual([
      { level: 1, available: 0, total: 4 },
      { level: 2, available: 2, total: 2 },
    ]);
    expect(options.defaultSlotLevel).toBe(2);
  });

  it("has no slot for a cantrip, and no default slot when all are spent", () => {
    expect(castOptions(cleric, makeTestSpell({ level: 0 }))).toEqual({
      defaultSlotLevel: undefined,
      slots: [],
      canRitual: false,
    });
    const spent = { ...cleric, spellSlotsUsed: { "1": 4, "2": 2 } };
    const ritual = castOptions(spent, makeTestSpell({ level: 1, ritual: true }));
    expect(ritual.defaultSlotLevel).toBeUndefined();
    expect(ritual.canRitual).toBe(true);
  });
});

describe("castSpell", () => {
  it("spends the chosen slot and leaves concentration alone for a plain spell", () => {
    const patch = castSpell(cleric, makeTestSpell({ level: 1 }), { type: "slot", level: 2 });
    expect(patch.spellSlotsUsed).toEqual({ "1": 4, "2": 1 });
    expect(patch.concentration).toEqual(cleric.concentration);
  });

  it("starts concentration on a concentration spell, replacing the previous one", () => {
    const concentrating = { ...cleric, concentration: { active: true, spellId: "bless" } };
    const patch = castSpell(
      concentrating,
      makeTestSpell({ id: "moonbeam", level: 2, concentration: true }),
      { type: "slot", level: 2 },
    );
    expect(patch.concentration).toEqual({ active: true, spellId: "moonbeam" });
  });

  it("spends nothing for a ritual or a cantrip", () => {
    const ritual = castSpell(cleric, makeTestSpell({ level: 1, ritual: true }), {
      type: "ritual",
    });
    expect(ritual.spellSlotsUsed).toEqual(cleric.spellSlotsUsed);
    const cantrip = castSpell(cleric, makeTestSpell({ level: 0 }), { type: "cantrip" });
    expect(cantrip.spellSlotsUsed).toEqual(cleric.spellSlotsUsed);
  });
});
