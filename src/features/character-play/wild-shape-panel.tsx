"use client";

import { PawPrint, TriangleAlert, Undo2 } from "lucide-react";
import Link from "next/link";
import type { Character } from "@/domain/character";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import { wildShapeUnavailableReason } from "@/domain/calculations/wild-shape";
import {
  activeWildShapeForm,
  wildShapeDurationHours,
  wildShapeFormWarnings,
} from "@/domain/calculations/wild-shape-form";
import { formSummary } from "@/features/character-sheet/wild-shape-forms-section";
import { characterEditHref } from "@/features/shared/character-tabs";
import { Button } from "@/components/ui/button";
import { usePlayActions } from "./use-play-actions";

/**
 * Forme sauvage sur sa carte de ressource (docs/adr/0070) : se transformer dans une des formes
 * enregistrées, ou, transformé, les effets de la forme et le retour à la forme normale.
 */
export function WildShapePanel({ character }: { character: Character }) {
  const { startWildShape, endWildShape } = usePlayActions(character.id);
  const form = activeWildShapeForm(character);
  const forms = character.wildShapeForms ?? [];

  if (form) {
    const hours = wildShapeDurationHours(character.level);
    return (
      <div className="border-primary/40 bg-primary/10 grid gap-2.5 rounded-xl border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold">
            <PawPrint aria-hidden className="size-4" />
            {form.name || "Forme sauvage"}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => void endWildShape()}>
            <Undo2 />
            Reprendre ma forme
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">{formSummary(form)}</p>
        <ul className="text-muted-foreground grid gap-1 text-[13px]">
          <li>
            Vos PV : {character.hitPoints.current} / {computeMaxHitPoints(character).total},
            retrouvés au retour. À 0 PV de bête, vous reprenez votre forme et le surplus de dégâts
            passe sur les vôtres.
          </li>
          <li>
            For, Dex, Con, CA, vitesse et attaques de la bête ; Int, Sag, Cha et maîtrises gardées
          </li>
          <li>Pas de sorts, mais la concentration en cours continue</li>
          <li>
            {hours} heure{hours > 1 ? "s" : ""} au plus · retour en action bonus
          </li>
        </ul>
        {form.notes && <p className="text-[13px] whitespace-pre-line">{form.notes}</p>}
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <p className="text-muted-foreground text-[13px]">
        Aucune forme enregistrée.{" "}
        <Link
          href={characterEditHref(character.id, "features")}
          className="text-primary underline underline-offset-4"
        >
          Ajouter mes bêtes
        </Link>{" "}
        dans la configuration (onglet Capacités).
      </p>
    );
  }

  const unavailable = wildShapeUnavailableReason(character);
  return (
    <div className="grid gap-1.5">
      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Se transformer
      </span>
      {forms.map((candidate) => {
        const warnings = wildShapeFormWarnings(character, candidate);
        return (
          <div
            key={candidate.id}
            className="border-primary/30 bg-card flex min-h-11 items-center gap-2.5 rounded-xl border py-1.5 pr-1.5 pl-3"
          >
            <span className="bg-primary/10 text-primary grid size-7.5 shrink-0 place-items-center rounded-lg">
              <PawPrint aria-hidden className="size-4" />
            </span>
            <span className="grid min-w-0 flex-1 gap-px">
              <span className="truncate text-[13px] font-medium">
                {candidate.name || "Forme sans nom"}
              </span>
              <span className="text-muted-foreground truncate text-[11px]">
                {formSummary(candidate)}
              </span>
              {warnings.map((warning) => (
                <span
                  key={warning}
                  className="text-warning inline-flex items-center gap-1 text-[11px]"
                >
                  <TriangleAlert aria-hidden className="size-3 shrink-0" />
                  {warning}
                </span>
              ))}
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={unavailable !== undefined}
              onClick={() => void startWildShape(candidate.id)}
              aria-label={`Se transformer : ${candidate.name || "forme"}`}
              className="text-primary hover:text-primary hover:bg-primary/15 h-9 text-[11px] font-semibold tracking-[0.06em] uppercase"
            >
              Devenir
            </Button>
          </div>
        );
      })}
      {unavailable && <span className="text-muted-foreground text-xs">{unavailable}</span>}
    </div>
  );
}
