"use client";

import { BatteryLow, Minus, Plus } from "lucide-react";
import type { Character } from "@/domain/character";
import {
  MAX_EXHAUSTION,
  activeExhaustionEffects,
  exhaustionLevel,
} from "@/domain/calculations/exhaustion";
import { Button } from "@/components/ui/button";
import { usePlayActions } from "./use-play-actions";

/**
 * Compteur d'épuisement de la ligne des états de l'onglet Combat (docs/adr/0066), à côté de la
 * concentration : 0 à 6, en ambre dès le niveau 1.
 */
export function ExhaustionControl({ character }: { character: Character }) {
  const { setExhaustion } = usePlayActions(character.id);
  const level = exhaustionLevel(character);

  return (
    <div role="group" aria-label="Épuisement" className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 text-sm font-medium ${
          level > 0 ? "text-warning" : "text-muted-foreground"
        }`}
      >
        <BatteryLow aria-hidden className="size-4" />
        Épuisement
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Retirer un niveau d'épuisement"
        disabled={level === 0}
        onClick={() => void setExhaustion(level - 1)}
      >
        <Minus />
      </Button>
      <output
        aria-label="Niveau d'épuisement"
        className={`font-heading w-5 text-center text-lg font-bold tabular-nums ${
          level > 0 ? "text-warning" : ""
        }`}
      >
        {level}
      </output>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Ajouter un niveau d'épuisement"
        disabled={level === MAX_EXHAUSTION}
        onClick={() => void setExhaustion(level + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}

/**
 * Bandeau des effets actifs de l'épuisement (niveaux 1 à 5), sous les PV. Au niveau 6, le panneau
 * des jets contre la mort affiche « Mort ».
 */
export function ExhaustionBanner({ character }: { character: Character }) {
  const level = exhaustionLevel(character);
  if (level === 0 || level >= MAX_EXHAUSTION) {
    return null;
  }
  return (
    <section
      aria-label={`Épuisement ${level}`}
      className="border-warning/50 bg-warning/10 grid gap-2 rounded-xl border p-3 sm:p-4"
    >
      <h2 className="text-warning flex items-center gap-2 font-semibold">
        <BatteryLow aria-hidden className="size-5" />
        Épuisement {level}
      </h2>
      <ul className="grid list-disc gap-1 pl-5 text-sm">
        {activeExhaustionEffects(level).map((effect) => (
          <li key={effect}>{effect}</li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        Les effets se cumulent. Un repos long retire un niveau, si le personnage a mangé et bu.
      </p>
    </section>
  );
}
