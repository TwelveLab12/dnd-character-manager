import type { AbilityName } from "@/domain/ability-scores";

export interface SkillDefinition {
  name: string;
  ability: AbilityName;
}

/** Les 18 compétences D&D 5e (règles 2014, inchangées en 2024) et leur caractéristique associée. */
export const SKILL_DEFINITIONS: readonly SkillDefinition[] = [
  { name: "Acrobaties", ability: "dexterity" },
  { name: "Arcanes", ability: "intelligence" },
  { name: "Athlétisme", ability: "strength" },
  { name: "Discrétion", ability: "dexterity" },
  { name: "Dressage", ability: "wisdom" },
  { name: "Escamotage", ability: "dexterity" },
  { name: "Histoire", ability: "intelligence" },
  { name: "Intimidation", ability: "charisma" },
  { name: "Investigation", ability: "intelligence" },
  { name: "Médecine", ability: "wisdom" },
  { name: "Nature", ability: "intelligence" },
  { name: "Perception", ability: "wisdom" },
  { name: "Perspicacité", ability: "wisdom" },
  { name: "Persuasion", ability: "charisma" },
  { name: "Religion", ability: "intelligence" },
  { name: "Représentation", ability: "charisma" },
  { name: "Survie", ability: "wisdom" },
  { name: "Tromperie", ability: "charisma" },
];
