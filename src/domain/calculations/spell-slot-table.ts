import type { SpellSlotLevel } from "../character";

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
 * Emplacements de sorts d'un lanceur "full caster" au niveau donné, un `SpellSlotLevel` par
 * niveau de sort disposant d'au moins un emplacement (les niveaux à 0 emplacement sont omis).
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

/** Ajuste le nombre d'emplacements utilisés pour un niveau, borné à [0, total]. */
export function adjustSpellSlotUsage(slot: SpellSlotLevel, delta: number): SpellSlotLevel {
  return { ...slot, used: Math.min(slot.total, Math.max(0, slot.used + delta)) };
}
