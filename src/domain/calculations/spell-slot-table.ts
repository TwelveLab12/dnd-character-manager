import type { Character, SpellSlotLevel, SpellSlotsUsed } from "../character";
import { findClassDefinition } from "../character-class";
import { clampCharacterLevel } from "./proficiency";

/**
 * Table de progression des emplacements de sorts des lanceurs de sorts "full caster" (Clerc,
 * Druide, Barde, Sorcier, Magicien...), niveaux 1 à 20, emplacements de niveau 1 à 9. Ce sont des
 * nombres — une mécanique de jeu, pas du texte de sort protégé — voir
 * docs/adr/0004-json-import-export-open5e-schema.md pour le raisonnement.
 * Index 0 = niveau de personnage 1 ; chaque ligne = emplacements de sort niveau 1 à 9.
 */
const FULL_CASTER_SLOT_TABLE: readonly (readonly number[])[] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // niveau 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // niveau 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // niveau 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // niveau 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // niveau 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // niveau 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // niveau 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // niveau 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // niveau 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // niveau 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // niveau 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // niveau 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // niveau 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // niveau 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // niveau 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // niveau 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // niveau 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // niveau 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // niveau 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // niveau 20
];

/**
 * Totaux d'emplacements d'un lanceur "full caster" au niveau donné, un `SpellSlotLevel` (avec
 * `used: 0`) par niveau de sort disposant d'au moins un emplacement (les niveaux à 0 sont omis).
 */
export function fullCasterSpellSlots(characterLevel: number): SpellSlotLevel[] {
  const row = FULL_CASTER_SLOT_TABLE[characterLevel - 1];
  if (!Number.isInteger(characterLevel) || !row) {
    throw new RangeError(`Invalid character level: ${characterLevel}`);
  }
  return row
    .map((total, index) => ({ level: index + 1, total, used: 0 }))
    .filter((slot) => slot.total > 0);
}

/**
 * Emplacements de sorts du personnage : totaux calculés depuis sa classe (progression) et son
 * niveau, `used` lu dans l'état stocké et borné au total. Aucun emplacement pour une classe hors
 * registre ou sans incantation — voir docs/adr/0022.
 */
export function computeSpellSlots(character: Character): SpellSlotLevel[] {
  const progression = findClassDefinition(character.classId)?.spellcasting?.progression;
  if (progression !== "full") {
    return [];
  }
  return fullCasterSpellSlots(clampCharacterLevel(character.level)).map((slot) => ({
    ...slot,
    used: Math.min(slot.total, Math.max(0, character.spellSlotsUsed[slot.level] ?? 0)),
  }));
}

/** Ajuste les emplacements utilisés d'un niveau, borné à [0, total calculé]. */
export function adjustSpellSlotsUsed(
  character: Character,
  level: number,
  delta: number,
): SpellSlotsUsed {
  const slot = computeSpellSlots(character).find((candidate) => candidate.level === level);
  if (!slot) {
    return character.spellSlotsUsed;
  }
  return {
    ...character.spellSlotsUsed,
    [level]: Math.min(slot.total, Math.max(0, slot.used + delta)),
  };
}
