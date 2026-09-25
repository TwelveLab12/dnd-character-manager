import type { AbilityName } from "./ability-scores";
import type { FeatureRecharge } from "./feature";
import type {
  ClassResourceOptionDefinition,
  ProficiencyGrants,
  SubclassDefinition,
} from "./subclass";
import { CIRCLE_OF_SPORES, OPEN_HAND, TWILIGHT_DOMAIN } from "./subclass";

/** Progression d'emplacements de sorts. Seuls les lanceurs complets sont modélisés pour l'instant
 * (demi-lanceurs, tiers de lanceurs et magie de pacte viendront avec leurs classes). */
export type CasterProgression = "full";

/**
 * Mode d'accès aux sorts (5e 2014) : « prepared » = le lanceur prépare chaque jour une partie de ses
 * sorts (Clerc, Druide, Magicien : mod. de caractéristique + niveau, minimum 1) ; « known » = tous
 * ses sorts connus sont utilisables (Barde, Ensorceleur).
 */
export type SpellPreparation = "prepared" | "known";

export const CLASS_RESOURCE_IDS = ["channel-divinity", "wild-shape", "ki"] as const;

export type ClassResourceId = (typeof CLASS_RESOURCE_IDS)[number];

/**
 * Ressource de classe partagée par plusieurs capacités (ex : Canalisation divine, consommée par
 * Renvoi des morts-vivants comme par les options de domaine). Le maximum n'est jamais stocké : il
 * est calculé à partir du niveau (voir src/domain/calculations/class-resources.ts).
 */
export interface ClassResourceDefinition {
  id: ClassResourceId;
  name: string;
  recharge: Exclude<FeatureRecharge, "other">;
  usesAtLevel: (level: number) => number;
}

export interface CharacterClassDefinition {
  id: string;
  name: string;
  /** Libellés reconnus dans le champ texte `Character.class` pour la migration des anciennes
   * données (comparaison insensible à la casse et aux accents). */
  aliases: readonly string[];
  spellcasting?: {
    progression: CasterProgression;
    ability: AbilityName;
    preparation: SpellPreparation;
  };
  /** Dé de vie (nombre de faces) : base des PV max — voir src/domain/calculations/max-hit-points.ts. */
  hitDie: number;
  /** Jets de sauvegarde maîtrisés grâce à la classe (niveau 1). */
  savingThrows: readonly AbilityName[];
  resources: readonly ClassResourceDefinition[];
  /** Maîtrises accordées par la classe (renseignées seulement quand elles s'expriment en
   * catégories d'armures et d'armes ; sinon, celles cochées sur la fiche font foi). */
  proficiencies?: ProficiencyGrants;
  /** Options de ressources de classe communes à toute la classe (ex : Renvoi des morts-vivants). */
  resourceOptions?: readonly ClassResourceOptionDefinition[];
  /** Nom générique des sous-classes (ex : « Domaine divin ») et sous-classes connues. */
  subclassLabel?: string;
  subclasses?: readonly SubclassDefinition[];
  /** Arts martiaux accordés par la classe (Moine) : désactivables par personnage
   * (`Character.martialArts === false`). */
  martialArts?: boolean;
  /** Défense sans armure : sans armure (et sans bouclier si `allowsShield` est faux), CA = 10 +
   * Dex + modificateur de cette caractéristique. */
  unarmoredDefense?: { ability: AbilityName; allowsShield: boolean };
  /** Déplacement sans armure : bonus de vitesse en mètres selon le niveau, sans armure ni
   * bouclier. */
  unarmoredMovement?: (level: number) => number;
}

/** Canalisation divine du Clerc (règles 2014) : 1 utilisation au niveau 2, 2 au niveau 6, 3 au
 * niveau 18 ; récupérée au repos court ou long. */
export function channelDivinityUses(level: number): number {
  if (level >= 18) return 3;
  if (level >= 6) return 2;
  if (level >= 2) return 1;
  return 0;
}

const CHANNEL_DIVINITY: ClassResourceDefinition = {
  id: "channel-divinity",
  name: "Canalisation divine",
  recharge: "shortRest",
  usesAtLevel: channelDivinityUses,
};

/** Forme sauvage du Druide (règles 2014) : 2 utilisations dès le niveau 2, récupérées au repos
 * court ou long. L'usage illimité de l'Archidruide (niveau 20) n'est pas modélisé. */
export function wildShapeUses(level: number): number {
  return level >= 2 ? 2 : 0;
}

/** Ki du Moine (règles 2014) : autant de points que le niveau de moine, dès le niveau 2. */
export function kiPoints(level: number): number {
  return level >= 2 ? level : 0;
}

const KI: ClassResourceDefinition = {
  id: "ki",
  name: "Ki",
  recharge: "shortRest",
  usesAtLevel: kiPoints,
};

/** Déplacement sans armure du Moine (règles 2014) : +3 m au niveau 2, puis +1,5 m aux niveaux 6,
 * 10, 14 et 18. */
export function monkUnarmoredMovement(level: number): number {
  if (level < 2) return 0;
  return 3 + 1.5 * Math.floor((Math.min(level, 18) - 2) / 4);
}

const WILD_SHAPE: ClassResourceDefinition = {
  id: "wild-shape",
  name: "Forme sauvage",
  recharge: "shortRest",
  usesAtLevel: wildShapeUses,
};

/**
 * Classes connues des règles (mécanique de jeu uniquement, aucun texte du SRD reproduit — même
 * logique que src/domain/race.ts, voir docs/adr/0022). Ajouter une classe = ajouter une entrée.
 */
export const CHARACTER_CLASSES: readonly CharacterClassDefinition[] = [
  {
    id: "barde",
    name: "Barde",
    aliases: ["barde", "bard"],
    spellcasting: { progression: "full", ability: "charisma", preparation: "known" },
    hitDie: 8,
    savingThrows: ["dexterity", "charisma"],
    resources: [],
  },
  {
    id: "clerc",
    name: "Clerc",
    aliases: ["clerc", "cleric", "pretre", "pretresse"],
    spellcasting: { progression: "full", ability: "wisdom", preparation: "prepared" },
    hitDie: 8,
    savingThrows: ["wisdom", "charisma"],
    resources: [CHANNEL_DIVINITY],
    proficiencies: { armor: ["light", "medium", "shield"], weapons: ["simple"] },
    resourceOptions: [
      {
        id: "turn-undead",
        name: "Renvoi des morts-vivants",
        resourceId: "channel-divinity",
        minLevel: 2,
      },
    ],
    subclassLabel: "Domaine divin",
    subclasses: [TWILIGHT_DOMAIN],
  },
  {
    id: "druide",
    name: "Druide",
    aliases: ["druide", "druid"],
    spellcasting: { progression: "full", ability: "wisdom", preparation: "prepared" },
    hitDie: 8,
    savingThrows: ["intelligence", "wisdom"],
    resources: [WILD_SHAPE],
    // Armes : une liste d'armes précises (gourdin, dague, cimeterre…), pas une catégorie — celles
    // cochées sur la fiche font foi.
    proficiencies: { armor: ["light", "medium", "shield"], weapons: [] },
    resourceOptions: [
      { id: "beast-shape", name: "Forme de bête", resourceId: "wild-shape", minLevel: 2 },
    ],
    subclassLabel: "Cercle druidique",
    subclasses: [CIRCLE_OF_SPORES],
  },
  {
    id: "moine",
    name: "Moine",
    aliases: ["moine", "moniale", "monk"],
    hitDie: 8,
    savingThrows: ["strength", "dexterity"],
    resources: [KI],
    // Plus l'épée courte, arme de moine explicite (`monkWeapon`) maîtrisée via les Arts martiaux.
    proficiencies: { armor: [], weapons: ["simple"] },
    resourceOptions: [
      { id: "flurry-of-blows", name: "Déluge de coups", resourceId: "ki", minLevel: 2 },
      { id: "patient-defense", name: "Patience défensive", resourceId: "ki", minLevel: 2 },
      { id: "step-of-the-wind", name: "Déplacement du vent", resourceId: "ki", minLevel: 2 },
      { id: "stunning-strike", name: "Frappe étourdissante", resourceId: "ki", minLevel: 5 },
    ],
    martialArts: true,
    unarmoredDefense: { ability: "wisdom", allowsShield: false },
    unarmoredMovement: monkUnarmoredMovement,
    subclassLabel: "Tradition monastique",
    subclasses: [OPEN_HAND],
  },
  {
    id: "ensorceleur",
    name: "Ensorceleur",
    aliases: ["ensorceleur", "ensorceleuse", "sorcerer"],
    spellcasting: { progression: "full", ability: "charisma", preparation: "known" },
    hitDie: 6,
    savingThrows: ["constitution", "charisma"],
    resources: [],
  },
  {
    id: "magicien",
    name: "Magicien",
    aliases: ["magicien", "magicienne", "wizard", "mage"],
    spellcasting: { progression: "full", ability: "intelligence", preparation: "prepared" },
    hitDie: 6,
    savingThrows: ["intelligence", "wisdom"],
    resources: [],
  },
];

export function findClassDefinition(
  classId: string | undefined,
): CharacterClassDefinition | undefined {
  return classId ? CHARACTER_CLASSES.find((definition) => definition.id === classId) : undefined;
}

/** Libellé comparable : sans accents ni casse, apostrophes typographiques unifiées. */
export function normalizeLabel(label: string): string {
  return label
    .replace(/[’‘]/g, "'")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

/** Retrouve une classe connue à partir d'un libellé libre (« Clerc », « Cleric »…). */
export function findClassDefinitionByLabel(label: string): CharacterClassDefinition | undefined {
  const normalized = normalizeLabel(label);
  return CHARACTER_CLASSES.find((definition) => definition.aliases.includes(normalized));
}

export function findClassResourceDefinition(
  classId: string | undefined,
  resourceId: string,
): ClassResourceDefinition | undefined {
  return findClassDefinition(classId)?.resources.find((resource) => resource.id === resourceId);
}

export function findSubclassDefinition(
  classId: string | undefined,
  subclassId: string | undefined,
): SubclassDefinition | undefined {
  return subclassId
    ? findClassDefinition(classId)?.subclasses?.find((definition) => definition.id === subclassId)
    : undefined;
}

/** Retrouve une sous-classe connue de la classe à partir d'un libellé libre (« Domaine du
 * Crépuscule », « Twilight »…). */
export function findSubclassDefinitionByLabel(
  classId: string | undefined,
  label: string,
): SubclassDefinition | undefined {
  const normalized = normalizeLabel(label);
  return findClassDefinition(classId)?.subclasses?.find((definition) =>
    definition.aliases.includes(normalized),
  );
}
