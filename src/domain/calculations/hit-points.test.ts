import { describe, expect, it } from "vitest";
import type { HitPoints } from "../character";
import {
  applyDamage,
  applyHealing,
  setCurrentHitPoints,
  setTemporaryHitPoints,
} from "./hit-points";

describe("applyDamage", () => {
  it("absorbs damage from temporary hit points first", () => {
    const hp: HitPoints = { current: 10, temporary: 5 };
    expect(applyDamage(hp, 3)).toEqual({ current: 10, temporary: 2 });
  });

  it("spills remaining damage onto current hit points once temporary is exhausted", () => {
    const hp: HitPoints = { current: 10, temporary: 5 };
    expect(applyDamage(hp, 8)).toEqual({ current: 7, temporary: 0 });
  });

  it("floors current hit points at zero", () => {
    const hp: HitPoints = { current: 4, temporary: 0 };
    expect(applyDamage(hp, 100)).toEqual({ current: 0, temporary: 0 });
  });

  it("ignores negative amounts", () => {
    const hp: HitPoints = { current: 10, temporary: 0 };
    expect(applyDamage(hp, -5)).toEqual(hp);
  });
});

describe("applyHealing", () => {
  it("adds healing to current hit points", () => {
    const hp: HitPoints = { current: 5, temporary: 0 };
    expect(applyHealing(hp, 3, 10)).toEqual({ current: 8, temporary: 0 });
  });

  it("caps current hit points at the computed max", () => {
    const hp: HitPoints = { current: 8, temporary: 0 };
    expect(applyHealing(hp, 100, 10)).toEqual({ current: 10, temporary: 0 });
  });

  it("does not affect temporary hit points", () => {
    const hp: HitPoints = { current: 5, temporary: 4 };
    expect(applyHealing(hp, 2, 10)).toEqual({ current: 7, temporary: 4 });
  });

  it("ignores negative amounts", () => {
    const hp: HitPoints = { current: 5, temporary: 0 };
    expect(applyHealing(hp, -5, 10)).toEqual(hp);
  });
});

describe("setTemporaryHitPoints", () => {
  it("sets the value directly, including lowering it", () => {
    const hp: HitPoints = { current: 10, temporary: 5 };
    expect(setTemporaryHitPoints(hp, 3)).toEqual({ current: 10, temporary: 3 });
    expect(setTemporaryHitPoints(hp, 8)).toEqual({ current: 10, temporary: 8 });
  });

  it("floors negative amounts at zero", () => {
    const hp: HitPoints = { current: 10, temporary: 5 };
    expect(setTemporaryHitPoints(hp, -1)).toEqual({ current: 10, temporary: 0 });
  });
});

describe("setCurrentHitPoints", () => {
  it("sets the value directly, including lowering it", () => {
    const hp: HitPoints = { current: 10, temporary: 0 };
    expect(setCurrentHitPoints(hp, 4, 10)).toEqual({ current: 4, temporary: 0 });
  });

  it("clamps at max", () => {
    const hp: HitPoints = { current: 4, temporary: 0 };
    expect(setCurrentHitPoints(hp, 100, 10)).toEqual({ current: 10, temporary: 0 });
  });

  it("clamps at zero", () => {
    const hp: HitPoints = { current: 4, temporary: 0 };
    expect(setCurrentHitPoints(hp, -5, 10)).toEqual({ current: 0, temporary: 0 });
  });

  it("does not affect temporary hit points", () => {
    const hp: HitPoints = { current: 4, temporary: 3 };
    expect(setCurrentHitPoints(hp, 8, 10)).toEqual({ current: 8, temporary: 3 });
  });
});
