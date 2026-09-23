import { describe, expect, it } from "vitest";
import {
  resolvedSpellAttackBonus,
  resolvedSpellSaveDC,
  spellAttackBonus,
  spellSaveDC,
} from "./spellcasting";

describe("spellSaveDC", () => {
  it("adds 8 + proficiency + ability modifier", () => {
    expect(spellSaveDC(2, 3)).toBe(13);
    expect(spellSaveDC(6, 5)).toBe(19);
  });
});

describe("spellAttackBonus", () => {
  it("adds proficiency + ability modifier", () => {
    expect(spellAttackBonus(2, 3)).toBe(5);
    expect(spellAttackBonus(6, 5)).toBe(11);
  });
});

describe("resolvedSpellSaveDC", () => {
  it("computes the theoretical DC when there is no override (level 3, WIS 16 -> mod +3, prof +2)", () => {
    expect(resolvedSpellSaveDC(3, 16)).toBe(13);
  });

  it("prefers the override, even when it's 0", () => {
    expect(resolvedSpellSaveDC(3, 16, 99)).toBe(99);
    expect(resolvedSpellSaveDC(3, 16, 0)).toBe(0);
  });

  it("clamps an out-of-range level rather than throwing", () => {
    expect(() => resolvedSpellSaveDC(0, 16)).not.toThrow();
  });
});

describe("resolvedSpellAttackBonus", () => {
  it("computes the theoretical bonus when there is no override", () => {
    expect(resolvedSpellAttackBonus(3, 16)).toBe(5);
  });

  it("prefers the override, even when it's 0", () => {
    expect(resolvedSpellAttackBonus(3, 16, 99)).toBe(99);
    expect(resolvedSpellAttackBonus(3, 16, 0)).toBe(0);
  });
});
