import { describe, expect, it } from "vitest";
import type { CharacterFeature } from "../feature";
import { adjustFeatureUses } from "./feature-uses";

function makeFeature(overrides: Partial<CharacterFeature> = {}): CharacterFeature {
  return {
    id: "feature-1",
    name: "Channel Divinity",
    source: "Clerc",
    description: "",
    ...overrides,
  };
}

describe("adjustFeatureUses", () => {
  it("decrements usesCurrent", () => {
    const feature = makeFeature({ usesMax: 3, usesCurrent: 2 });
    expect(adjustFeatureUses(feature, -1).usesCurrent).toBe(1);
  });

  it("increments usesCurrent", () => {
    const feature = makeFeature({ usesMax: 3, usesCurrent: 1 });
    expect(adjustFeatureUses(feature, 1).usesCurrent).toBe(2);
  });

  it("clamps at zero", () => {
    const feature = makeFeature({ usesMax: 3, usesCurrent: 0 });
    expect(adjustFeatureUses(feature, -5).usesCurrent).toBe(0);
  });

  it("clamps at usesMax", () => {
    const feature = makeFeature({ usesMax: 3, usesCurrent: 3 });
    expect(adjustFeatureUses(feature, 5).usesCurrent).toBe(3);
  });

  it("defaults usesCurrent to usesMax when undefined before adjusting", () => {
    const feature = makeFeature({ usesMax: 3 });
    expect(adjustFeatureUses(feature, -1).usesCurrent).toBe(2);
  });

  it("is a no-op when usesMax is undefined", () => {
    const feature = makeFeature();
    expect(adjustFeatureUses(feature, -1)).toEqual(feature);
  });
});
