"use client";

import { Hourglass, Moon, Sun } from "lucide-react";
import { DetailsHint } from "@/features/shared/detail-sheet";
import type { Character } from "@/domain/character";
import type { ClassResourceId } from "@/domain/character-class";
import { findClassDefinition, normalizeLabel } from "@/domain/character-class";
import { computeClassResourceOptions } from "@/domain/calculations/class-features";
import type { ClassResourceState } from "@/domain/calculations/class-resources";
import { computeClassResources } from "@/domain/calculations/class-resources";
import { Button } from "@/components/ui/button";
import { usePlayActions } from "./use-play-actions";

export interface ResourceOptionView {
  key: string;
  name: string;
  source: string;
  /** Texte saisi sur la fiche : celui de la capacité liée, ou pour une option des règles (qui n'en
   * reproduisent aucun, docs/adr/0028) celui d'une capacité de même nom. */
  description: string;
  /** Option accordée par les règles (pas une capacité de la fiche). */
  fromRules: boolean;
}

/**
 * Options de la réserve : celles accordées par les règles au niveau actuel (classe, sous-classe),
 * puis les capacités de la fiche liées à la ressource qui n'en sont pas un doublon (même nom).
 */
export function resourceOptions(
  character: Character,
  resourceId: ClassResourceId,
): ResourceOptionView[] {
  const fromRules = computeClassResourceOptions(character, resourceId).map((option) => ({
    key: option.id,
    name: option.name,
    source: option.source,
    description:
      character.features.find(
        (feature) => normalizeLabel(feature.name) === normalizeLabel(option.name),
      )?.description ?? "",
    fromRules: true,
  }));
  const ruleNames = new Set(fromRules.map((option) => normalizeLabel(option.name)));
  const fromFeatures = character.features
    .filter(
      (feature) =>
        feature.resourceId === resourceId && !ruleNames.has(normalizeLabel(feature.name)),
    )
    .map((feature) => ({
      key: feature.id,
      name: feature.name,
      source: feature.source,
      description: feature.description,
      fromRules: false,
    }));
  return [...fromRules, ...fromFeatures];
}

export const RECHARGE_LABELS = { shortRest: "Repos court", longRest: "Repos long" } as const;

/** Une carte par ressource de classe (ex : Canalisation divine du Clerc) — voir docs/adr/0022. */
export function ClassResourceCards({
  character,
  onShowOption,
}: {
  character: Character;
  /** Ouvre le panneau de détail d'une option (docs/adr/0042). */
  onShowOption: (resourceId: ClassResourceId, optionKey: string) => void;
}) {
  const resources = computeClassResources(character);
  const classLabel = findClassDefinition(character.classId)?.name;
  if (resources.length === 0 || !classLabel) {
    return null;
  }

  return resources.map((resource) => (
    <ClassResourceCard
      key={resource.id}
      character={character}
      classLabel={classLabel}
      resource={resource}
      onShowOption={(optionKey) => onShowOption(resource.id, optionKey)}
    />
  ));
}

/**
 * Réserve d'une ressource de classe : un médaillon par utilisation (allumé si disponible, éteint
 * si dépensée — toucher un médaillon dépense ou récupère une utilisation), puis ses options (règles
 * et capacités liées) : la ligne ouvre le détail de l'option, son bouton « Utiliser » dépense la
 * réserve (docs/adr/0042).
 */
function ClassResourceCard({
  character,
  classLabel,
  resource,
  onShowOption,
}: {
  character: Character;
  classLabel: string;
  resource: ClassResourceState;
  onShowOption: (optionKey: string) => void;
}) {
  const { adjustClassResource } = usePlayActions(character.id);
  const options = resourceOptions(character, resource.id);
  const RechargeIcon = resource.recharge === "shortRest" ? Hourglass : Moon;
  const exhausted = resource.remaining <= 0;

  return (
    <section
      aria-label={resource.name}
      className="border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-2xl border px-3.5 py-4 sm:px-4.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
            {classLabel}
          </span>
          <span className="text-primary inline-flex items-center gap-1.5 text-[13px] font-semibold">
            <Sun aria-hidden className="size-4" />
            {resource.name}
          </span>
        </div>
        <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap">
          <RechargeIcon aria-hidden className="size-3" />
          {RECHARGE_LABELS[resource.recharge]}
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: resource.max }, (_, index) => {
            const lit = index < resource.remaining;
            return (
              <button
                key={index}
                type="button"
                onClick={() => void adjustClassResource(resource.id, lit ? 1 : -1)}
                aria-label={lit ? `Dépenser : ${resource.name}` : `Récupérer : ${resource.name}`}
                className={`focus-visible:ring-ring/50 grid size-14 place-items-center rounded-full border-2 transition-all duration-300 outline-none focus-visible:ring-3 ${
                  lit
                    ? "border-primary bg-primary/15 text-primary shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                    : "border-muted-foreground/40 text-muted-foreground/50 border-dashed"
                }`}
              >
                <Sun aria-hidden className="size-7" />
              </button>
            );
          })}
        </div>
        <div className="grid gap-0.5">
          <span className="font-heading text-xl font-bold tabular-nums">
            {resource.remaining}
            <span className="text-muted-foreground text-sm font-medium"> / {resource.max}</span>
          </span>
          <span className="text-muted-foreground text-xs">
            {exhausted
              ? `Revient au prochain ${RECHARGE_LABELS[resource.recharge].toLowerCase()}`
              : options.length > 0
                ? "Choisis un effet ci-dessous"
                : "Utilisation disponible"}
          </span>
        </div>
      </div>

      {options.length > 0 && (
        <div className="grid gap-1.5">
          {options.map((option) => (
            <div
              key={option.key}
              className="border-primary/30 bg-card relative flex min-h-11 items-center gap-2.5 rounded-xl border py-1.5 pr-1.5 pl-3"
            >
              <button
                type="button"
                aria-label={`Détails : ${option.name}`}
                onClick={() => onShowOption(option.key)}
                className="hover:bg-primary/10 focus-visible:ring-ring/50 absolute inset-0 cursor-pointer rounded-xl transition-colors outline-none focus-visible:ring-3"
              />
              <span className="bg-primary/10 text-primary grid size-7.5 shrink-0 place-items-center rounded-lg">
                <Sun aria-hidden className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1 gap-px">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[13px] font-medium">{option.name}</span>
                  <DetailsHint className="size-3.5" />
                </span>
                {option.source && (
                  <span className="text-muted-foreground truncate text-[11px]">
                    {option.source}
                  </span>
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={exhausted}
                onClick={() => void adjustClassResource(resource.id, 1)}
                aria-label={`Utiliser ${option.name}`}
                className="text-primary hover:text-primary hover:bg-primary/15 relative z-10 h-9 text-[11px] font-semibold tracking-[0.06em] uppercase"
              >
                Utiliser
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
