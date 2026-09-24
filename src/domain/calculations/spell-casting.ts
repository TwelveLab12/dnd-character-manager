import type { Character, Concentration, SpellSlotsUsed } from "../character";
import type { Spell } from "../spell";
import { adjustSpellSlotsUsed, computeSpellSlots } from "./spell-slot-table";

/** Un niveau d'emplacement auquel le sort peut être lancé (niveau du sort ou supérieur). */
export interface CastSlotOption {
  level: number;
  available: number;
  total: number;
}

export interface CastOptions {
  /** Plus petit emplacement disponible ≥ niveau du sort ; `undefined` pour un tour de magie ou
   * quand il ne reste aucun emplacement utilisable. */
  defaultSlotLevel: number | undefined;
  slots: CastSlotOption[];
  canRitual: boolean;
}

/** Façons de lancer ce sort avec l'état actuel du personnage (docs/adr/0034). */
export function castOptions(character: Character, spell: Spell): CastOptions {
  if (spell.level === 0) {
    return { defaultSlotLevel: undefined, slots: [], canRitual: false };
  }
  const slots = computeSpellSlots(character)
    .filter((slot) => slot.level >= spell.level)
    .map((slot) => ({ level: slot.level, available: slot.total - slot.used, total: slot.total }));
  return {
    defaultSlotLevel: slots.find((slot) => slot.available > 0)?.level,
    slots,
    canRitual: spell.ritual,
  };
}

export type CastMode = { type: "slot"; level: number } | { type: "ritual" } | { type: "cantrip" };

export type CastingPatch = { spellSlotsUsed: SpellSlotsUsed; concentration: Concentration };

/**
 * Lance un sort : dépense l'emplacement choisi (aucun pour un tour de magie ou un rituel) et, pour
 * un sort à concentration, active la concentration sur ce sort — ce qui remplace la concentration
 * précédente, comme le veut la règle.
 */
export function castSpell(character: Character, spell: Spell, mode: CastMode): CastingPatch {
  return {
    spellSlotsUsed:
      mode.type === "slot"
        ? adjustSpellSlotsUsed(character, mode.level, 1)
        : character.spellSlotsUsed,
    concentration: spell.concentration
      ? { active: true, spellId: spell.id }
      : character.concentration,
  };
}
