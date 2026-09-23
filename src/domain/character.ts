import type { AbilityName, AbilityScores } from "./ability-scores";
import type { CharacterFeature } from "./feature";
import type { InventoryItem } from "./inventory";

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

export interface SpellSlotLevel {
  level: number;
  total: number;
  used: number;
}

export interface SpellcastingInfo {
  ability: AbilityName;
  /** La feuille source fige parfois une valeur qui diverge du calcul théorique. */
  spellSaveDCOverride?: number;
  spellAttackBonusOverride?: number;
}

export interface Concentration {
  active: boolean;
  spellId?: string;
}

export interface Character {
  id: string;
  name: string;
  class: string;
  subclass?: string;
  level: number;
  race?: string;
  background?: string;
  hitPoints: HitPoints;
  armorClass: number;
  initiativeBonus: number;
  speed: number;
  abilityScores: AbilityScores;
  savingThrowProficiencies: AbilityName[];
  skillProficiencies: string[];
  concentration: Concentration;
  meleeAttackBonus?: number;
  rangedAttackBonus?: number;
  spellcasting?: SpellcastingInfo;
  spellSlots: SpellSlotLevel[];
  knownSpellIds: string[];
  preparedSpellIds: string[];
  inventory: InventoryItem[];
  features: CharacterFeature[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
