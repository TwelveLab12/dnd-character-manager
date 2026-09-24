import type { Character } from "../character";
import { findClassDefinition, findSubclassDefinition } from "../character-class";
import type { Spell } from "../spell";
import { computeAlwaysPreparedSpells } from "./class-features";

function computedAlwaysPreparedIds(character: Character, library: readonly Spell[]): string[] {
  return computeAlwaysPreparedSpells(character, library).flatMap(({ spell }) =>
    spell ? [spell.id] : [],
  );
}

/**
 * Sorts disponibles en jeu sans passer par l'écran de configuration : préparés ∪ toujours-préparés
 * (tags de la fiche ∪ sorts de sous-classe calculés, retrouvés dans `library`) ∪ tours de magie
 * connus (jamais préparés en 5e 2014, retrouvés dans `library` pour connaître leur niveau). Pour un
 * lanceur sans préparation (Barde, Ensorceleur), tous les sorts connus.
 */
export function playAvailableSpellIds(
  character: Character,
  library: readonly Spell[] = [],
): string[] {
  const alwaysPrepared = character.spellTags
    .filter((tag) => tag.alwaysPrepared)
    .map((tag) => tag.spellId);
  // Barde, Ensorceleur… : pas de préparation, tous les sorts connus sont disponibles.
  if (findClassDefinition(character.classId)?.spellcasting?.preparation === "known") {
    return [
      ...new Set([...character.knownSpellIds, ...computedAlwaysPreparedIds(character, library)]),
    ];
  }
  const knownCantrips = library
    .filter((spell) => spell.level === 0 && character.knownSpellIds.includes(spell.id))
    .map((spell) => spell.id);
  return [
    ...new Set([
      ...character.preparedSpellIds,
      ...alwaysPrepared,
      ...computedAlwaysPreparedIds(character, library),
      ...knownCantrips,
    ]),
  ];
}

/** Domaine d'un sort pour ce personnage : tag de la fiche, sinon la sous-classe qui l'accorde. */
export function spellDomain(
  character: Character,
  spellId: string,
  library: readonly Spell[] = [],
): string | undefined {
  const tagged = character.spellTags.find((tag) => tag.spellId === spellId)?.domain;
  if (tagged) {
    return tagged;
  }
  return computedAlwaysPreparedIds(character, library).includes(spellId)
    ? findSubclassDefinition(character.classId, character.subclassId)?.name
    : undefined;
}

/** Domaines distincts (non vides) des sorts de ce personnage, pour les filtres. */
export function spellDomainTags(character: Character, library: readonly Spell[] = []): string[] {
  const domains = [
    ...character.spellTags.map((tag) => tag.domain),
    ...computedAlwaysPreparedIds(character, library).map((id) =>
      spellDomain(character, id, library),
    ),
  ].filter((domain): domain is string => !!domain);
  return [...new Set(domains)];
}

/** Un sort est-il toujours préparé pour ce personnage : tag de la fiche, ou sort de sous-classe
 * calculé (retrouvé dans `library`) ? */
export function isAlwaysAvailable(
  character: Character,
  spellId: string,
  library: readonly Spell[] = [],
): boolean {
  return (
    character.spellTags.some((tag) => tag.spellId === spellId && tag.alwaysPrepared) ||
    computedAlwaysPreparedIds(character, library).includes(spellId)
  );
}
