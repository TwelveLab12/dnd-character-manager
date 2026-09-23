import type { AbilityName, AbilityScores } from "./ability-scores";
import type { CharacterFeature } from "./feature";
import type { InventoryItem } from "./inventory";
import type { RaceSelection } from "./race";

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
  /** Choix structuré (race + caractéristiques sélectionnées pour un bonus au choix) utilisé pour
   * calculer les scores effectifs — voir src/domain/calculations/effective-ability-scores.ts.
   * Indépendant du champ `race` ci-dessus (texte libre, purement descriptif) : les deux peuvent
   * diverger sans conséquence, ex. `race: "Humain variant (Illuskien)"` avec
   * `raceSelection.raceId: "humain-variant"`. */
  raceSelection?: RaceSelection;
  background?: string;
  hitPoints: HitPoints;
  armorClass: number;
  initiativeBonus: number;
  speed: number;
  /** Scores DE BASE (avant bonus racial) — voir effectiveAbilityScores pour les valeurs utilisées
   * dans les calculs (modificateurs, jets, compétences, DD/bonus de sort). */
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
