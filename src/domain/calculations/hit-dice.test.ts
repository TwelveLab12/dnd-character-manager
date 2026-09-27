import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import {
  computeHitDice,
  hitDiceRecoveredOnLongRest,
  hitDieHealing,
  rollDie,
  spendHitDice,
} from "./hit-dice";
import { applyLongRest, applyShortRest } from "./rest";

// Clerc niv. 5 (d8), Con 14 (+2) : PV max = 8 + 2 + 4 × (5 + 2) = 38.
const cleric = makeTestCharacter({
  classId: "clerc",
  level: 5,
  hitPoints: { current: 10, temporary: 0 },
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 14,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
});

describe("computeHitDice", () => {
  it("has one class die per level, minus the spent ones", () => {
    expect(computeHitDice({ ...cleric, hitDiceUsed: 2 })).toEqual({
      die: 8,
      total: 5,
      used: 2,
      remaining: 3,
      constitution: 2,
    });
  });

  it("clamps the spent dice to the pool", () => {
    expect(computeHitDice({ ...cleric, hitDiceUsed: 9 })?.remaining).toBe(0);
    expect(computeHitDice({ ...cleric, hitDiceUsed: -1 })?.used).toBe(0);
  });

  it("is undefined for a class outside the registry", () => {
    expect(computeHitDice(makeTestCharacter())).toBeUndefined();
  });
});

describe("hitDieHealing", () => {
  it("adds the Constitution modifier, never below 0", () => {
    expect(hitDieHealing(5, 2)).toBe(7);
    expect(hitDieHealing(1, -2)).toBe(0);
  });
});

describe("rollDie", () => {
  it("returns a result between 1 and the number of faces", () => {
    expect(rollDie(8, () => 0)).toBe(1);
    expect(rollDie(8, () => 0.999)).toBe(8);
  });
});

describe("spendHitDice", () => {
  it("heals roll + Con per die and counts the spent dice", () => {
    expect(spendHitDice(cleric, [5, 3])).toEqual({
      hitDiceUsed: 2,
      hitPoints: { current: 22, temporary: 0 },
    });
  });

  it("caps healing at max HP, ignores invalid rolls and dice beyond the pool", () => {
    const patch = spendHitDice({ ...cleric, hitDiceUsed: 4 }, [9, 0, 8, 8]);
    expect(patch).toEqual({ hitDiceUsed: 5, hitPoints: { current: 20, temporary: 0 } });
    expect(spendHitDice({ ...cleric, hitPoints: { current: 37, temporary: 0 } }, [8])).toEqual({
      hitDiceUsed: 1,
      hitPoints: { current: 38, temporary: 0 },
    });
  });

  it("changes nothing without a valid roll or a known hit die", () => {
    expect(spendHitDice(cleric, [])).toEqual({});
    expect(spendHitDice(makeTestCharacter(), [4])).toEqual({});
  });
});

describe("rests", () => {
  it("a short rest spends the rolled hit dice", () => {
    expect(applyShortRest(cleric, [4])).toMatchObject({
      hitDiceUsed: 1,
      hitPoints: { current: 16 },
    });
    expect(applyShortRest(cleric).hitDiceUsed).toBeUndefined();
  });

  it("a long rest recovers half the level in hit dice, at least 1", () => {
    expect([1, 2, 3, 5, 20].map(hitDiceRecoveredOnLongRest)).toEqual([1, 1, 1, 2, 10]);
    expect(applyLongRest({ ...cleric, hitDiceUsed: 5 }).hitDiceUsed).toBe(3);
    expect(applyLongRest({ ...cleric, hitDiceUsed: 1 }).hitDiceUsed).toBe(0);
    expect(applyLongRest(cleric).hitDiceUsed).toBe(0);
  });
});
