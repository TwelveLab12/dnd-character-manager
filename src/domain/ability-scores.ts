export type AbilityName =
  "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";

export const ABILITY_NAMES: readonly AbilityName[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export type AbilityScores = Record<AbilityName, number>;
