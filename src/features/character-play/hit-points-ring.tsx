"use client";

import { ChevronLeft, ChevronRight, Heart, ShieldPlus } from "lucide-react";
import type { Character } from "@/domain/character";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import { Button } from "@/components/ui/button";
import { usePlayActions } from "./use-play-actions";

const RING_RADIUS = 80;
const TEMPORARY_RADIUS = 95;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const TEMPORARY_CIRCUMFERENCE = 2 * Math.PI * TEMPORARY_RADIUS;

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampRatio(value: number): number {
  return Math.max(0, Math.min(1, value));
}

const NUMBER_INPUT_CLASSES =
  "[appearance:textfield] bg-transparent text-center tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/*
 * Les trois cellules PV du HUD de combat (voir combat-hud.tsx). Chacune occupe une ligne de la
 * grille partagée avec la colonne CA, pour que bouclier et anneau restent alignés :
 * - HitPointsControls : ligne haute ‹ perte · ♥ max · gain › ;
 * - HitPointsRing : arc proportionnel aux PV (couleur par seuil), PV temporaires en arc
 *   extérieur, PV actuels éditables au centre ;
 * - TemporaryHitPointsChip : pastille des PV temporaires, alignée sur celle des effets de CA.
 */

export function HitPointsControls({ character }: { character: Character }) {
  const { applyDamage, applyHealing } = usePlayActions(character.id);
  return (
    <div className="flex w-40 items-center justify-between sm:w-[212px]">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => void applyDamage(1)}
        aria-label="Infliger 1 dégât"
        className="border-destructive/70 bg-destructive/15 text-destructive hover:bg-destructive/25 hover:text-destructive dark:bg-destructive/15 dark:hover:bg-destructive/25 size-10 rounded-full [&_svg:not([class*='size-'])]:size-5"
      >
        <ChevronLeft />
      </Button>
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
        <Heart aria-hidden className="fill-destructive text-destructive size-3.5" />
        <span>
          max{" "}
          <strong className="text-foreground font-semibold tabular-nums">
            {computeMaxHitPoints(character).total}
          </strong>
        </span>
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => void applyHealing(1)}
        aria-label="Soigner 1 point de vie"
        className="border-success/70 bg-success/15 text-success hover:bg-success/25 hover:text-success dark:bg-success/15 dark:hover:bg-success/25 size-10 rounded-full [&_svg:not([class*='size-'])]:size-5"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

export function HitPointsRing({ character }: { character: Character }) {
  const { setCurrentHitPoints } = usePlayActions(character.id);
  const { current, temporary } = character.hitPoints;
  const max = computeMaxHitPoints(character).total;
  const ratio = max > 0 ? clampRatio(current / max) : 0;
  const temporaryRatio = max > 0 ? clampRatio(temporary / max) : 0;
  const arcClassName =
    ratio > 0.5 ? "stroke-success" : ratio > 0.25 ? "stroke-warning" : "stroke-destructive";

  return (
    <div className="relative size-[140px] sm:size-[188px]">
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Points de vie ${current} sur ${max}${temporary > 0 ? `, ${temporary} temporaires` : ""}`}
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx="100"
          cy="100"
          r={RING_RADIUS}
          className="stroke-muted-foreground/20 fill-none"
          strokeWidth={12}
        />
        <circle
          cx="100"
          cy="100"
          r={RING_RADIUS}
          className={`fill-none transition-[stroke-dashoffset,stroke] duration-300 ${arcClassName}`}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - ratio)}
        />
        {temporary > 0 && (
          <circle
            cx="100"
            cy="100"
            r={TEMPORARY_RADIUS}
            className="stroke-info fill-none transition-[stroke-dashoffset] duration-300"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={TEMPORARY_CIRCUMFERENCE}
            strokeDashoffset={TEMPORARY_CIRCUMFERENCE * (1 - temporaryRatio)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span
          aria-hidden
          className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em]"
        >
          PV
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={current}
          onChange={(event) => void setCurrentHitPoints(toNumber(event.target.value))}
          aria-label="PV actuels"
          className={`${NUMBER_INPUT_CLASSES} font-heading focus-visible:border-ring w-20 border-b-2 border-transparent text-[44px] leading-none font-bold sm:w-24 sm:text-[56px]`}
        />
      </div>
    </div>
  );
}

export function TemporaryHitPointsChip({ character }: { character: Character }) {
  const { setTemporaryHitPoints } = usePlayActions(character.id);
  const { temporary } = character.hitPoints;

  return (
    <label className="border-info/55 bg-info/10 text-info inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap">
      <ShieldPlus aria-hidden className="size-3.5" />
      PV temp.
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={temporary}
        onChange={(event) => void setTemporaryHitPoints(toNumber(event.target.value))}
        aria-label="PV temporaires"
        className={`${NUMBER_INPUT_CLASSES} border-info/40 focus-visible:border-info w-7 border-b text-[13px] font-semibold`}
      />
    </label>
  );
}
