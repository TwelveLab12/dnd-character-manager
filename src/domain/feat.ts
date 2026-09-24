import { normalizeLabel } from "./character-class";

/**
 * Don connu des règles (2014) : uniquement sa mécanique modélisée, aucun texte de règle reproduit —
 * même logique que les races, classes et sous-classes (docs/adr/0028). Un don absent du registre
 * reste une capacité saisie sur la fiche.
 */
export interface FeatDefinition {
  id: string;
  name: string;
  /** Libellés reconnus dans le nom d'une capacité de la fiche (français ou anglais). */
  aliases: readonly string[];
  /** PV max supplémentaires par niveau de personnage, rétroactifs (ex : Robuste +2). */
  hitPointsPerLevel?: number;
}

export const FEATS: readonly FeatDefinition[] = [
  {
    id: "lanceur-de-sorts-de-bataille",
    name: "Lanceur de sorts de bataille",
    aliases: ["lanceur de sorts de bataille", "war caster", "mage de guerre"],
  },
  {
    id: "robuste",
    name: "Robuste",
    aliases: ["robuste", "tough"],
    hitPointsPerLevel: 2,
  },
];

export function findFeatDefinition(featId: string): FeatDefinition | undefined {
  return FEATS.find((feat) => feat.id === featId);
}

/** Don dont un alias figure dans le libellé (ex : « Lanceur de sorts de bataille (War Caster) »). */
export function findFeatDefinitionInLabel(label: string): FeatDefinition | undefined {
  const normalized = normalizeLabel(label);
  return FEATS.find((feat) =>
    feat.aliases.some((alias) => normalized.includes(normalizeLabel(alias))),
  );
}

/** Dons du personnage connus du registre. */
export function characterFeats(featIds: readonly string[] | undefined): FeatDefinition[] {
  return (featIds ?? []).flatMap((id) => {
    const feat = findFeatDefinition(id);
    return feat ? [feat] : [];
  });
}
