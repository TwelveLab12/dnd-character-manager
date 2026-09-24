import type { AbilityName } from "./ability-scores";
import type { FeatureRecharge } from "./feature";
import type {
  ClassResourceOptionDefinition,
  ProficiencyGrants,
  SubclassDefinition,
} from "./subclass";
import { TWILIGHT_DOMAIN } from "./subclass";

/** Progression d'emplacements de sorts. Seuls les lanceurs complets sont modélisés pour l'instant
 * (demi-lanceurs, tiers de lanceurs et magie de pacte viendront avec leurs classes). */
export type CasterProgression = "full";

export type ClassResourceId = "channel-divinity";

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
  spellcasting?: { progression: CasterProgression; ability: AbilityName };
  resources: readonly ClassResourceDefinition[];
  /** Maîtrises accordées par la classe (renseignées seulement quand elles s'expriment en
   * catégories d'armures et d'armes ; sinon, celles cochées sur la fiche font foi). */
  proficiencies?: ProficiencyGrants;
  /** Options de ressources de classe communes à toute la classe (ex : Renvoi des morts-vivants). */
  resourceOptions?: readonly ClassResourceOptionDefinition[];
  /** Nom générique des sous-classes (ex : « Domaine divin ») et sous-classes connues. */
  subclassLabel?: string;
  subclasses?: readonly SubclassDefinition[];
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

/**
 * Classes connues des règles (mécanique de jeu uniquement, aucun texte du SRD reproduit — même
 * logique que src/domain/race.ts, voir docs/adr/0022). Ajouter une classe = ajouter une entrée.
 */
export const CHARACTER_CLASSES: readonly CharacterClassDefinition[] = [
  {
    id: "barde",
    name: "Barde",
    aliases: ["barde", "bard"],
    spellcasting: { progression: "full", ability: "charisma" },
    resources: [],
  },
  {
    id: "clerc",
    name: "Clerc",
    aliases: ["clerc", "cleric", "pretre", "pretresse"],
    spellcasting: { progression: "full", ability: "wisdom" },
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
    spellcasting: { progression: "full", ability: "wisdom" },
    resources: [],
  },
  {
    id: "ensorceleur",
    name: "Ensorceleur",
    aliases: ["ensorceleur", "ensorceleuse", "sorcerer"],
    spellcasting: { progression: "full", ability: "charisma" },
    resources: [],
  },
  {
    id: "magicien",
    name: "Magicien",
    aliases: ["magicien", "magicienne", "wizard", "mage"],
    spellcasting: { progression: "full", ability: "intelligence" },
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
