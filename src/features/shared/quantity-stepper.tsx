"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Quantité avec boutons − / +, sans descendre sous 0 (mode jeu et configuration). */
export function QuantityStepper({
  label,
  quantity,
  onAdjust,
}: {
  /** Nom de l'objet, pour les libellés accessibles des boutons. */
  label: string;
  quantity: number;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="bg-card flex items-center overflow-hidden rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="rounded-none"
        aria-label={`Retirer 1 ${label}`}
        disabled={quantity === 0}
        onClick={() => onAdjust(-1)}
      >
        <Minus />
      </Button>
      <span
        className={`min-w-9 text-center text-[15px] font-semibold tabular-nums ${
          quantity === 0 ? "text-destructive" : ""
        }`}
      >
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="rounded-none"
        aria-label={`Ajouter 1 ${label}`}
        onClick={() => onAdjust(1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
