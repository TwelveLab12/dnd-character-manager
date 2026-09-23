import { describe, expect, it } from "vitest";
import { proficiencyBonusForLevel } from "./proficiency";

describe("proficiencyBonusForLevel", () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])("level %i -> bonus +%i", (level, expected) => {
    expect(proficiencyBonusForLevel(level)).toBe(expected);
  });

  it.each([0, -1, 21, 1.5])("rejects invalid level %s", (level) => {
    expect(() => proficiencyBonusForLevel(level)).toThrow(RangeError);
  });
});
