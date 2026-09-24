import type { AbilityScores } from "./ability-scores";
import type { Character } from "./character";
import { generateId } from "./id";

export interface NewCharacterInput {
  name: string;
  class: string;
  level?: number;
}

const DEFAULT_ABILITY_SCORES: AbilityScores = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

/** Personnage vierge avec des valeurs par défaut neutres, prêt à être complété depuis la fiche. */
export function createBlankCharacter(input: NewCharacterInput): Character {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: input.name,
    class: input.class,
    level: input.level ?? 1,
    hitPoints: { current: 1, max: 1, temporary: 0 },
    initiativeBonus: 0,
    speed: 9,
    abilityScores: { ...DEFAULT_ABILITY_SCORES },
    savingThrowProficiencies: [],
    skillProficiencies: [],
    concentration: { active: false },
    spellSlots: [],
    knownSpellIds: [],
    preparedSpellIds: [],
    spellTags: [],
    inventory: [],
    features: [],
    createdAt: now,
    updatedAt: now,
  };
}
