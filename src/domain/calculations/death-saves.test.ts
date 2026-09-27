import { describe, expect, it } from "vitest";
import type { Character } from "../character";
import { makeTestCharacter } from "@/test/fixtures";
import {
  damageCharacter,
  dyingStatus,
  reconcileDeathSaves,
  rollDeathSave,
  setDeathSaves,
  stabilize,
} from "./death-saves";
import { applyLongRest } from "./rest";

// Classe hors registre : PV max saisis = 10.
const dying = makeTestCharacter({ hitPoints: { current: 0, temporary: 0 } });

function after(character: Character, patch: Partial<Character>): Character {
  return { ...character, ...patch };
}

describe("dyingStatus", () => {
  it("follows HP, failures and the stable flag", () => {
    expect(dyingStatus(makeTestCharacter())).toBe("alive");
    expect(dyingStatus(dying)).toBe("dying");
    expect(dyingStatus({ ...dying, stable: true })).toBe("stable");
    expect(dyingStatus({ ...dying, deathSaves: { successes: 1, failures: 3 } })).toBe("dead");
  });
});

describe("rollDeathSave", () => {
  it("counts 10+ as a success and less as a failure", () => {
    expect(rollDeathSave(dying, 10).deathSaves).toEqual({ successes: 1, failures: 0 });
    expect(rollDeathSave(dying, 9).deathSaves).toEqual({ successes: 0, failures: 1 });
  });

  it("a natural 1 counts as two failures, a natural 20 gives back 1 HP", () => {
    expect(rollDeathSave(dying, 1).deathSaves).toEqual({ successes: 0, failures: 2 });
    const revived = after(
      { ...dying, deathSaves: { successes: 1, failures: 2 } },
      rollDeathSave(dying, 20),
    );
    expect(revived.hitPoints.current).toBe(1);
    expect(revived.deathSaves).toBeUndefined();
    expect(dyingStatus(revived)).toBe("alive");
  });

  it("stabilizes on the third success, dies on the third failure", () => {
    const twoSuccesses = { ...dying, deathSaves: { successes: 2, failures: 2 } };
    expect(dyingStatus(after(twoSuccesses, rollDeathSave(twoSuccesses, 15)))).toBe("stable");
    expect(dyingStatus(after(twoSuccesses, rollDeathSave(twoSuccesses, 5)))).toBe("dead");
  });

  it("ignores rolls when not dying or out of range", () => {
    expect(rollDeathSave(makeTestCharacter(), 12)).toEqual({});
    expect(rollDeathSave({ ...dying, stable: true }, 12)).toEqual({});
    expect(rollDeathSave(dying, 21)).toEqual({});
  });
});

describe("setDeathSaves and stabilize", () => {
  it("three checked successes stabilize", () => {
    expect(setDeathSaves({ successes: 3, failures: 1 })).toEqual({
      deathSaves: undefined,
      stable: true,
    });
    expect(setDeathSaves({ successes: 1, failures: 5 })).toEqual({
      deathSaves: { successes: 1, failures: 3 },
      stable: undefined,
    });
  });

  it("stabilizes a dying character only", () => {
    expect(dyingStatus(after(dying, stabilize(dying)))).toBe("stable");
    expect(stabilize(makeTestCharacter())).toEqual({});
  });
});

describe("damageCharacter", () => {
  it("starts fresh death saves when dropping to 0 HP", () => {
    const hurt = makeTestCharacter({
      hitPoints: { current: 3, temporary: 0 },
      deathSaves: { successes: 2, failures: 2 },
    });
    const patch = damageCharacter(hurt, 5);
    expect(patch.hitPoints?.current).toBe(0);
    expect(patch.deathSaves).toBeUndefined();
    expect(dyingStatus(after(hurt, patch))).toBe("dying");
  });

  it("adds a failure at 0 HP, two on a critical hit, and ends stability", () => {
    expect(damageCharacter(dying, 1).deathSaves).toEqual({ successes: 0, failures: 1 });
    expect(damageCharacter(dying, 1, { critical: true }).deathSaves).toEqual({
      successes: 0,
      failures: 2,
    });
    const stable = { ...dying, stable: true };
    const patch = damageCharacter(stable, 1);
    expect(dyingStatus(after(stable, patch))).toBe("dying");
    expect(patch.deathSaves).toEqual({ successes: 0, failures: 1 });
  });

  it("temporary HP absorb the hit, massive damage kills", () => {
    const shielded = { ...dying, hitPoints: { current: 0, temporary: 5 } };
    expect(damageCharacter(shielded, 3).deathSaves).toBeUndefined();
    expect(dyingStatus(after(dying, damageCharacter(dying, 10)))).toBe("dead");
  });
});

describe("reconcileDeathSaves", () => {
  const struggling = { ...dying, deathSaves: { successes: 1, failures: 2 }, stable: false };

  it("clears the death saves when HP go back above 0", () => {
    expect(
      reconcileDeathSaves(struggling, { hitPoints: { current: 4, temporary: 0 } }),
    ).toMatchObject({ deathSaves: undefined, stable: undefined });
  });

  it("leaves other patches alone", () => {
    const patch = { hitPoints: { current: 0, temporary: 3 } };
    expect(reconcileDeathSaves(struggling, patch)).toBe(patch);
    const notes = { notes: "x" };
    expect(reconcileDeathSaves(struggling, notes)).toBe(notes);
  });

  it("a long rest clears everything", () => {
    expect(applyLongRest(struggling)).toMatchObject({ deathSaves: undefined, stable: undefined });
  });
});
