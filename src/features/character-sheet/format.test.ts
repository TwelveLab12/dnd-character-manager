import { describe, expect, it } from "vitest";
import { clampCharacterLevel, formatModifier } from "./format";

describe("formatModifier", () => {
  it.each([
    [3, "+3"],
    [0, "+0"],
    [-1, "-1"],
  ])("formats %i as %s", (modifier, expected) => {
    expect(formatModifier(modifier)).toBe(expected);
  });
});

describe("clampCharacterLevel", () => {
  it.each([
    [0, 1],
    [-5, 1],
    [21, 20],
    [1.9, 1],
    [Number.NaN, 1],
    [10, 10],
  ])("clamps %s to %i", (level, expected) => {
    expect(clampCharacterLevel(level)).toBe(expected);
  });
});
