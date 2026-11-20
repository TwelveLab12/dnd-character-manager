"use client";

import { Shield, ShieldPlus } from "lucide-react";
import type { ArmorClassEffect } from "@/domain/armor-class-effect";
import type { Character } from "@/domain/character";
import type { ArmorClassResult } from "@/domain/calculations/armor-class";
import { formatModifier } from "@/features/shared/format";
import { usePlayActions } from "./use-play-actions";

/*
 * Les cellules CA du HUD de combat (voir combat-hud.tsx), en miroir des cellules PV
 * (hit-points-ring.tsx) : libellé sur la ligne haute, bouclier de même hauteur que l'anneau de PV,
 * puis les pastilles d'effets manuels alignées sur celle des PV temporaires.
 */

export function ArmorClassHeading() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
      <Shield aria-hidden className="size-3.5 text-primary" />
      Classe d&apos;armure
    </span>
  );
}

/** Contour du bouclier (viewBox 200×232) : la largeur en découle pour une hauteur donnée. */
const SHIELD_OUTLINE = "M100 6 L186 34 V106 C186 166 148 204 100 226 C52 204 14 166 14 106 V34 Z";
const SHIELD_INNER_OUTLINE =
  "M100 20 L172 44 V106 C172 158 140 190 100 210 C60 190 28 158 28 106 V44 Z";

export function ArmorClassShield({
  armorClass,
  boosted,
}: {
  armorClass: ArmorClassResult;
  /** Un effet temporaire (sort, réaction…) augmente la CA : halo pour le rendre visible. */
  boosted: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`Classe d'armure ${armorClass.total}`}
      className={`relative aspect-[200/232] h-[140px] transition-[filter] duration-300 sm:h-[188px] ${
        boosted ? "drop-shadow-[0_0_16px_color-mix(in_oklab,var(--info)_45%,transparent)]" : ""
      }`}
    >
      <svg viewBox="0 0 200 232" aria-hidden className="absolute inset-0 size-full">
        <path
          d={SHIELD_OUTLINE}
          className="fill-primary/10 stroke-primary"
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
        <path
          d={SHIELD_INNER_OUTLINE}
          className="fill-none stroke-primary/35"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
      <div
        aria-hidden
        className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
      >
        <span className="text-[10px] font-semibold tracking-[0.14em] text-primary">CA</span>
        <span className="font-heading text-[44px] leading-none font-bold tabular-nums sm:text-[56px]">
          {armorClass.total}
        </span>
      </div>
    </div>
  );
}

/** Interrupteurs des effets de CA à déclenchement manuel (ex : Bouclier +5 en réaction). */
export function ArmorClassEffectChips({ character }: { character: Character }) {
  const manualEffects = (character.armorClassEffects ?? []).filter(
    (effect) => effect.trigger.type === "manual",
  );
  if (manualEffects.length === 0) {
    return null;
  }

  return (
    <div className="flex max-w-full flex-wrap justify-center gap-1.5">
      {manualEffects.map((effect) => (
        <ArmorClassEffectChip key={effect.id} characterId={character.id} effect={effect} />
      ))}
    </div>
  );
}

function ArmorClassEffectChip({
  characterId,
  effect,
}: {
  characterId: string;
  effect: ArmorClassEffect;
}) {
  const { toggleArmorClassEffect } = usePlayActions(characterId);
  const active = effect.trigger.type === "manual" && effect.trigger.active;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${effect.name || "Effet"} (${formatModifier(effect.bonus)} CA)`}
      onClick={() => void toggleArmorClassEffect(effect.id)}
      className={`inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? "border-info/60 bg-info/15 text-info"
          : "border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      <ShieldPlus aria-hidden className="size-3.5 shrink-0" />
      <span className="truncate">
        {effect.name || "Effet"} {formatModifier(effect.bonus)}
      </span>
    </button>
  );
}
