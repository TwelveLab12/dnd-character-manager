import type { AbilityName } from "./ability-scores";
import type { FeatureRecharge } from "./feature";

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

function normalizeLabel(label: string): string {
  return label
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
