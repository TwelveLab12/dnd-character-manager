import { describe, expect, it } from "vitest";
import type { RaceDefinition } from "../race";
import { applyRaceBonuses, effectiveAbilityScores } from "./effective-ability-scores";

const BASE = {
  strength: 13,
  dexterity: 8,
  constitution: 14,
  intelligence: 12,
  wisdom: 15,
  charisma: 10,
};

describe("effectiveAbilityScores", () => {
  it("returns the base scores unchanged when no race is selected", () => {
    expect(effectiveAbilityScores(BASE, undefined)).toEqual(BASE);
  });

  it("returns the base scores unchanged for an unknown raceId", () => {
    expect(effectiveAbilityScores(BASE, { raceId: "inconnue", abilityBonusChoices: [] })).toEqual(
      BASE,
    );
  });

  it("applies a fixed-bonus race to every relevant ability (Humain)", () => {
    const result = effectiveAbilityScores(BASE, { raceId: "humain", abilityBonusChoices: [] });
    expect(result).toEqual({
      strength: 14,
      dexterity: 9,
      constitution: 15,
      intelligence: 13,
      wisdom: 16,
      charisma: 11,
    });
  });

  it("applies a choice-bonus race only to the chosen abilities (Humain variant)", () => {
    const result = effectiveAbilityScores(BASE, {
      raceId: "humain-variant",
      abilityBonusChoices: ["wisdom", "constitution"],
    });
    expect(result).toEqual({ ...BASE, wisdom: 16, constitution: 15 });
  });

  it("never mutates the base scores object", () => {
    const base = { ...BASE };
    effectiveAbilityScores(base, {
      raceId: "humain-variant",
      abilityBonusChoices: ["wisdom", "constitution"],
    });
    expect(base).toEqual(BASE);
  });
});

describe("applyRaceBonuses", () => {
  it("excludes abilities already covered by a fixed rule from a later choice rule (ex : Demi-Elfe)", () => {
    const halfElf: RaceDefinition = {
      id: "test-demi-elfe",
      name: "Demi-Elfe (test)",
      speed: 9,
      abilityBonusRules: [
        { type: "fixed", ability: "charisma", amount: 2 },
        { type: "choice", amount: 1, count: 2, exclude: ["charisma"] },
      ],
    };

    // Le joueur tente (à tort) de re-choisir Charisme en plus de Force -> Charisme est ignoré
    // pour la règle "choice" (déjà couvert par la règle fixe), seul Force reçoit le bonus.
    const result = applyRaceBonuses(BASE, halfElf, ["charisma", "strength"]);

    expect(result).toEqual({ ...BASE, charisma: 12, strength: 14 });
  });
});
