import type { Character } from "../character";

/** Sorts disponibles en jeu sans passer par l'écran de configuration : préparés ∪ toujours-préparés. */
export function playAvailableSpellIds(character: Character): string[] {
  const alwaysPrepared = character.spellTags
    .filter((tag) => tag.alwaysPrepared)
    .map((tag) => tag.spellId);
  return [...new Set([...character.preparedSpellIds, ...alwaysPrepared])];
}

/** Domaines distincts (non vides) tagués sur les sorts de ce personnage, pour les filtres. */
export function spellDomainTags(character: Character): string[] {
  const domains = character.spellTags
    .map((tag) => tag.domain)
    .filter((domain): domain is string => !!domain);
  return [...new Set(domains)];
}

/** Un sort est-il marqué toujours-préparé pour ce personnage ? */
export function isAlwaysAvailable(character: Character, spellId: string): boolean {
  return character.spellTags.some((tag) => tag.spellId === spellId && tag.alwaysPrepared);
}
