import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { computeMaxHitPoints, fixedHitDieValue } from "./max-hit-points";

/** Yomi : Clerc (d8), Con 14 + 1 (humain variant) = 15 → +2. */
function yomi(overrides: Parameters<typeof makeTestCharacter>[0] = {}) {
  return makeTestCharacter({
    classId: "clerc",
    level: 3,
    abilityScores: { ...makeTestCharacter().abilityScores, constitution: 14 },
    raceSelection: { raceId: "humain-variant", abilityBonusChoices: ["constitution"] },
    ...overrides,
  });
}

describe("fixedHitDieValue", () => {
  it.each([
    [6, 4],
    [8, 5],
    [10, 6],
    [12, 7],
  ])("d%i → %i", (die, value) => {
    expect(fixedHitDieValue(die)).toBe(value);
  });
});

describe("computeMaxHitPoints", () => {
  it("uses the die maximum at level 1 and the fixed value afterwards (Yomi : 24)", () => {
    const result = computeMaxHitPoints(yomi());
    expect(result).toMatchObject({ total: 24, hitDie: 8, method: "fixed", warnings: [] });
    expect(result.levels.map((entry) => entry.total)).toEqual([10, 7, 7]);
  });

  it("uses the rolled results, adding Constitution automatically", () => {
    const result = computeMaxHitPoints(yomi({ hitPointMethod: "rolled", hitPointRolls: [3, 8] }));
    expect(result.levels.map((entry) => entry.total)).toEqual([10, 5, 10]);
    expect(result.total).toBe(25);
  });

  it("falls back to the fixed value for a missing or invalid roll, with a warning", () => {
    const result = computeMaxHitPoints(yomi({ hitPointMethod: "rolled", hitPointRolls: [12] }));
    expect(result.total).toBe(24);
    expect(result.warnings).toHaveLength(2);
  });

  it("applies Constitution retroactively to every level", () => {
    const tougher = yomi({
      abilityScores: { ...makeTestCharacter().abilityScores, constitution: 16 },
    });
    // Con 17 → +3 : 11 + 8 + 8.
    expect(computeMaxHitPoints(tougher).total).toBe(27);
  });

  it("grants at least 1 hit point per level", () => {
    const frail = makeTestCharacter({
      classId: "magicien",
      level: 2,
      abilityScores: { ...makeTestCharacter().abilityScores, constitution: 1 },
      hitPointMethod: "rolled",
      hitPointRolls: [1],
    });
    // Con 1 → −5 : niv. 1 : max(1, 6 − 5) = 1 ; niv. 2 : max(1, 1 − 5) = 1.
    expect(computeMaxHitPoints(frail).total).toBe(2);
  });

  it("uses the entered max for a class outside the registry", () => {
    expect(computeMaxHitPoints(makeTestCharacter({ baseMaxHitPoints: 42 }))).toMatchObject({
      total: 42,
      method: "manual",
    });
  });
});
