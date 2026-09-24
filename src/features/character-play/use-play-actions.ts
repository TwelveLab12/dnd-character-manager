"use client";

import type { Character } from "@/domain/character";
import { adjustFeatureUses } from "@/domain/calculations/feature-uses";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import {
  applyDamage,
  applyHealing,
  setCurrentHitPoints,
  setTemporaryHitPoints,
} from "@/domain/calculations/hit-points";
import { applyLongRest, applyShortRest } from "@/domain/calculations/rest";
import type { EquipSlot } from "@/domain/equipment";
import { equipItem } from "@/domain/equipment";
import type { Coin } from "@/domain/currency";
import { characterCurrency, setCoinAmount } from "@/domain/currency";
import { adjustItemQuantity } from "@/domain/inventory";
import { adjustSpellSlotsUsed } from "@/domain/calculations/spell-slot-table";
import { adjustClassResourceUsed } from "@/domain/calculations/class-resources";
import type { ClassResourceId } from "@/domain/character-class";
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
      withCurrent((character) => ({
        hitPoints: applyHealing(character.hitPoints, amount, computeMaxHitPoints(character).total),
      })),
    setCurrentHitPoints: (value: number) =>
      withCurrent((character) => ({
        hitPoints: setCurrentHitPoints(
          character.hitPoints,
          value,
          computeMaxHitPoints(character).total,
        ),
      })),
    setTemporaryHitPoints: (amount: number) =>
      withCurrent((character) => ({
        hitPoints: setTemporaryHitPoints(character.hitPoints, amount),
      })),
    toggleConcentration: () =>
      withCurrent((character) => ({
        // Couper la concentration oublie aussi le sort concentré (et donc ses effets de CA).
        concentration: character.concentration.active
          ? { active: false }
          : { ...character.concentration, active: true },
      })),
    setConcentrationSpell: (spellId: string | undefined) =>
      withCurrent((character) => ({
        concentration: spellId
          ? { ...character.concentration, spellId }
          : { active: character.concentration.active },
      })),
    toggleArmorClassEffect: (effectId: string) =>
      withCurrent((character) => ({
        armorClassEffects: character.armorClassEffects?.map((effect) =>
          effect.id === effectId && effect.trigger.type === "manual"
            ? { ...effect, trigger: { type: "manual", active: !effect.trigger.active } }
            : effect,
        ),
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
    equipItem: (itemId: string, slot: EquipSlot) =>
      withCurrent((character) => ({ inventory: equipItem(character, itemId, slot) })),
    adjustItemQuantity: (itemId: string, delta: number) =>
      withCurrent((character) => ({
        inventory: adjustItemQuantity(character.inventory, itemId, delta),
      })),
    setCoinAmount: (coin: Coin, amount: number) =>
      withCurrent((character) => ({
        currency: setCoinAmount(characterCurrency(character), coin, amount),
      })),
    adjustFeatureUse: (featureId: string, delta: number) =>
      withCurrent((character) => ({
        features: character.features.map((feature) =>
          feature.id === featureId ? adjustFeatureUses(feature, delta) : feature,
        ),
      })),
    adjustSpellSlot: (level: number, delta: number) =>
      withCurrent((character) => ({
        spellSlotsUsed: adjustSpellSlotsUsed(character, level, delta),
      })),
    /** `delta` > 0 dépense des utilisations, < 0 en récupère. */
    adjustClassResource: (resourceId: ClassResourceId, delta: number) =>
      withCurrent((character) => ({
        classResourcesUsed: adjustClassResourceUsed(character, resourceId, delta),
      })),
  };
}
