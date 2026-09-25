"use client";

import { Flame, Focus, Heart, Shield } from "lucide-react";
import { useEffect } from "react";
import type { Character } from "@/domain/character";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import { useSpellStore } from "@/stores/store-provider";
import { hasActiveArmorClassEffect } from "./combat-hud";

/**
 * Résumé en lecture seule, collé en haut de l'écran au-dessus des onglets du mode jeu : CA, PV,
 * rage et concentration restent sous les yeux depuis n'importe quel onglet ; tout se modifie dans l'onglet
 * Combat. Voir docs/adr/0031.
 */
export function CombatSummary({ character }: { character: Character }) {
  const spells = useSpellStore((state) => state.spells);
  const loadSpells = useSpellStore((state) => state.load);
  useEffect(() => {
    void loadSpells();
  }, [loadSpells]);
  const armorClass = computeArmorClass(character).total;
  const boosted = hasActiveArmorClassEffect(character);
  const { current, temporary } = character.hitPoints;
  const max = computeMaxHitPoints(character).total;
  const { concentration } = character;
  const concentrationSpell = concentration.spellId
    ? spells.find((spell) => spell.id === concentration.spellId)?.name
    : undefined;

  return (
    <section
      aria-label="Résumé"
      className="bg-background/85 sticky top-0 z-10 flex flex-nowrap items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2 shadow-lg shadow-black/35 backdrop-blur-sm sm:gap-3.5 sm:px-4 sm:py-2.5"
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Shield aria-hidden className="text-primary size-4 sm:size-[18px]" />
        <span className="text-muted-foreground text-xs">CA</span>
        <span
          className={`font-heading text-xl font-bold tabular-nums sm:text-[22px] ${boosted ? "text-info" : ""}`}
        >
          {armorClass}
        </span>
      </span>
      <Divider />
      <span className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Heart aria-hidden className="text-success size-4 sm:size-[18px]" />
        <span className="text-muted-foreground text-xs">PV</span>
        <span className="font-heading text-xl font-bold tabular-nums sm:text-[22px]">
          {current}
          <span className="text-muted-foreground text-sm font-medium"> / {max}</span>
        </span>
        {temporary > 0 && (
          <span className="border-info/40 bg-info/10 text-info rounded-full border px-2 text-xs">
            +{temporary}
            <span className="max-sm:hidden"> temp.</span>
          </span>
        )}
      </span>
      {character.raging && (
        <>
          <Divider />
          <span className="text-destructive inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
            <Flame aria-hidden className="size-4" />
            En rage
          </span>
        </>
      )}
      {concentration.active && (
        <>
          <Divider />
          <span className="text-info inline-flex min-w-0 items-center gap-1.5 text-sm">
            <Focus aria-hidden className="size-4 shrink-0" />
            <span className={concentrationSpell ? "text-muted-foreground max-sm:sr-only" : ""}>
              Concentration{concentrationSpell ? " :" : ""}
            </span>
            {concentrationSpell && (
              <span className="truncate font-medium">{concentrationSpell}</span>
            )}
          </span>
        </>
      )}
    </section>
  );
}

function Divider() {
  return <span aria-hidden className="bg-border h-5 w-px shrink-0" />;
}
