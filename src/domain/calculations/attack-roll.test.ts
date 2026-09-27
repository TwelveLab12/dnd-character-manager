import { describe, expect, it } from "vitest";
import type { InventoryItem, WeaponProperties } from "../inventory";
import { makeTestCharacter } from "@/test/fixtures";
import {
  criticalDice,
  diceRange,
  resolveAttackRoll,
  resolveDamageRoll,
  rollDice,
} from "./attack-roll";
import type { WeaponAttack } from "./weapon-attack";
import { computeWeaponAttack } from "./weapon-attack";

function weapon(properties: Partial<WeaponProperties>, item: Partial<InventoryItem> = {}) {
  return {
    id: "w",
    name: "Arme",
    quantity: 1,
    equipped: true,
    weapon: {
      category: "martial",
      range: "melee",
      damageDice: "1d8",
      damageType: "bludgeoning",
      ...properties,
    },
    ...item,
  } satisfies InventoryItem;
}

// Force 16 (+3), Dextérité 14 (+2), niveau 1 : maîtrise +2.
const fighter = makeTestCharacter({
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  weaponProficiencies: ["simple", "martial"],
});

function attackOf(item: InventoryItem, character = fighter): WeaponAttack {
  return computeWeaponAttack(character, item)!;
}

function sum(attack: WeaponAttack, kind: "attackTerms" | "damageTerms") {
  return attack[kind].reduce((total, term) => total + term.value, 0);
}

describe("attack breakdown", () => {
  it("explains ability, proficiency and magic, adding up to the displayed bonus", () => {
    const hammer = attackOf(weapon({ magicBonus: 1 }));
    expect(hammer.attackTerms.map((term) => [term.label, term.value])).toEqual([
      ["Force", 3],
      ["Maîtrise", 2],
      ["Arme magique", 1],
    ]);
    expect(sum(hammer, "attackTerms")).toBe(hammer.attackBonus);
    expect(hammer.damage).toBe(`1d8+${sum(hammer, "damageTerms")}`);
    expect(hammer.attackTerms[1]?.reason).toMatch(/armes de guerre/);
  });

  it("uses Dexterity for finesse and ranged weapons, and says why", () => {
    const rapier = attackOf(weapon({ finesse: true }), {
      ...fighter,
      abilityScores: { ...fighter.abilityScores, dexterity: 18 },
    });
    expect(rapier.attackTerms[0]).toMatchObject({ label: "Dextérité", value: 4 });
    expect(rapier.attackTerms[0]?.reason).toMatch(/Finesse/);
    const bow = attackOf(weapon({ range: "ranged" }));
    expect(bow.attackTerms[0]?.reason).toMatch(/distance/);
  });

  it("reminds that proficiency only applies to the attack roll", () => {
    expect(attackOf(weapon({})).damageNotes[0]).toBe(
      "Le bonus de maîtrise (+2) ne s'ajoute qu'au jet d'attaque, pas aux dégâts.",
    );
    const untrained = attackOf(weapon({}), { ...fighter, weaponProficiencies: ["simple"] });
    expect(untrained.damageNotes).toEqual([]);
  });

  it("notes a missing proficiency", () => {
    const untrained = attackOf(weapon({}), { ...fighter, weaponProficiencies: ["simple"] });
    expect(untrained.attackTerms.map((term) => term.label)).toEqual(["Force"]);
    expect(untrained.attackNotes[0]).toMatch(/non maîtrisée/);
  });

  it("drops the off-hand modifier and explains the two-handed die", () => {
    const offHand = attackOf(weapon({ light: true, damageDice: "1d6" }, { hand: "off" }));
    expect(offHand.damageTerms).toEqual([]);
    expect(offHand.damageNotes[1]).toMatch(/Main secondaire/);

    const longsword = attackOf(weapon({ versatileDamageDice: "1d10" }, { hand: "both" }));
    expect(longsword.damageDice).toBe("1d10");
    expect(longsword.damageNotes[1]).toMatch(/deux mains/);
  });

  it("adds the rage bonus to Strength melee damage", () => {
    const raging = { ...fighter, classId: "barbare", raging: true };
    const axe = attackOf(weapon({}), raging);
    expect(axe.damageTerms.map((term) => [term.label, term.value])).toEqual([
      ["Force", 3],
      ["Rage", 2],
    ]);
  });
});

describe("resolveAttackRoll", () => {
  const hammer = attackOf(weapon({}));

  it("adds the bonuses to the kept die and compares with the target AC", () => {
    expect(resolveAttackRoll(hammer, [12], "normal", 17)).toMatchObject({
      kept: 12,
      total: 17,
      hit: true,
      critical: false,
    });
    expect(resolveAttackRoll(hammer, [11], "normal", 17).hit).toBe(false);
    expect(resolveAttackRoll(hammer, [11], "normal").hit).toBeUndefined();
  });

  it("keeps the highest with advantage, the lowest with disadvantage", () => {
    expect(resolveAttackRoll(hammer, [4, 15], "advantage").kept).toBe(15);
    expect(resolveAttackRoll(hammer, [4, 15], "disadvantage").kept).toBe(4);
  });

  it("a natural 20 always hits and is critical, a natural 1 always misses", () => {
    expect(resolveAttackRoll(hammer, [20], "normal", 30)).toMatchObject({
      hit: true,
      critical: true,
    });
    expect(resolveAttackRoll(hammer, [1], "normal", 2)).toMatchObject({
      hit: false,
      fumble: true,
    });
  });
});

describe("damage", () => {
  const hammer = attackOf(weapon({}));

  it("doubles the dice on a critical hit, not the bonuses", () => {
    expect(criticalDice("1d8")).toBe("2d8");
    expect(diceRange("2d8")).toEqual({ min: 2, max: 16 });
    expect(resolveDamageRoll(hammer, 11, true)).toMatchObject({ dice: "2d8", total: 14 });
    expect(resolveDamageRoll(hammer, 5, false)).toMatchObject({ dice: "1d8", total: 8 });
  });

  it("never deals negative damage", () => {
    const weak = attackOf(weapon({}), {
      ...fighter,
      abilityScores: { ...fighter.abilityScores, strength: 6 },
    });
    expect(resolveDamageRoll(weak, 1, false).total).toBe(0);
  });

  it("rolls one result per die", () => {
    expect(rollDice("3d6", () => 0.5)).toEqual([4, 4, 4]);
  });
});
