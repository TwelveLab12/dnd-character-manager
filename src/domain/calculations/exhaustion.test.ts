import { describe, expect, it } from "vitest";
import type { Character } from "../character";
import { makeTestCharacter } from "@/test/fixtures";
import { describeChanges } from "./activity-changes";
import { computeSpeed } from "./combat-stats";
import { dyingStatus } from "./death-saves";
import { activeExhaustionEffects, exhaustionLevel } from "./exhaustion";
import { setExhaustion } from "./exhaustion-change";
import { computeMaxHitPoints } from "./max-hit-points";
import { applyLongRest } from "./rest";

// Classe hors registre : PV max saisis 20, vitesse de base 9 m.
const hero = makeTestCharacter({
  baseMaxHitPoints: 20,
  baseSpeed: 9,
  hitPoints: { current: 18, temporary: 0 },
});

function at(level: number, overrides: Partial<Character> = {}): Character {
  return { ...hero, exhaustion: level, ...overrides };
}

describe("exhaustion levels", () => {
  it("clamps the stored level and lists cumulative effects", () => {
    expect(exhaustionLevel({ exhaustion: 9 })).toBe(6);
    expect(exhaustionLevel({})).toBe(0);
    expect(activeExhaustionEffects(2)).toEqual([
      "Désavantage aux tests de caractéristique (compétences comprises)",
      "Vitesse divisée par 2",
    ]);
  });

  it("halves the speed at 2 and stops it at 5", () => {
    expect(computeSpeed(at(1)).total).toBe(9);
    expect(computeSpeed(at(2)).total).toBe(4.5);
    expect(computeSpeed(at(2)).breakdown.at(-1)?.label).toBe("Épuisement 2 (vitesse / 2)");
    expect(computeSpeed(at(5)).total).toBe(0);
  });

  it("halves max HP from level 4", () => {
    expect(computeMaxHitPoints(at(3)).total).toBe(20);
    expect(computeMaxHitPoints(at(4))).toMatchObject({
      total: 10,
      baseTotal: 20,
      exhaustionHalved: true,
    });
  });

  it("kills at level 6, whatever the hit points", () => {
    expect(dyingStatus(at(5))).toBe("alive");
    expect(dyingStatus(at(6))).toBe("dead");
  });
});

describe("setExhaustion", () => {
  it("brings current HP down to the halved maximum, never back up", () => {
    expect(setExhaustion(at(3), 4)).toEqual({
      exhaustion: 4,
      hitPoints: { current: 10, temporary: 0 },
    });
    expect(setExhaustion(at(4, { hitPoints: { current: 10, temporary: 0 } }), 3)).toEqual({
      exhaustion: 3,
    });
    expect(setExhaustion(at(1), 0)).toEqual({ exhaustion: undefined });
    expect(setExhaustion(at(6), 9)).toEqual({
      exhaustion: 6,
      hitPoints: { current: 10, temporary: 0 },
    });
  });
});

describe("long rest", () => {
  it("removes one level when the character ate and drank, restoring HP to the new maximum", () => {
    expect(applyLongRest(at(4, { hitPoints: { current: 3, temporary: 0 } }))).toMatchObject({
      exhaustion: 3,
      hitPoints: { current: 20 },
    });
    expect(applyLongRest(at(1)).exhaustion).toBeUndefined();
    expect("exhaustion" in applyLongRest(hero)).toBe(false);
  });

  it("keeps the level without food or water", () => {
    expect(applyLongRest(at(4), { ateAndDrank: false })).toMatchObject({
      exhaustion: 4,
      hitPoints: { current: 10 },
    });
  });
});

describe("history", () => {
  it("records exhaustion changes", () => {
    expect(describeChanges(at(1), at(2))).toContainEqual({
      key: "exhaustion",
      label: "Épuisement",
      from: 1,
      to: 2,
      category: "status",
    });
  });
});
