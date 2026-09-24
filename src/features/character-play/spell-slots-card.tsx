"use client";

import { Sparkles } from "lucide-react";
import type { Character, SpellSlotLevel } from "@/domain/character";
import { computeSpellSlots } from "@/domain/calculations/spell-slot-table";
import { usePlayActions } from "./use-play-actions";

/**
 * Emplacements de sorts du HUD de combat : une rangée de losanges par niveau de sort, pleins et
 * lumineux quand l'emplacement est disponible, en pointillés quand il est utilisé. Toucher un
 * losange plein dépense un emplacement, toucher un losange vide en récupère un. Les totaux sont
 * calculés depuis la classe et le niveau (docs/adr/0022).
 */
export function SpellSlotsCard({ character }: { character: Character }) {
  const slots = computeSpellSlots(character);
  if (slots.length === 0) {
    return null;
  }
  const remaining = slots.reduce((sum, slot) => sum + slot.total - slot.used, 0);
  const total = slots.reduce((sum, slot) => sum + slot.total, 0);

  return (
    <section
      aria-label="Emplacements de sorts"
      className="border-info/30 bg-info/5 flex flex-col gap-3 rounded-2xl border px-3.5 py-4 sm:px-4.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-info inline-flex items-center gap-1.5 text-[13px] font-semibold">
          <Sparkles aria-hidden className="size-4" />
          Emplacements de sorts
        </span>
        <span className="text-muted-foreground text-xs">
          <strong className="text-foreground font-semibold tabular-nums">{remaining}</strong> /{" "}
          {total} restants
        </span>
      </div>
      {slots.map((slot) => (
        <SpellSlotRow key={slot.level} characterId={character.id} slot={slot} />
      ))}
    </section>
  );
}

function SpellSlotRow({ characterId, slot }: { characterId: string; slot: SpellSlotLevel }) {
  const { adjustSpellSlot } = usePlayActions(characterId);
  const available = slot.total - slot.used;

  return (
    <div className="flex items-center gap-2.5">
      <span className="font-heading text-muted-foreground w-12 shrink-0 text-[15px] font-semibold">
        Niv. <span className="text-foreground">{slot.level}</span>
      </span>
      <div className="flex flex-1 flex-wrap gap-1">
        {Array.from({ length: slot.total }, (_, index) => {
          const isAvailable = index < available;
          return (
            <button
              key={index}
              type="button"
              onClick={() => void adjustSpellSlot(slot.level, isAvailable ? 1 : -1)}
              aria-label={
                isAvailable
                  ? `Utiliser un emplacement de niveau ${slot.level}`
                  : `Récupérer un emplacement de niveau ${slot.level}`
              }
              className="focus-visible:ring-ring/50 grid size-9 place-items-center rounded-lg outline-none focus-visible:ring-3 sm:size-8"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-[22px] overflow-visible">
                <path
                  d="M12 2 L21 12 L12 22 L3 12 Z"
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                  strokeDasharray={isAvailable ? undefined : "3 2.5"}
                  className={`transition-[fill,stroke] duration-200 ${
                    isAvailable
                      ? "fill-info stroke-info drop-shadow-[0_0_5px_color-mix(in_oklab,var(--info)_55%,transparent)]"
                      : "stroke-muted-foreground/45 fill-transparent"
                  }`}
                />
              </svg>
            </button>
          );
        })}
      </div>
      <span className="shrink-0 text-[13px] font-semibold tabular-nums">
        {available}
        <span className="text-muted-foreground font-normal">/{slot.total}</span>
      </span>
    </div>
  );
}
