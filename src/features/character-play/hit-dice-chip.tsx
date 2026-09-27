"use client";

import { Dices } from "lucide-react";
import type { Character } from "@/domain/character";
import { computeHitDice } from "@/domain/calculations/hit-dice";
import { ShortRestDialog } from "./short-rest-dialog";

/**
 * Pastille des dés de vie sous l'anneau de PV (docs/adr/0059) : restants/total et type de dé.
 * Elle ouvre le repos court, seul moment où les dés se dépensent. Rien pour une classe hors
 * registre (dé inconnu).
 */
export function HitDiceChip({ character }: { character: Character }) {
  const hitDice = computeHitDice(character);
  if (!hitDice) {
    return null;
  }
  const { remaining, total, die } = hitDice;

  return (
    <ShortRestDialog character={character}>
      <button
        type="button"
        aria-label={`Dés de vie : ${remaining} sur ${total} (d${die}) — repos court`}
        className={`focus-visible:ring-ring/50 inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 ${
          remaining === 0
            ? "border-border text-muted-foreground"
            : "border-success/55 bg-success/10 text-success hover:bg-success/20"
        }`}
      >
        <Dices aria-hidden className="size-3.5" />
        Dés de vie
        <span className="text-[13px] font-semibold tabular-nums">
          {remaining}/{total}
        </span>
        <span className="opacity-75">d{die}</span>
      </button>
    </ShortRestDialog>
  );
}
