import { describe, expect, it } from "vitest";
import { channelDivinityUses } from "@/domain/character-class";
import { makeTestCharacter } from "@/test/fixtures";
import {
  adjustClassResourceUsed,
  computeClassResources,
  restoreClassResources,
} from "./class-resources";

describe("channelDivinityUses (Clerc, règles 2014)", () => {
  it.each([
    [1, 0],
    [2, 1],
    [5, 1],
    [6, 2],
    [17, 2],
    [18, 3],
    [20, 3],
  ])("level %i → %i use(s)", (level, uses) => {
    expect(channelDivinityUses(level)).toBe(uses);
  });
});

describe("computeClassResources", () => {
  it("computes the Channel Divinity pool of a cleric from the level", () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 6,
      classResourcesUsed: { "channel-divinity": 1 },
    });
    expect(computeClassResources(character)).toEqual([
      {
        id: "channel-divinity",
        name: "Canalisation divine",
        recharge: "shortRest",
        max: 2,
        used: 1,
        remaining: 1,
      },
    ]);
  });

  it("omits a resource not yet available at this level", () => {
    expect(computeClassResources(makeTestCharacter({ classId: "clerc", level: 1 }))).toEqual([]);
  });

  it("returns nothing for a class without resources or an unknown class", () => {
    expect(computeClassResources(makeTestCharacter({ classId: "magicien", level: 5 }))).toEqual([]);
    expect(computeClassResources(makeTestCharacter({ classId: undefined }))).toEqual([]);
  });

  it("clamps a stored usage above the computed maximum", () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 3,
      classResourcesUsed: { "channel-divinity": 5 },
    });
    expect(computeClassResources(character)[0]).toMatchObject({ max: 1, used: 1, remaining: 0 });
  });
});

describe("adjustClassResourceUsed", () => {
  const cleric = makeTestCharacter({ classId: "clerc", level: 6 });

  it("spends and recovers within [0, max]", () => {
    expect(adjustClassResourceUsed(cleric, "channel-divinity", 1)).toEqual({
      "channel-divinity": 1,
    });
    expect(adjustClassResourceUsed(cleric, "channel-divinity", 5)).toEqual({
      "channel-divinity": 2,
    });
    expect(adjustClassResourceUsed(cleric, "channel-divinity", -1)).toEqual({
      "channel-divinity": 0,
    });
  });

  it("ignores a resource the class does not have", () => {
    const wizard = makeTestCharacter({ classId: "magicien", level: 6 });
    expect(adjustClassResourceUsed(wizard, "channel-divinity", 1)).toEqual({});
  });
});

describe("restoreClassResources", () => {
  const spent = makeTestCharacter({
    classId: "clerc",
    level: 6,
    classResourcesUsed: { "channel-divinity": 2 },
  });

  it("restores a short-rest resource on a short rest", () => {
    expect(restoreClassResources(spent, "shortRest")).toEqual({});
  });

  it("restores every resource on a long rest", () => {
    expect(restoreClassResources(spent, "longRest")).toEqual({});
  });
});
