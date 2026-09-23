import { describe, expect, it } from "vitest";
import { spellAttackBonus, spellSaveDC } from "./spellcasting";

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
