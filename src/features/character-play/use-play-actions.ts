"use client";

import type { Character } from "@/domain/character";
import { adjustFeatureUses } from "@/domain/calculations/feature-uses";
import { applyDamage, applyHealing, setTemporaryHitPoints } from "@/domain/calculations/hit-points";
import { applyLongRest, applyShortRest } from "@/domain/calculations/rest";
import { adjustSpellSlotUsage } from "@/domain/calculations/spell-slot-table";
import { useCharacterStoreApi } from "@/stores/store-provider";

/**
 * Actions du mode jeu : persistent immédiatement (pas de brouillon + bouton Enregistrer, à
 * l'inverse du mode configuration — voir docs/adr/0013). Chaque action relit l'état courant via
 * `characterStore.getState()` au moment de l'appel plutôt qu'une valeur de rendu fermée, pour
 * éviter qu'un double-clic rapide (ex : deux dégâts coup sur coup) ne perde une mise à jour à
 * cause d'une closure périmée.
 */
export function usePlayActions(characterId: string) {
  const characterStore = useCharacterStoreApi();

  function withCurrent(mutate: (character: Character) => Partial<Character>) {
    const current = characterStore
      .getState()
      .characters.find((character) => character.id === characterId);
    if (!current) {
      return;
    }
    return characterStore.getState().update(characterId, { ...current, ...mutate(current) });
  }

  return {
    applyDamage: (amount: number) =>
      withCurrent((character) => ({ hitPoints: applyDamage(character.hitPoints, amount) })),
    applyHealing: (amount: number) =>
      withCurrent((character) => ({ hitPoints: applyHealing(character.hitPoints, amount) })),
    setTemporaryHitPoints: (amount: number) =>
      withCurrent((character) => ({
        hitPoints: setTemporaryHitPoints(character.hitPoints, amount),
      })),
    toggleConcentration: () =>
      withCurrent((character) => ({
        concentration: { ...character.concentration, active: !character.concentration.active },
      })),
    takeShortRest: () => withCurrent((character) => applyShortRest(character)),
    takeLongRest: () => withCurrent((character) => applyLongRest(character)),
    togglePreparedSpell: (spellId: string, prepared: boolean) =>
      withCurrent((character) => ({
        preparedSpellIds:
          prepared && character.knownSpellIds.includes(spellId)
            ? [...character.preparedSpellIds, spellId]
            : character.preparedSpellIds.filter((id) => id !== spellId),
      })),
    adjustFeatureUse: (featureId: string, delta: number) =>
      withCurrent((character) => ({
        features: character.features.map((feature) =>
          feature.id === featureId ? adjustFeatureUses(feature, delta) : feature,
        ),
      })),
    adjustSpellSlot: (level: number, delta: number) =>
      withCurrent((character) => ({
        spellSlots: character.spellSlots.map((slot) =>
          slot.level === level ? adjustSpellSlotUsage(slot, delta) : slot,
        ),
      })),
  };
}
