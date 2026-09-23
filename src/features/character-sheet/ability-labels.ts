import type { AbilityName } from "@/domain/ability-scores";

export const ABILITY_LABELS: Record<AbilityName, string> = {
  strength: "Force",
  dexterity: "Dextérité",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Sagesse",
  charisma: "Charisme",
};

/** Abréviations à 3 lettres, pour les affichages compacts (ex : liste des compétences). */
export const ABILITY_SHORT_LABELS: Record<AbilityName, string> = {
  strength: "For",
  dexterity: "Dex",
  constitution: "Con",
  intelligence: "Int",
  wisdom: "Sag",
  charisma: "Cha",
};
