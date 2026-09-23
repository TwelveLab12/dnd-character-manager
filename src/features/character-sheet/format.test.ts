import { describe, expect, it } from "vitest";
import { formatModifier } from "./format";

describe("formatModifier", () => {
  it.each([
    [3, "+3"],
    [0, "+0"],
    [-1, "-1"],
  ])("formats %i as %s", (modifier, expected) => {
    expect(formatModifier(modifier)).toBe(expected);
  });
});
