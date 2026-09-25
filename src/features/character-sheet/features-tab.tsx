"use client";

import { Check, ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { cn } from "cn";
import type { ClassResourceId } from "@/domain/character-class";
import { findClassDefinition, findSubclassDefinition } from "@/domain/character-class";
import { ruleClassResourceOptions } from "@/domain/calculations/class-features";
import type { ClassResourceState } from "@/domain/calculations/class-resources";
import { computeClassResources } from "@/domain/calculations/class-resources";
import { clampCharacterLevel } from "@/domain/calculations/proficiency";
import type { Character } from "@/domain/character";
import type { CharacterFeature, FeatureRecharge } from "@/domain/feature";
import { generateId } from "@/domain/id";
import { compareNames } from "@/domain/names";
import { findRaceDefinition } from "@/domain/race";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FEATURE_RECHARGE_LABELS, hasOwnUses } from "@/features/shared/feature";
import { SegmentedControl } from "@/features/shared/segmented-control";
import type { CharacterTabProps } from "./types";

const NO_SOURCE = "Sans source";
const NO_COUNTER = "none";
const OWN_COUNTER = "own";

const RECHARGE_OPTIONS = (Object.keys(FEATURE_RECHARGE_LABELS) as FeatureRecharge[]).map(
  (value) => ({ value, label: FEATURE_RECHARGE_LABELS[value] }),
);

/** Ce qu'on fige d'une capacité dépliée : ses nom et source à l'ouverture, pour qu'elle ne change
 * ni de groupe ni de place (et ne perde pas le focus) pendant qu'on les modifie. */
interface OpenFeature {
  id: string;
  name: string;
  source: string;
}

/**
 * Onglet Capacités de la configuration (docs/adr/0038) : les réserves de classe (ex : Canalisation
 * divine) et leurs options, puis les capacités groupées par source et triées par nom. Chaque
 * capacité tient sur une ligne résumée ; une seule se déplie à la fois pour être modifiée.
 */
export function FeaturesTab({ draft, onChange }: CharacterTabProps) {
  const [open, setOpen] = useState<OpenFeature | null>(null);
  const resources = computeClassResources(draft);

  const nameOf = (feature: CharacterFeature) =>
    feature.id === open?.id ? open.name : feature.name;
  const sourceOf = (feature: CharacterFeature) =>
    (feature.id === open?.id ? open.source : feature.source).trim() || NO_SOURCE;

  const sources = [...new Set(draft.features.map(sourceOf))].sort((a, b) =>
    a === NO_SOURCE ? 1 : b === NO_SOURCE ? -1 : compareNames(a, b),
  );

  function updateFeature(id: string, patch: Partial<CharacterFeature>) {
    onChange({
      features: draft.features.map((feature) =>
        feature.id === id ? { ...feature, ...patch } : feature,
      ),
    });
  }

  function toggleOpen(feature: CharacterFeature) {
    setOpen(
      open?.id === feature.id
        ? null
        : { id: feature.id, name: feature.name, source: feature.source },
    );
  }

  function addFeature() {
    const feature: CharacterFeature = { id: generateId(), name: "", source: "", description: "" };
    onChange({ features: [...draft.features, feature] });
    setOpen({ id: feature.id, name: "", source: "" });
  }

  return (
    <div className="grid gap-7 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <h3 className="font-heading text-xl font-semibold">Capacités</h3>
          <p className="text-muted-foreground text-sm">
            {draft.features.length} capacité{draft.features.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button type="button" size="lg" onClick={addFeature}>
          <Plus />
          Ajouter une capacité
        </Button>
      </div>

      {resources.map((resource) => (
        <ClassResourceCard
          key={resource.id}
          character={draft}
          resource={resource}
          onChange={onChange}
        />
      ))}

      {draft.features.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-center text-sm">
          Aucune capacité pour l&rsquo;instant.
        </p>
      ) : (
        sources.map((source) => {
          const features = draft.features
            .filter((feature) => sourceOf(feature) === source)
            .sort((a, b) => compareNames(nameOf(a), nameOf(b)));
          return (
            <section key={source} aria-label={source} className="grid gap-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                {source}
              </h4>
              {features.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  resourceNames={resources}
                  open={open?.id === feature.id}
                  onToggle={() => toggleOpen(feature)}
                >
                  <FeatureEditor
                    feature={feature}
                    character={draft}
                    resources={resources}
                    onChange={(patch) => updateFeature(feature.id, patch)}
                    onRemove={() => {
                      onChange({ features: draft.features.filter((f) => f.id !== feature.id) });
                      setOpen(null);
                    }}
                    onClose={() => setOpen(null)}
                  />
                </FeatureCard>
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}

/** Niveau auquel la réserve gagne une utilisation, s'il y en a un (ex : 2 au niveau 6). */
function nextIncrease(character: Character, resourceId: ClassResourceId, max: number) {
  const definition = findClassDefinition(character.classId)?.resources.find(
    (resource) => resource.id === resourceId,
  );
  if (!definition) {
    return undefined;
  }
  for (let level = clampCharacterLevel(character.level) + 1; level <= 20; level += 1) {
    const uses = definition.usesAtLevel(level);
    if (uses > max) {
      return { level, uses };
    }
  }
  return undefined;
}

/**
 * Réserve de classe calculée et ses options : celles des règles se retirent ou se rétablissent
 * par personnage (`removedClassResourceOptions`), celles de la fiche sont les capacités liées.
 */
function ClassResourceCard({
  character,
  resource,
  onChange,
}: {
  character: Character;
  resource: ClassResourceState;
  onChange: CharacterTabProps["onChange"];
}) {
  const titleId = useId();
  const optionsId = useId();
  const removed = character.removedClassResourceOptions ?? [];
  const next = nextIncrease(character, resource.id, resource.max);
  const linked = character.features.filter((feature) => feature.resourceId === resource.id);

  function toggleOption(optionId: string) {
    const nextRemoved = removed.includes(optionId)
      ? removed.filter((id) => id !== optionId)
      : [...removed, optionId];
    onChange({ removedClassResourceOptions: nextRemoved.length > 0 ? nextRemoved : undefined });
  }

  return (
    <section
      aria-labelledby={titleId}
      className="border-primary/35 bg-background/60 grid gap-3 rounded-2xl border p-4"
    >
      <div className="flex items-center gap-3.5">
        <span className="border-primary text-primary font-heading flex size-13 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold tabular-nums">
          {resource.max}
        </span>
        <div className="grid gap-0.5">
          <h4 id={titleId} className="font-heading text-lg font-semibold">
            {resource.name}
          </h4>
          <p className="text-muted-foreground text-xs">
            Réserve de classe · {resource.max} utilisation{resource.max > 1 ? "s" : ""} au niveau{" "}
            {clampCharacterLevel(character.level)}
            {next ? ` (${next.uses} au niveau ${next.level})` : ""} ·{" "}
            {FEATURE_RECHARGE_LABELS[resource.recharge].toLowerCase()}
          </p>
        </div>
      </div>
      <div role="group" aria-labelledby={optionsId} className="grid gap-1.5">
        <span
          id={optionsId}
          className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase"
        >
          Options qui la dépensent
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ruleClassResourceOptions(character, resource.id).map((option) => {
            const active = !removed.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleOption(option.id)}
                className={cn(
                  "focus-visible:ring-ring/50 flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-3",
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "text-muted-foreground hover:bg-muted/40 border-dashed",
                )}
              >
                {active && <Check className="text-primary size-3.5" aria-hidden />}
                {option.name}
                <span className="text-muted-foreground text-xs">
                  {active ? option.source : `Retirée · ${option.source}`}
                </span>
              </button>
            );
          })}
          {linked.map((feature) => (
            <span
              key={feature.id}
              className="flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm"
            >
              {feature.name || "Nouvelle capacité"}
              <span className="text-muted-foreground text-xs">ajoutée</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  resourceNames,
  open,
  onToggle,
  children,
}: {
  feature: CharacterFeature;
  resourceNames: readonly ClassResourceState[];
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panelId = useId();
  const resource = resourceNames.find((candidate) => candidate.id === feature.resourceId);

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        open ? "border-primary/50 bg-background/70" : "bg-background/35",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-xl py-2.5 pr-3 pl-3.5 text-left outline-none focus-visible:ring-3"
      >
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="text-[15px] font-medium">{feature.name || "Nouvelle capacité"}</span>
          <span className="text-muted-foreground truncate text-xs">
            {feature.description || "Pas encore de description"}
          </span>
        </span>
        {hasOwnUses(feature) && (
          <span className="border-primary/45 bg-primary/10 flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs">
            <span className="text-primary text-sm font-bold tabular-nums">{feature.usesMax}</span>
            {feature.recharge && feature.recharge !== "other"
              ? ` · ${FEATURE_RECHARGE_LABELS[feature.recharge].toLowerCase()}`
              : ""}
          </span>
        )}
        {resource && (
          <span className="border-primary/45 text-primary flex h-7 shrink-0 items-center rounded-full border px-2.5 text-xs">
            {resource.name}
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={cn(
            "text-muted-foreground size-4.5 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div id={panelId} className="border-t p-4">
          {children}
        </div>
      )}
    </div>
  );
}

/** Sources proposées en un clic : classe, sous-classe et race du personnage, puis « Don ». */
function sourceSuggestions(character: Character): string[] {
  const classDefinition = findClassDefinition(character.classId);
  const subclass = findSubclassDefinition(character.classId, character.subclassId);
  const race = character.raceSelection
    ? findRaceDefinition(character.raceSelection.raceId)
    : undefined;
  return [
    ...new Set(
      [
        classDefinition?.name ?? character.class,
        subclass?.name ?? character.subclass,
        race?.name ?? character.race,
        "Don",
      ]
        .map((source) => source?.trim())
        .filter((source): source is string => Boolean(source)),
    ),
  ];
}

function FeatureEditor({
  feature,
  character,
  resources,
  onChange,
  onRemove,
  onClose,
}: {
  feature: CharacterFeature;
  character: Character;
  resources: readonly ClassResourceState[];
  onChange: (patch: Partial<CharacterFeature>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const nameId = useId();
  const sourceId = useId();
  const descriptionId = useId();
  const own = hasOwnUses(feature);
  const mode = feature.resourceId ?? (own ? OWN_COUNTER : NO_COUNTER);
  const modeOptions = [
    { value: NO_COUNTER, label: "Sans compteur" },
    { value: OWN_COUNTER, label: "Compteur propre" },
    ...resources.map((resource) => ({ value: resource.id, label: resource.name })),
  ];

  function selectMode(value: string) {
    if (value === NO_COUNTER) {
      onChange({
        resourceId: undefined,
        usesMax: undefined,
        usesCurrent: undefined,
        recharge: undefined,
      });
    } else if (value === OWN_COUNTER) {
      const max = Math.max(1, feature.usesMax ?? 1);
      onChange({
        resourceId: undefined,
        usesMax: max,
        usesCurrent: max,
        recharge: feature.recharge ?? "longRest",
      });
    } else {
      onChange({
        resourceId: value as ClassResourceId,
        usesMax: undefined,
        usesCurrent: undefined,
        recharge: undefined,
      });
    }
  }

  /** Change le maximum : une réserve pleine le reste, sinon les utilisations restantes (gérées en
   * mode jeu) sont bornées au nouveau maximum. */
  function setMax(max: number) {
    const previous = feature.usesMax ?? 0;
    const current = feature.usesCurrent ?? previous;
    onChange({ usesMax: max, usesCurrent: current >= previous ? max : Math.min(current, max) });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom" htmlFor={nameId}>
          <Input
            id={nameId}
            placeholder="Nom de la capacité"
            className="font-medium"
            value={feature.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </Field>
        <Field label="Source" htmlFor={sourceId}>
          <Input
            id={sourceId}
            placeholder="Ex : Domaine du Crépuscule"
            value={feature.source}
            onChange={(event) => onChange({ source: event.target.value })}
          />
          <div className="flex flex-wrap gap-1">
            {sourceSuggestions(character).map((source) => (
              <button
                key={source}
                type="button"
                aria-pressed={feature.source === source}
                onClick={() => onChange({ source })}
                className={cn(
                  "focus-visible:ring-ring/50 h-7 rounded-full border px-2.5 text-xs transition-colors outline-none focus-visible:ring-3",
                  feature.source === source
                    ? "border-primary bg-primary/15"
                    : "text-muted-foreground hover:bg-muted/40",
                )}
              >
                {source}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Description" htmlFor={descriptionId}>
        <Textarea
          id={descriptionId}
          rows={4}
          placeholder="Ce que fait la capacité…"
          value={feature.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </Field>

      <div className="grid gap-1.5">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Utilisations
        </span>
        <SegmentedControl
          label="Utilisations"
          options={modeOptions}
          value={mode}
          onValueChange={selectMode}
        />
      </div>

      {own && (
        <div className="bg-card flex flex-wrap items-end gap-4 rounded-xl border p-3.5">
          <div className="grid gap-1.5">
            <span className="text-muted-foreground text-xs">Maximum</span>
            <div className="border-input flex h-11 items-center rounded-lg border">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="h-full rounded-r-none"
                aria-label="Une utilisation de moins"
                disabled={(feature.usesMax ?? 1) <= 1}
                onClick={() => setMax((feature.usesMax ?? 1) - 1)}
              >
                <Minus />
              </Button>
              <span className="font-heading text-primary min-w-8 text-center text-xl font-bold tabular-nums">
                {feature.usesMax}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="h-full rounded-l-none"
                aria-label="Une utilisation de plus"
                onClick={() => setMax((feature.usesMax ?? 0) + 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
          <div className="grid flex-1 gap-1.5">
            <span className="text-muted-foreground text-xs">Récupération</span>
            <SegmentedControl
              label="Récupération"
              options={RECHARGE_OPTIONS}
              value={feature.recharge ?? "longRest"}
              onValueChange={(recharge) => onChange({ recharge })}
            />
          </div>
        </div>
      )}

      {feature.resourceId && (
        <p className="border-primary/25 bg-primary/5 rounded-xl border px-3.5 py-3 text-sm">
          Chaque utilisation dépense une{" "}
          {resources.find((resource) => resource.id === feature.resourceId)?.name ??
            "utilisation de la réserve"}{" "}
          : pas de compteur propre.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="destructive" onClick={onRemove}>
          <Trash2 />
          Supprimer la capacité
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Replier
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
