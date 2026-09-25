"use client";

import { TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import type { Spell } from "@/domain/spell";
import { DetailSheet, DetailStats, DetailText, useLastDefined } from "./detail-sheet";
import { AlwaysPreparedTag, ConcentrationTag, RitualTag } from "./spell-tags";

export function spellLevelLabel(spell: Spell): string {
  const level = spell.level === 0 ? "Tour de magie" : `Niveau ${spell.level}`;
  return spell.school ? `${level} · ${spell.school}` : level;
}

export function spellComponentsLabel(spell: Spell): string {
  return [
    spell.components.verbal ? "V" : null,
    spell.components.somatic ? "S" : null,
    spell.components.material ? "M" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Panneau de détail d'un sort (docs/adr/0041), sur la coque commune `DetailSheet`. `footer`
 * accueille l'action propre à l'écran (le lancement en mode jeu) ; sans lui, lecture seule.
 */
export function SpellDetailSheet({
  spell,
  onOpenChange,
  themeId,
  isAlwaysPrepared,
  showOrigin = false,
  footer,
}: {
  spell: Spell | undefined;
  onOpenChange: (open: boolean) => void;
  themeId?: string;
  /** Fonctions du sort affiché plutôt que valeurs : elles restent justes pendant l'animation de
   * fermeture, quand le parent a déjà remis `spell` à `undefined`. */
  isAlwaysPrepared?: (spell: Spell) => boolean;
  /** Classes et source du sort — utiles hors du mode jeu, où l'on choisit ses sorts. */
  showOrigin?: boolean;
  footer?: (spell: Spell) => ReactNode;
}) {
  const shown = useLastDefined(spell);
  if (!shown) {
    return null;
  }

  const alwaysPrepared = isAlwaysPrepared?.(shown) ?? false;
  const origin = [
    shown.classes.length > 0 ? `Classes : ${shown.classes.join(", ")}` : null,
    shown.source ? `Source : ${shown.source}` : null,
  ].filter(Boolean);

  return (
    <DetailSheet
      open={spell !== undefined}
      onOpenChange={onOpenChange}
      themeId={themeId}
      eyebrow={spellLevelLabel(shown)}
      title={shown.name}
      tags={
        (alwaysPrepared || shown.concentration || shown.ritual) && (
          <>
            {alwaysPrepared && <AlwaysPreparedTag />}
            {shown.concentration && <ConcentrationTag />}
            {shown.ritual && <RitualTag />}
          </>
        )
      }
      footer={footer?.(shown)}
    >
      <DetailStats
        stats={[
          { label: "Incantation", value: shown.castingTime },
          { label: "Portée", value: shown.range },
          { label: "Durée", value: shown.duration },
          { label: "Composantes", value: spellComponentsLabel(shown) },
        ]}
      />
      {shown.components.materialDescription && (
        <p className="text-muted-foreground -mt-1.5 text-[13px] italic">
          Matériel : {shown.components.materialDescription}
        </p>
      )}

      <DetailText>{shown.description || "Pas de description."}</DetailText>

      {shown.higherLevel && (
        <div className="border-primary/30 bg-primary/8 grid gap-1 rounded-2xl border px-3.5 py-3">
          <p className="text-primary flex items-center gap-1.5 text-xs font-semibold tracking-wide">
            <TrendingUp aria-hidden className="size-3.5" />
            Aux niveaux supérieurs
          </p>
          <p className="text-foreground/88 text-sm leading-relaxed whitespace-pre-line">
            {shown.higherLevel}
          </p>
        </div>
      )}

      {showOrigin && origin.length > 0 && (
        <p className="text-muted-foreground text-xs">{origin.join(" · ")}</p>
      )}
    </DetailSheet>
  );
}
