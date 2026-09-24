import type { Character } from "../character";
import { findClassDefinitionByLabel } from "../character-class";
import type { Spell } from "../spell";
import type { CharacterSpellTag } from "../spell-tag";

/**
 * État de préparation d'un sort connu : « préparé » et « toujours préparé » s'excluent
 * (docs/adr/0032). Les tours de magie n'en ont pas : ils sont connus, donc toujours disponibles
 * (règles 2014).
 */
export type SpellPreparationState = "none" | "prepared" | "always";

export type KnownSpellsPatch = Pick<Character, "knownSpellIds" | "preparedSpellIds" | "spellTags">;

type SpellsState = KnownSpellsPatch;

function tagFor(character: SpellsState, spellId: string): CharacterSpellTag {
  return (
    character.spellTags.find((tag) => tag.spellId === spellId) ?? { spellId, alwaysPrepared: false }
  );
}

/** Remplace le tag d'un sort, en le supprimant s'il ne porte plus rien. */
function withTag(character: SpellsState, next: CharacterSpellTag): CharacterSpellTag[] {
  const others = character.spellTags.filter((tag) => tag.spellId !== next.spellId);
  return next.domain || next.alwaysPrepared ? [...others, next] : others;
}

function patchOf(character: SpellsState): KnownSpellsPatch {
  return {
    knownSpellIds: character.knownSpellIds,
    preparedSpellIds: character.preparedSpellIds,
    spellTags: character.spellTags,
  };
}

/** Toujours préparé l'emporte si d'anciennes données portent les deux états. */
export function spellPreparationState(
  character: SpellsState,
  spellId: string,
): SpellPreparationState {
  if (tagFor(character, spellId).alwaysPrepared) {
    return "always";
  }
  return character.preparedSpellIds.includes(spellId) ? "prepared" : "none";
}

export function setSpellPreparation(
  character: SpellsState,
  spellId: string,
  state: SpellPreparationState,
): KnownSpellsPatch {
  const withoutPrepared = character.preparedSpellIds.filter((id) => id !== spellId);
  return {
    ...patchOf(character),
    preparedSpellIds: state === "prepared" ? [...withoutPrepared, spellId] : withoutPrepared,
    spellTags: withTag(character, {
      ...tagFor(character, spellId),
      alwaysPrepared: state === "always",
    }),
  };
}

export function setSpellDomain(
  character: SpellsState,
  spellId: string,
  domain: string | undefined,
): KnownSpellsPatch {
  return {
    ...patchOf(character),
    spellTags: withTag(character, { ...tagFor(character, spellId), domain: domain || undefined }),
  };
}

export function addKnownSpells(
  character: SpellsState,
  spellIds: readonly string[],
): KnownSpellsPatch {
  return {
    ...patchOf(character),
    knownSpellIds: [...new Set([...character.knownSpellIds, ...spellIds])],
  };
}

/** Un sort qu'on ne connaît plus ne peut pas rester préparé ni tagué. */
export function removeKnownSpell(character: SpellsState, spellId: string): KnownSpellsPatch {
  return {
    knownSpellIds: character.knownSpellIds.filter((id) => id !== spellId),
    preparedSpellIds: character.preparedSpellIds.filter((id) => id !== spellId),
    spellTags: character.spellTags.filter((tag) => tag.spellId !== spellId),
  };
}

/** Le sort figure-t-il dans la liste de cette classe ? `Spell.classes` est un libellé libre
 * (« Clerc », « Cleric »…), comparé via les alias des classes connues. */
export function spellBelongsToClass(spell: Spell, classId: string): boolean {
  return spell.classes.some((label) => findClassDefinitionByLabel(label)?.id === classId);
}
