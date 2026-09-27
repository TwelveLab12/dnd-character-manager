import { describe, expect, it } from "vitest";
import type { Character } from "../character";
import type { InventoryItem } from "../inventory";
import { makeTestCharacter } from "@/test/fixtures";
import { resolveExtraDamageRoll } from "./attack-roll";
import {
  haloOfSpores,
  haloOfSporesDie,
  reconcileSymbioticEntity,
  startSymbioticEntity,
  symbioticEntityUnavailableReason,
} from "./circle-of-spores";
import { applyShortRest } from "./rest";
import { computeWeaponAttack } from "./weapon-attack";

const quarterstaff: InventoryItem = {
  id: "staff",
  name: "Bâton",
  quantity: 1,
  equipped: true,
  weapon: { category: "simple", range: "melee", damageDice: "1d6", damageType: "bludgeoning" },
};
const sling: InventoryItem = {
  id: "sling",
  name: "Fronde",
  quantity: 1,
  equipped: true,
  weapon: { category: "simple", range: "ranged", damageDice: "1d4", damageType: "bludgeoning" },
};

function sporesDruid(overrides: Partial<Character> = {}): Character {
  return makeTestCharacter({
    classId: "druide",
    subclassId: "spores",
    level: 3,
    abilityScores: {
      strength: 10,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 16,
      charisma: 10,
    },
    hitPoints: { current: 20, temporary: 0 },
    inventory: [quarterstaff, sling],
    ...overrides,
  });
}

describe("Cercle des spores", () => {
  it("scales the Halo of Spores die with the druid level", () => {
    expect(haloOfSporesDie(2)).toBe("1d4");
    expect(haloOfSporesDie(6)).toBe("1d6");
    expect(haloOfSporesDie(10)).toBe("1d8");
    expect(haloOfSporesDie(14)).toBe("1d10");
    // DD des sorts : 8 + maîtrise 2 + Sagesse 3.
    expect(haloOfSpores(sporesDruid())).toEqual({ dice: "1d4", saveDC: 13, doubled: false });
    expect(haloOfSpores(sporesDruid({ symbioticEntity: true })).dice).toBe("2d4");
  });

  it("spends a Wild Shape and grants 4 temporary HP per level, keeping the higher value", () => {
    const patch = startSymbioticEntity(sporesDruid());
    expect(patch.symbioticEntity).toBe(true);
    expect(patch.classResourcesUsed?.["wild-shape"]).toBe(1);
    expect(patch.hitPoints).toEqual({ current: 20, temporary: 12 });
    expect(
      startSymbioticEntity(sporesDruid({ hitPoints: { current: 20, temporary: 15 } })).hitPoints,
    ).toEqual({ current: 20, temporary: 15 });
  });

  it("is unavailable without Wild Shape left or outside the circle", () => {
    const spent = sporesDruid({ classResourcesUsed: { "wild-shape": 2 } });
    expect(symbioticEntityUnavailableReason(spent)).toBeDefined();
    expect(startSymbioticEntity(spent)).toEqual({});
    expect(symbioticEntityUnavailableReason(sporesDruid({ subclassId: undefined }))).toBeDefined();
    expect(symbioticEntityUnavailableReason(sporesDruid({ level: 1 }))).toBeDefined();
  });

  it("adds 1d6 necrotic to melee weapon attacks only", () => {
    const character = sporesDruid({ symbioticEntity: true });
    expect(computeWeaponAttack(character, quarterstaff)?.extraDamage).toEqual([
      expect.objectContaining({ dice: "1d6", damageType: "necrotic" }),
    ]);
    expect(computeWeaponAttack(character, sling)?.extraDamage).toBeUndefined();
    expect(computeWeaponAttack(sporesDruid(), quarterstaff)?.extraDamage).toBeUndefined();
  });

  it("doubles the extra dice on a critical hit", () => {
    const extra = computeWeaponAttack(sporesDruid({ symbioticEntity: true }), quarterstaff)
      ?.extraDamage?.[0];
    expect(extra && resolveExtraDamageRoll(extra, 7, true)).toEqual({
      label: "Entité symbiotique",
      dice: "2d6",
      damageType: "necrotic",
      total: 7,
    });
  });

  it("ends when the temporary HP are gone, and on a rest", () => {
    const character = sporesDruid({
      symbioticEntity: true,
      hitPoints: { current: 20, temporary: 12 },
    });
    expect(
      reconcileSymbioticEntity(character, { hitPoints: { current: 20, temporary: 0 } })
        .symbioticEntity,
    ).toBeUndefined();
    expect(
      reconcileSymbioticEntity(character, { hitPoints: { current: 20, temporary: 4 } }),
    ).toEqual({ hitPoints: { current: 20, temporary: 4 } });
    expect("symbioticEntity" in applyShortRest(character)).toBe(true);
  });
});
