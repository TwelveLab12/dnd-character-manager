import { describe, expect, it } from "vitest";
import { adjustSpellSlotUsage, fullCasterSpellSlots } from "./spell-slot-table";

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

describe("adjustSpellSlotUsage", () => {
  it("increments used", () => {
    expect(adjustSpellSlotUsage({ level: 1, total: 4, used: 1 }, 1)).toEqual({
      level: 1,
      total: 4,
      used: 2,
    });
  });

  it("decrements used", () => {
    expect(adjustSpellSlotUsage({ level: 1, total: 4, used: 2 }, -1)).toEqual({
      level: 1,
      total: 4,
      used: 1,
    });
  });

  it("clamps at zero", () => {
    expect(adjustSpellSlotUsage({ level: 1, total: 4, used: 0 }, -1).used).toBe(0);
  });

  it("clamps at total", () => {
    expect(adjustSpellSlotUsage({ level: 1, total: 4, used: 4 }, 1).used).toBe(4);
  });
});
