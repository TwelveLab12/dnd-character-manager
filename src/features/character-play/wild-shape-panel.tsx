"use client";

import { ChevronRight, PawPrint, Search, Star, TriangleAlert, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { normalizeLabel } from "@/domain/character-class";
import type { BeastForm } from "@/domain/wild-shape";
import { beastAttacks } from "@/domain/calculations/weapon-attack";
import { DetailSheet } from "@/features/shared/detail-sheet";
import { formatDecimal, formatModifier } from "@/features/shared/format";
import { SegmentedControl } from "@/features/shared/segmented-control";
import { DAMAGE_TYPE_LABELS } from "@/features/shared/weapon";
import { Input } from "@/components/ui/input";
import type { Character } from "@/domain/character";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import { wildShapeUnavailableReason } from "@/domain/calculations/wild-shape";
import {
  activeWildShapeForm,
  parseChallengeRating,
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

  return <FormPicker character={character} onStart={(formId) => void startWildShape(formId)} />;
}

/** Nombre de formes favorites affichées en accès rapide sur la carte. */
const QUICK_ACCESS = 3;

/**
 * Choix de la forme (docs/adr/0070) : les favorites en accès rapide sur la carte, toutes les
 * formes dans un panneau avec recherche et filtre par FP.
 */
function FormPicker({
  character,
  onStart,
}: {
  character: Character;
  onStart: (formId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const forms = character.wildShapeForms ?? [];
  const favorites = forms.filter((form) => form.favorite).slice(0, QUICK_ACCESS);
  const unavailable = wildShapeUnavailableReason(character);

  return (
    <div className="grid gap-2">
      {favorites.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {favorites.map((form) => (
            <Button
              key={form.id}
              type="button"
              variant="outline"
              disabled={unavailable !== undefined}
              onClick={() => onStart(form.id)}
              aria-label={`Se transformer : ${form.name || "forme"}`}
              className="border-primary/40 hover:bg-primary/15 h-10 rounded-full pr-4 pl-3"
            >
              <PawPrint aria-hidden className="text-primary" />
              {form.name || "Forme sans nom"}
              {wildShapeFormWarnings(character, form).length > 0 && (
                <TriangleAlert aria-label="Hors limites" className="text-warning" />
              )}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Marquez vos formes préférées d’une étoile pour les avoir ici en un geste.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="justify-between"
        onClick={() => setOpen(true)}
      >
        Toutes les formes ({forms.length})
        <ChevronRight />
      </Button>
      {unavailable && <span className="text-muted-foreground text-xs">{unavailable}</span>}
      <AllFormsSheet
        character={character}
        open={open}
        onOpenChange={setOpen}
        disabledReason={unavailable}
        onStart={(formId) => {
          onStart(formId);
          setOpen(false);
        }}
      />
    </div>
  );
}

const ALL = "all";

function AllFormsSheet({
  character,
  open,
  onOpenChange,
  disabledReason,
  onStart,
}: {
  character: Character;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabledReason: string | undefined;
  onStart: (formId: string) => void;
}) {
  const { toggleWildShapeFavorite } = usePlayActions(character.id);
  const [query, setQuery] = useState("");
  const [challenge, setChallenge] = useState(ALL);
  const forms = [...(character.wildShapeForms ?? [])].sort(
    (a, b) =>
      (parseChallengeRating(a.challengeRating) ?? 0) -
        (parseChallengeRating(b.challengeRating) ?? 0) || a.name.localeCompare(b.name),
  );
  const challenges = [...new Set(forms.map((form) => form.challengeRating))];
  const search = normalizeLabel(query);
  const shown = forms.filter(
    (form) =>
      (challenge === ALL || form.challengeRating === challenge) &&
      (search === "" || normalizeLabel(form.name).includes(search)),
  );

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      themeId={character.themeId}
      eyebrow="Forme sauvage"
      title="Se transformer"
      tags={
        <div className="grid w-full gap-2">
          <div className="relative">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              aria-label="Rechercher une forme"
              placeholder="Rechercher…"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {challenges.length > 1 && (
            <SegmentedControl
              label="Facteur de puissance"
              options={[
                { value: ALL, label: "Tous" },
                ...challenges.map((value) => ({ value, label: `FP ${value}` })),
              ]}
              value={challenge}
              onValueChange={setChallenge}
            />
          )}
          {disabledReason && <p className="text-warning text-xs">{disabledReason}</p>}
        </div>
      }
    >
      {shown.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Aucune forme ne correspond.
        </p>
      ) : (
        <ul aria-label="Formes" className="grid gap-2.5 sm:grid-cols-2">
          {shown.map((form) => (
            <li key={form.id}>
              <FormCard
                character={character}
                form={form}
                disabled={disabledReason !== undefined}
                onStart={() => onStart(form.id)}
                onToggleFavorite={() => void toggleWildShapeFavorite(form.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </DetailSheet>
  );
}

function FormCard({
  character,
  form,
  disabled,
  onStart,
  onToggleFavorite,
}: {
  character: Character;
  form: BeastForm;
  disabled: boolean;
  onStart: () => void;
  onToggleFavorite: () => void;
}) {
  const warnings = wildShapeFormWarnings(character, form);
  const name = form.name || "Forme sans nom";
  return (
    <article
      aria-label={name}
      className="bg-background/60 grid h-full content-start gap-2 rounded-xl border p-3"
    >
      <header className="flex items-center gap-2">
        <PawPrint aria-hidden className="text-primary size-4 shrink-0" />
        <h3 className="min-w-0 flex-1 truncate font-medium">{name}</h3>
        <span className="text-muted-foreground shrink-0 text-xs">FP {form.challengeRating}</span>
        <button
          type="button"
          aria-pressed={form.favorite === true}
          aria-label={`Accès rapide : ${name}`}
          onClick={onToggleFavorite}
          className="focus-visible:ring-ring/50 hover:bg-primary/10 grid size-8 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-3"
        >
          <Star
            aria-hidden
            className={`size-4 ${form.favorite ? "fill-warning text-warning" : "text-muted-foreground"}`}
          />
        </button>
      </header>
      <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm tabular-nums">
        <span>
          <span className="text-muted-foreground text-xs">CA </span>
          <strong>{form.armorClass}</strong>
        </span>
        <span>
          <strong>{form.maxHitPoints}</strong>
          <span className="text-muted-foreground text-xs"> PV</span>
        </span>
        <span>{speedSummary(form)}</span>
      </p>
      {form.attacks.length > 0 && (
        <ul className="grid gap-0.5 text-[13px]">
          {beastAttacks(form).map((attack) => (
            <li key={attack.itemId}>
              <span className="font-medium">{attack.name || "Attaque"}</span>{" "}
              <span className="text-primary font-semibold tabular-nums">
                {formatModifier(attack.attackBonus)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · {attack.damage} {DAMAGE_TYPE_LABELS[attack.damageType]}
              </span>
            </li>
          ))}
        </ul>
      )}
      {form.notes && (
        <p className="text-muted-foreground line-clamp-2 text-xs" title={form.notes}>
          {form.notes}
        </p>
      )}
      {warnings.map((warning) => (
        <p key={warning} className="text-warning inline-flex items-start gap-1 text-xs">
          <TriangleAlert aria-hidden className="mt-0.5 size-3 shrink-0" />
          {warning}
        </p>
      ))}
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        onClick={onStart}
        aria-label={`Devenir : ${name}`}
        className="mt-auto justify-self-end"
      >
        Devenir
      </Button>
    </article>
  );
}

/** Ex : « 12 m · escalade 9 m ». */
function speedSummary(form: BeastForm): string {
  return [
    `${formatDecimal(form.speed)} m`,
    ...(form.climbSpeed ? [`escalade ${formatDecimal(form.climbSpeed)} m`] : []),
    ...(form.swimSpeed ? [`nage ${formatDecimal(form.swimSpeed)} m`] : []),
    ...(form.flySpeed ? [`vol ${formatDecimal(form.flySpeed)} m`] : []),
  ].join(" · ");
}
