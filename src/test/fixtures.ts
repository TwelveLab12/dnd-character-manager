import type { Character } from "@/domain/character";
import type { Spell } from "@/domain/spell";

/** Personnage minimal valide, pour les tests de repository/store — pas les données de Bruno. */
export function makeTestCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: "test-character-1",
    name: "Test Character",
    class: "Cleric",
    level: 1,
    hitPoints: { current: 10, max: 10, temporary: 0 },
    armorClass: 10,
    initiativeBonus: 0,
    speed: 9,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    savingThrowProficiencies: [],
    skillProficiencies: [],
    concentration: { active: false },
    spellSlots: [],
    knownSpellIds: [],
    preparedSpellIds: [],
    inventory: [],
    features: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeTestSpell(overrides: Partial<Spell> = {}): Spell {
  return {
    id: "test-spell-1",
    name: "Test Spell",
    level: 1,
    school: "Evocation",
    castingTime: "1 action",
    range: "60 feet",
    components: { verbal: true, somatic: true, material: false },
    duration: "Instantaneous",
    concentration: false,
    ritual: false,
    description: "A spell used only in tests.",
    classes: ["Cleric"],
    ...overrides,
  };
}
