"use client";

import { Sparkles } from "lucide-react";
import type { Character } from "@/domain/character";
import type { InventoryItem } from "@/domain/inventory";
import {
  isShillelaghWeapon,
  knowsShillelagh,
  SHILLELAGH_DAMAGE_DICE,
  shillelaghAbility,
  shillelaghItemId,
} from "@/domain/calculations/shillelagh";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { Button } from "@/components/ui/button";
import { useSpellStore } from "@/stores/store-provider";
import { usePlayActions } from "./use-play-actions";

/**
 * Gourdin magique depuis l'arme (docs/adr/0068) : sur un gourdin ou un bâton en main, si le
 * personnage connaît le sort. Actif, ses effets sont rappelés avec de quoi y mettre fin.
 */
export function ShillelaghControl({
  character,
  item,
}: {
  character: Character;
  item: InventoryItem | undefined;
}) {
  const spells = useSpellStore((state) => state.spells);
  const { startShillelagh, endShillelagh } = usePlayActions(character.id);
  if (!item || item.equipped !== true || !isShillelaghWeapon(item)) {
    return null;
  }
  const active = shillelaghItemId(character) === item.id;
  if (!active && !knowsShillelagh(character, spells)) {
    return null;
  }
  const ability = ABILITY_LABELS[shillelaghAbility(character)];

  if (active) {
    return (
      <div className="border-success/40 bg-success/10 grid gap-2.5 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-success inline-flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles aria-hidden className="size-4" />
            Gourdin magique
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => void endShillelagh()}>
            Mettre fin
          </Button>
        </div>
        <ul className="text-muted-foreground grid gap-1 text-[13px]">
          <li>{ability} au lieu de la Force, au toucher et aux dégâts</li>
          <li>Dé de dégâts {SHILLELAGH_DAMAGE_DICE}, quelle que soit la prise</li>
          <li>Arme magique · 1 minute, ou jusqu’à ce que vous la lâchiez</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="grid justify-items-start gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={character.raging === true}
        onClick={() => void startShillelagh(item.id)}
      >
        <Sparkles aria-hidden />
        Lancer Gourdin magique
      </Button>
      <span className="text-muted-foreground text-xs">
        {character.raging
          ? "Pas de sorts en rage."
          : `Action bonus · ${ability} et ${SHILLELAGH_DAMAGE_DICE} pendant 1 minute`}
      </span>
    </div>
  );
}
