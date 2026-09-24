"use client";

import { Minus, Plus } from "lucide-react";
import type { Character } from "@/domain/character";
import { computeSpellSlots } from "@/domain/calculations/spell-slot-table";
import { Button } from "@/components/ui/button";
import { usePlayActions } from "./use-play-actions";

export function SpellSlotsCounter({ character }: { character: Character }) {
  const { adjustSpellSlot } = usePlayActions(character.id);

  const sortedSlots = computeSpellSlots(character);

  if (sortedSlots.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      {sortedSlots.map((slot) => {
        const available = slot.total - slot.used;
        return (
          <div
            key={slot.level}
            className="flex items-center justify-between gap-2 rounded-lg border p-2"
          >
            <span className="text-sm font-medium">Niveau {slot.level}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={available <= 0}
                onClick={() => void adjustSpellSlot(slot.level, 1)}
                aria-label={`Utiliser un emplacement de niveau ${slot.level}`}
              >
                <Minus />
              </Button>
              <span className="w-14 text-center text-sm tabular-nums">
                {available} / {slot.total}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={slot.used <= 0}
                onClick={() => void adjustSpellSlot(slot.level, -1)}
                aria-label={`Récupérer un emplacement de niveau ${slot.level}`}
              >
                <Plus />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
