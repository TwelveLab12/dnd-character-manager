import { describe, expect, it } from "vitest";
import type { InventoryItem } from "../inventory";
import { makeTestCharacter } from "@/test/fixtures";
import { computeArmorClass, dexterityContribution } from "./armor-class";

const ALL_PROFICIENCIES = ["light", "medium", "heavy", "shield"] as const;

function withDexterity(dexterity: number, strength = 10) {
  return {
    strength,
    dexterity,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };
}

const chainMail: InventoryItem = {
  id: "chain-mail",
  name: "Cotte de mailles",
  quantity: 1,
  equipped: true,
  armor: { category: "heavy", baseArmorClass: 16, strengthRequirement: 13 },
};
const breastplate: InventoryItem = {
  id: "breastplate",
  name: "Cuirasse",
  quantity: 1,
  equipped: true,
  armor: { category: "medium", baseArmorClass: 14 },
};
const leather: InventoryItem = {
  id: "leather",
  name: "Armure de cuir",
  quantity: 1,
  equipped: true,
  armor: { category: "light", baseArmorClass: 11 },
};
const shield: InventoryItem = {
  id: "shield",
  name: "Bouclier",
  quantity: 1,
  equipped: true,
  armor: { category: "shield", baseArmorClass: 2 },
};

describe("dexterityContribution", () => {
  it("adds full Dex unarmored and in light armor", () => {
    expect(dexterityContribution(undefined, 4)).toBe(4);
    expect(dexterityContribution("light", 4)).toBe(4);
  });

  it("caps Dex at +2 in medium armor, +3 with Medium Armor Master", () => {
    expect(dexterityContribution("medium", 3)).toBe(2);
    expect(dexterityContribution("medium", 3, true)).toBe(3);
    expect(dexterityContribution("medium", -1)).toBe(-1);
  });

  it("ignores Dex in heavy armor", () => {
    expect(dexterityContribution("heavy", 4)).toBe(0);
    expect(dexterityContribution("heavy", -2)).toBe(0);
  });
});

describe("computeArmorClass", () => {
  it("is 10 + Dex unarmored", () => {
    const character = makeTestCharacter({ abilityScores: withDexterity(14) });
    expect(computeArmorClass(character).total).toBe(12);
  });

  it("uses the racial Dex bonus", () => {
    const character = makeTestCharacter({
      abilityScores: withDexterity(13),
      raceSelection: { raceId: "humain-variant", abilityBonusChoices: ["dexterity", "wisdom"] },
    });
    expect(computeArmorClass(character).total).toBe(12);
  });

  it("chain mail + shield = 18 regardless of Dex", () => {
    for (const dexterity of [8, 14, 20]) {
      const character = makeTestCharacter({
        abilityScores: withDexterity(dexterity, 13),
        inventory: [chainMail, shield],
        armorProficiencies: [...ALL_PROFICIENCIES],
      });
      expect(computeArmorClass(character).total).toBe(18);
    }
  });

  it("breastplate + Dex 14 + shield = 18", () => {
    const character = makeTestCharacter({
      abilityScores: withDexterity(14),
      inventory: [breastplate, shield],
      armorProficiencies: [...ALL_PROFICIENCIES],
    });
    const result = computeArmorClass(character);
    expect(result.total).toBe(18);
    expect(result.breakdown).toEqual([
      { label: "Cuirasse", value: 14 },
      { label: "Dex", value: 2 },
      { label: "Bouclier", value: 2 },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("caps Dex in medium armor unless Medium Armor Master", () => {
    const base = makeTestCharacter({
      abilityScores: withDexterity(16),
      inventory: [breastplate],
      armorProficiencies: ["medium"],
    });
    expect(computeArmorClass(base).total).toBe(16);
    expect(computeArmorClass({ ...base, mediumArmorMaster: true }).total).toBe(17);
  });

  it("applies a negative Dex modifier in light armor", () => {
    const character = makeTestCharacter({
      abilityScores: withDexterity(8),
      inventory: [leather],
      armorProficiencies: ["light"],
    });
    expect(computeArmorClass(character).total).toBe(10);
  });

  it("ignores unequipped armor and items without armor properties", () => {
    const character = makeTestCharacter({
      inventory: [
        { ...chainMail, equipped: false },
        { id: "rope", name: "Corde", quantity: 1 },
      ],
    });
    expect(computeArmorClass(character).total).toBe(10);
  });

  it("adds magic bonuses of equipped items only", () => {
    const character = makeTestCharacter({
      inventory: [
        { ...breastplate, armorClassBonus: 1 },
        {
          id: "ring",
          name: "Anneau de protection",
          quantity: 1,
          equipped: true,
          armorClassBonus: 1,
        },
        { id: "cloak", name: "Cape", quantity: 1, equipped: false, armorClassBonus: 1 },
      ],
      armorProficiencies: ["medium"],
    });
    expect(computeArmorClass(character).total).toBe(16);
  });

  it("keeps only the best armor and shield when several are equipped", () => {
    const character = makeTestCharacter({
      inventory: [leather, chainMail, shield, { ...shield, id: "shield-2", armorClassBonus: 1 }],
      armorProficiencies: [...ALL_PROFICIENCIES],
      abilityScores: withDexterity(10, 13),
    });
    const result = computeArmorClass(character);
    expect(result.total).toBe(18);
    expect(result.warnings).toHaveLength(2);
  });

  it("applies manual effects only when active", () => {
    const character = makeTestCharacter({
      armorClassEffects: [
        { id: "a", name: "Bouclier", bonus: 5, trigger: { type: "manual", active: true } },
        { id: "b", name: "Autre", bonus: 1, trigger: { type: "manual", active: false } },
      ],
    });
    expect(computeArmorClass(character).total).toBe(15);
  });

  it("applies concentration effects only while concentrating on that spell", () => {
    const effect = {
      id: "sof",
      name: "Bouclier de la foi",
      bonus: 2,
      trigger: { type: "concentration" as const, spellId: "shield-of-faith" },
    };
    const character = makeTestCharacter({ armorClassEffects: [effect] });

    expect(computeArmorClass(character).total).toBe(10);
    expect(
      computeArmorClass({
        ...character,
        concentration: { active: true, spellId: "shield-of-faith" },
      }).total,
    ).toBe(12);
    expect(
      computeArmorClass({ ...character, concentration: { active: true, spellId: "bless" } }).total,
    ).toBe(10);
    expect(
      computeArmorClass({
        ...character,
        concentration: { active: false, spellId: "shield-of-faith" },
      }).total,
    ).toBe(10);
  });

  it("warns about non-proficient armor without changing AC", () => {
    const character = makeTestCharacter({
      abilityScores: withDexterity(10, 13),
      inventory: [chainMail, shield],
      armorProficiencies: ["light", "medium"],
    });
    const result = computeArmorClass(character);
    expect(result.total).toBe(18);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/non maîtrisée/);
  });

  it("warns when Strength is below heavy armor requirement", () => {
    const character = makeTestCharacter({
      abilityScores: withDexterity(10, 12),
      inventory: [chainMail],
      armorProficiencies: ["heavy"],
    });
    const result = computeArmorClass(character);
    expect(result.total).toBe(16);
    expect(result.warnings).toEqual([expect.stringMatching(/Force 12 < 13/)]);
  });
});
