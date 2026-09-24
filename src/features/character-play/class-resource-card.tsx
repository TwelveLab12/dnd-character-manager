"use client";

import { Hourglass, Moon, Sun } from "lucide-react";
import type { Character } from "@/domain/character";
import type { ClassResourceId } from "@/domain/character-class";
import { findClassDefinition, normalizeLabel } from "@/domain/character-class";
import { computeClassResourceOptions } from "@/domain/calculations/class-features";
import type { ClassResourceState } from "@/domain/calculations/class-resources";
import { computeClassResources } from "@/domain/calculations/class-resources";
import { usePlayActions } from "./use-play-actions";

interface ResourceOptionView {
  key: string;
  name: string;
  source: string;
}

/**
 * Options de la réserve : celles accordées par les règles au niveau actuel (classe, sous-classe),
 * puis les capacités de la fiche liées à la ressource qui n'en sont pas un doublon (même nom).
 */
function resourceOptions(character: Character, resourceId: ClassResourceId): ResourceOptionView[] {
  const fromRules = computeClassResourceOptions(character, resourceId).map((option) => ({
    key: option.id,
    name: option.name,
    source: option.source,
  }));
  const ruleNames = new Set(fromRules.map((option) => normalizeLabel(option.name)));
  const fromFeatures = character.features
    .filter(
      (feature) =>
        feature.resourceId === resourceId && !ruleNames.has(normalizeLabel(feature.name)),
    )
    .map((feature) => ({ key: feature.id, name: feature.name, source: feature.source }));
  return [...fromRules, ...fromFeatures];
}

const RECHARGE_LABELS = { shortRest: "Repos court", longRest: "Repos long" } as const;

/** Une carte par ressource de classe (ex : Canalisation divine du Clerc) — voir docs/adr/0022. */
export function ClassResourceCards({ character }: { character: Character }) {
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
    />
  ));
}

/**
 * Réserve d'une ressource de classe : un médaillon par utilisation (allumé si disponible, éteint
 * si dépensée — toucher un médaillon dépense ou récupère une utilisation), puis ses options (règles
 * et capacités liées), chacune avec son bouton « Utiliser ».
 */
function ClassResourceCard({
  character,
  classLabel,
  resource,
}: {
  character: Character;
  classLabel: string;
  resource: ClassResourceState;
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
          {options.map((feature) => (
            <button
              key={feature.key}
              type="button"
              disabled={exhausted}
              onClick={() => void adjustClassResource(resource.id, 1)}
              aria-label={`Utiliser ${feature.name}`}
              className="border-primary/30 bg-card hover:bg-primary/10 focus-visible:ring-ring/50 disabled:hover:bg-card flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="bg-primary/10 text-primary grid size-7.5 shrink-0 place-items-center rounded-lg">
                <Sun aria-hidden className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1 gap-px">
                <span className="truncate text-[13px] font-medium">{feature.name}</span>
                {feature.source && (
                  <span className="text-muted-foreground truncate text-[11px]">
                    {feature.source}
                  </span>
                )}
              </span>
              <span className="text-primary text-[11px] font-semibold tracking-[0.06em] uppercase">
                Utiliser
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
