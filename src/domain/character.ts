import type { AbilityName, AbilityScores } from "./ability-scores";
import type { ArmorClassEffect } from "./armor-class-effect";
import type { ClassResourceId } from "./character-class";
import type { CharacterFeature } from "./feature";
import type { ArmorCategory, InventoryItem, WeaponCategory } from "./inventory";
import type { RaceSelection } from "./race";
import type { CharacterSpellTag } from "./spell-tag";

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

/** Emplacements d'un niveau de sort, tels que CALCULÉS (voir computeSpellSlots) : le total découle
 * de la classe et du niveau, seul `used` provient de l'état stocké (`Character.spellSlotsUsed`). */
export interface SpellSlotLevel {
  level: number;
  total: number;
  used: number;
}

/** Emplacements utilisés par niveau de sort (clé = niveau 1-9, en texte comme en JSON). Les totaux ne sont jamais
 * stockés : ils sont calculés depuis la classe et le niveau — voir docs/adr/0022. */
export type SpellSlotsUsed = Partial<Record<string, number>>;

/** Utilisations dépensées par ressource de classe (ex : `{ "channel-divinity": 1 }`). */
export type ClassResourcesUsed = Partial<Record<ClassResourceId, number>>;

export interface SpellcastingInfo {
  /** Caractéristique d'incantation, seulement pour une classe absente du registre
   * (src/domain/character-class.ts) : pour une classe connue, elle est déduite de la classe. */
  ability?: AbilityName;
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
  /** Libellé libre affiché (« Clerc », « Cleric »…). */
  class: string;
  /** Classe connue des règles (src/domain/character-class.ts) : c'est elle qui détermine les
   * valeurs calculées (emplacements, ressources de classe, caractéristique d'incantation).
   * Indépendante du libellé `class`, comme `raceSelection` l'est de `race`. */
  classId?: string;
  subclass?: string;
  /** Sous-classe connue des règles (ex : Domaine du Crépuscule), au sein de `classId` : elle
   * détermine sorts toujours préparés, maîtrises et options de ressources — voir
   * src/domain/subclass.ts. Indépendante du libellé libre `subclass`. */
  subclassId?: string;
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
  /** Maîtrises d'armes par catégorie : le bonus de maîtrise ne s'ajoute au jet d'attaque que pour
   * une arme maîtrisée. Pas de bonus d'attaque stocké : il est calculé par arme équipée — voir
   * src/domain/calculations/weapon-attack.ts. */
  weaponProficiencies?: WeaponCategory[];
  /** Arts martiaux (Moine, règles 2014) — voir src/domain/calculations/weapon-attack.ts. */
  martialArts?: boolean;
  /** Don Ambidextre : toute arme de corps à corps à une main peut aller en main secondaire. */
  dualWielder?: boolean;
  /** Style de combat « Combat à deux armes » : mod de caractéristique aux dégâts en main
   * secondaire. */
  twoWeaponFightingStyle?: boolean;
  spellcasting?: SpellcastingInfo;
  spellSlotsUsed: SpellSlotsUsed;
  classResourcesUsed: ClassResourcesUsed;
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
