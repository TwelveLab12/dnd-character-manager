import type { AbilityName, AbilityScores } from "./ability-scores";
import type { ArmorClassEffect } from "./armor-class-effect";
import type { CharacterFeature } from "./feature";
import type { ArmorCategory, InventoryItem } from "./inventory";
import type { RaceSelection } from "./race";
import type { CharacterSpellTag } from "./spell-tag";

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
  /** Pas de champ de CA stocké : elle est toujours calculée — voir
   * src/domain/calculations/armor-class.ts. Maîtrises d'armure : n'influent pas sur la CA (règles
   * 2014), seulement sur les avertissements affichés. */
  armorProficiencies?: ArmorCategory[];
  /** Don « Maître des armures intermédiaires » : plafond de Dextérité +3 au lieu de +2. */
  mediumArmorMaster?: boolean;
  armorClassEffects?: ArmorClassEffect[];
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
  /** Domaine/toujours-préparé par sort connu — voir src/domain/spell-tag.ts. */
  spellTags: CharacterSpellTag[];
  inventory: InventoryItem[];
  features: CharacterFeature[];
  /** Palette visuelle du personnage — voir src/features/character-theme/theme-registry.ts. */
  themeId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
