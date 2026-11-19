"use client";

import { Hourglass, Minus, Moon, Plus, Sparkles } from "lucide-react";
import type { Character } from "@/domain/character";
import type { CharacterFeature } from "@/domain/feature";
import { Button } from "@/components/ui/button";
import { DetailsHint } from "@/features/shared/detail-sheet";
import { FEATURE_RECHARGE_LABELS, hasOwnUses } from "@/features/shared/feature";
import { usePlayActions } from "./use-play-actions";

/** Au-delà, un médaillon par utilisation prend trop de place : compteur − / + à la place. */
const MAX_MEDALLIONS = 5;

/** Cartes des capacités à utilisations du personnage, dans l'ordre de la fiche. */
export function FeatureUsageCards({
  character,
  showDescription = false,
  onShowDetails,
}: {
  character: Character;
  showDescription?: boolean;
  /** Toute la carte ouvre le panneau de détail (onglet Combat, docs/adr/0042). */
  onShowDetails?: (featureId: string) => void;
}) {
  return character.features
    .filter(hasOwnUses)
    .map((feature) => (
      <FeatureUsageCard
        key={feature.id}
        characterId={character.id}
        feature={feature}
        showDescription={showDescription}
        onShowDetails={onShowDetails && (() => onShowDetails(feature.id))}
      />
    ));
}

/**
 * Capacité à utilisations (ex : Yeux de la nuit), même langage visuel que la réserve de
 * Canalisation divine (class-resource-card.tsx) : un médaillon par utilisation, allumé si
 * disponible — le toucher dépense ou récupère une utilisation —, et un bouton « Utiliser ».
 */
function FeatureUsageCard({
  characterId,
  feature,
  showDescription,
  onShowDetails,
}: {
  characterId: string;
  feature: CharacterFeature;
  showDescription: boolean;
  onShowDetails?: () => void;
}) {
  const { adjustFeatureUse } = usePlayActions(characterId);
  const max = feature.usesMax ?? 0;
  const remaining = feature.usesCurrent ?? max;
  const exhausted = remaining <= 0;
  const rechargeLabel =
    feature.recharge && feature.recharge !== "other"
      ? FEATURE_RECHARGE_LABELS[feature.recharge]
      : undefined;
  const RechargeIcon = feature.recharge === "shortRest" ? Hourglass : Moon;

  return (
    <section
      aria-label={feature.name}
      className={`relative flex flex-col gap-3 rounded-2xl border px-3.5 py-4 sm:px-4.5 ${
        exhausted ? "bg-background/40" : "border-primary/30 bg-primary/5"
      }`}
    >
      {/* Médaillons, compteur et « Utiliser » passent au-dessus (z-10) et gardent leur action. */}
      {onShowDetails && (
        <button
          type="button"
          aria-label={`Détails : ${feature.name}`}
          onClick={onShowDetails}
          className="absolute inset-0 cursor-pointer rounded-2xl outline-none hover:bg-foreground/[0.03] focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0 gap-0.5">
          {feature.source && (
            <span className="truncate text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {feature.source}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-heading text-lg leading-tight font-bold text-primary">
            <Sparkles aria-hidden className="size-4 shrink-0" />
            {feature.name}
            {onShowDetails && <DetailsHint />}
          </span>
        </div>
        {rechargeLabel && (
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
            <RechargeIcon aria-hidden className="size-3" />
            {rechargeLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3.5">
        {max <= MAX_MEDALLIONS ? (
          <div className="relative z-10 flex flex-wrap gap-2">
            {Array.from({ length: max }, (_, index) => {
              const lit = index < remaining;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => void adjustFeatureUse(feature.id, lit ? -1 : 1)}
                  aria-label={lit ? `Dépenser : ${feature.name}` : `Récupérer : ${feature.name}`}
                  className={`grid size-12 place-items-center rounded-full border-2 transition-all duration-300 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    lit
                      ? "border-primary bg-primary/15 text-primary shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                      : "border-dashed border-muted-foreground/40 text-muted-foreground/50"
                  }`}
                >
                  <Sparkles aria-hidden className="size-5" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="relative z-10 flex items-center overflow-hidden rounded-lg border bg-card">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="rounded-none"
              disabled={exhausted}
              onClick={() => void adjustFeatureUse(feature.id, -1)}
              aria-label={`Dépenser : ${feature.name}`}
            >
              <Minus />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="rounded-none"
              disabled={remaining >= max}
              onClick={() => void adjustFeatureUse(feature.id, 1)}
              aria-label={`Récupérer : ${feature.name}`}
            >
              <Plus />
            </Button>
          </div>
        )}
        <div className="grid gap-0.5">
          <span className="font-heading text-xl font-bold tabular-nums">
            {remaining}
            <span className="text-sm font-medium text-muted-foreground"> / {max}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {!exhausted
              ? "Disponible"
              : rechargeLabel
                ? `Revient au prochain ${rechargeLabel.toLowerCase()}`
                : "Épuisée"}
          </span>
        </div>
      </div>

      {showDescription && feature.description && (
        <p className="text-[13px] leading-relaxed whitespace-pre-line text-foreground/80">
          {feature.description}
        </p>
      )}

      <Button
        type="button"
        className="relative z-10 h-11 rounded-xl text-[13px] font-semibold tracking-[0.06em] uppercase"
        disabled={exhausted}
        onClick={() => void adjustFeatureUse(feature.id, -1)}
        aria-label={`Utiliser ${feature.name}`}
      >
        Utiliser
      </Button>
    </section>
  );
}
