"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "cn";
import type { AbilityName } from "@/domain/ability-scores";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { DEFAULT_SPEED } from "@/domain/calculations/combat-stats";
import { CHARACTER_CLASSES, findClassDefinition } from "@/domain/character-class";
import type { RaceDefinition } from "@/domain/race";
import { RACE_DEFINITIONS, findRaceDefinition } from "@/domain/race";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CharacterTabProps } from "./types";

/** Valeur des listes pour « hors registre » : le libellé se saisit alors en texte libre. */
const OTHER = "other";
const MIN_LEVEL = 1;
const MAX_LEVEL = 20;

const ABILITY_ORDER: AbilityName[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
}

/**
 * Identité (docs/adr/0035) : une seule liste par classe, sous-classe et race. Choisir une entrée
 * du registre règle l'id (règles appliquées) ET recopie son nom dans le libellé affiché ailleurs
 * (liste des personnages, en-tête du mode jeu) ; « Autre » retire l'id et ouvre le libellé en
 * texte libre.
 */
export function IdentitySection({ draft, onChange }: CharacterTabProps) {
  const nameId = useId();
  const levelId = useId();
  const classId = useId();
  const subclassId = useId();
  const raceId = useId();
  const backgroundId = useId();
  const baseSpeedId = useId();

  const classDefinition = findClassDefinition(draft.classId);
  const subclasses = classDefinition?.subclasses ?? [];
  const race = draft.raceSelection ? findRaceDefinition(draft.raceSelection.raceId) : undefined;
  const subclassKnown = subclasses.some((definition) => definition.id === draft.subclassId);

  function selectClass(value: string) {
    const definition = findClassDefinition(value === OTHER ? undefined : value);
    if (!definition) {
      onChange({ classId: undefined, subclassId: undefined });
      return;
    }
    onChange({
      classId: definition.id,
      class: definition.name,
      subclassId: undefined,
      subclass: undefined,
    });
  }

  function selectSubclass(value: string) {
    const definition = subclasses.find((item) => item.id === value);
    onChange(
      definition
        ? { subclassId: definition.id, subclass: definition.name }
        : { subclassId: undefined },
    );
  }

  function selectRace(value: string) {
    const definition = findRaceDefinition(value);
    onChange(
      definition
        ? {
            raceSelection: { raceId: definition.id, abilityBonusChoices: [] },
            race: definition.name,
          }
        : { raceSelection: undefined },
    );
  }

  return (
    <section id="general-identity" aria-label="Identité" className="grid scroll-mt-6 gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid min-w-56 flex-1 gap-1.5">
          <FieldLabel htmlFor={nameId}>Nom du personnage</FieldLabel>
          <Input
            id={nameId}
            className="font-heading h-14 rounded-xl px-4 text-2xl font-semibold md:text-2xl"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="grid justify-items-center gap-1.5">
          <FieldLabel htmlFor={levelId}>Niveau</FieldLabel>
          <div className="border-input dark:bg-input/30 flex h-14 items-center rounded-xl border">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="h-full w-11 rounded-r-none"
              aria-label="Baisser le niveau"
              disabled={draft.level <= MIN_LEVEL}
              onClick={() => onChange({ level: clampLevel(draft.level - 1) })}
            >
              <Minus />
            </Button>
            <input
              id={levelId}
              type="number"
              min={MIN_LEVEL}
              max={MAX_LEVEL}
              className="font-heading text-primary w-12 [appearance:textfield] bg-transparent text-center text-3xl font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none"
              value={draft.level}
              onChange={(event) => onChange({ level: clampLevel(toNumber(event.target.value)) })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="h-full w-11 rounded-l-none"
              aria-label="Monter le niveau"
              disabled={draft.level >= MAX_LEVEL}
              onClick={() => onChange({ level: clampLevel(draft.level + 1) })}
            >
              <Plus />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Classe" htmlFor={classId} known={classDefinition !== undefined}>
          <Select value={classDefinition?.id ?? OTHER} onValueChange={selectClass}>
            <SelectTrigger id={classId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHARACTER_CLASSES.map((definition) => (
                <SelectItem key={definition.id} value={definition.id}>
                  {definition.name}
                </SelectItem>
              ))}
              <SelectItem value={OTHER}>Autre (saisie libre)…</SelectItem>
            </SelectContent>
          </Select>
          {!classDefinition && (
            <Input
              aria-label="Nom de la classe"
              placeholder="Ex : Paladin"
              className="border-dashed"
              value={draft.class}
              onChange={(event) => onChange({ class: event.target.value })}
            />
          )}
        </Field>

        <Field
          label={classDefinition?.subclassLabel ?? "Sous-classe"}
          htmlFor={subclassId}
          known={subclassKnown}
        >
          {subclasses.length > 0 && (
            <Select
              value={(subclassKnown && draft.subclassId) || OTHER}
              onValueChange={selectSubclass}
            >
              <SelectTrigger id={subclassId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subclasses.map((definition) => (
                  <SelectItem key={definition.id} value={definition.id}>
                    {definition.name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>Autre (saisie libre)…</SelectItem>
              </SelectContent>
            </Select>
          )}
          {!subclassKnown && (
            <Input
              id={subclasses.length > 0 ? undefined : subclassId}
              aria-label={subclasses.length > 0 ? "Nom de la sous-classe" : undefined}
              placeholder="Ex : Serment de dévotion"
              className={cn(subclasses.length > 0 && "border-dashed")}
              value={draft.subclass ?? ""}
              onChange={(event) => onChange({ subclass: event.target.value || undefined })}
            />
          )}
        </Field>

        <Field label="Race" htmlFor={raceId} known={race !== undefined}>
          <Select value={race?.id ?? OTHER} onValueChange={selectRace}>
            <SelectTrigger id={raceId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RACE_DEFINITIONS.map((definition) => (
                <SelectItem key={definition.id} value={definition.id}>
                  {definition.name}
                </SelectItem>
              ))}
              <SelectItem value={OTHER}>Autre (saisie libre)…</SelectItem>
            </SelectContent>
          </Select>
          {!race && (
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
              <Input
                aria-label="Nom de la race"
                placeholder="Ex : Demi-elfe"
                className="border-dashed"
                value={draft.race ?? ""}
                onChange={(event) => onChange({ race: event.target.value || undefined })}
              />
              <Input
                id={baseSpeedId}
                aria-label="Vitesse de base (m)"
                type="number"
                placeholder={`${DEFAULT_SPEED} m`}
                className="border-dashed"
                value={draft.baseSpeed ?? ""}
                onChange={(event) =>
                  onChange({
                    baseSpeed: event.target.value ? toNumber(event.target.value) : undefined,
                  })
                }
              />
            </div>
          )}
        </Field>

        <Field label="Historique" htmlFor={backgroundId}>
          <Input
            id={backgroundId}
            placeholder="Ex : Acolyte"
            value={draft.background ?? ""}
            onChange={(event) => onChange({ background: event.target.value || undefined })}
          />
        </Field>
      </div>

      {race && <RaceBonusPanel draft={draft} onChange={onChange} race={race} />}
    </section>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
    >
      {children}
    </Label>
  );
}

/** Champ d'identité : libellé, pastille « Règles appliquées » / « Texte libre », contrôles. */
function Field({
  label,
  htmlFor,
  known,
  children,
}: {
  label: string;
  htmlFor: string;
  /** Absent pour un champ toujours libre (historique) : pas de pastille. */
  known?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {known !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              known ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {known ? "Règles appliquées" : "Texte libre"}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * Bonus raciaux en jetons (docs/adr/0035) : une race à bonus au choix rend les caractéristiques
 * cliquables (au-delà du nombre permis, le plus ancien choix cède sa place) ; les bonus fixes
 * sont affichés sans être modifiables. Les scores de base (onglet Caractéristiques) ne changent
 * pas, seul le score effectif, affiché ici, en tient compte.
 */
function RaceBonusPanel({ draft, onChange, race }: CharacterTabProps & { race: RaceDefinition }) {
  const titleId = useId();
  const choiceRule = race.abilityBonusRules.find((rule) => rule.type === "choice");
  const choices = draft.raceSelection?.abilityBonusChoices ?? [];
  const effective = effectiveAbilityScores(draft.abilityScores, draft.raceSelection);

  function toggle(ability: AbilityName) {
    if (!choiceRule || choiceRule.type !== "choice") {
      return;
    }
    const next = choices.includes(ability)
      ? choices.filter((item) => item !== ability)
      : [...choices, ability].slice(-choiceRule.count);
    onChange({ raceSelection: { raceId: race.id, abilityBonusChoices: next } });
  }

  const choice = choiceRule?.type === "choice" ? choiceRule : undefined;

  return (
    <div className="bg-background/60 grid gap-2.5 rounded-xl border p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span id={titleId} className="text-sm font-medium">
          {race.name} ·{" "}
          {choice
            ? `+${choice.amount} à ${choice.count} caractéristiques au choix`
            : "bonus de caractéristiques"}
        </span>
        {choice && (
          <span className="text-muted-foreground text-xs">
            {choices.length} / {choice.count} choisies
          </span>
        )}
      </div>
      <div role="group" aria-labelledby={titleId} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ABILITY_ORDER.map((ability) => {
          const base = draft.abilityScores[ability];
          const bonus = effective[ability] - base;
          const selected = choices.includes(ability);
          const content = (
            <>
              <span className="text-xs font-semibold tracking-wider uppercase">
                {ABILITY_LABELS[ability].slice(0, 3)}
              </span>
              <span className="text-sm tabular-nums">
                {bonus !== 0 ? `${base} → ${effective[ability]}` : base}
              </span>
            </>
          );
          const label = `${ABILITY_LABELS[ability]} ${base}${
            bonus !== 0 ? ` → ${effective[ability]} (${formatModifier(bonus)})` : ""
          }`;
          const chipClass = cn(
            "flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg border",
            bonus !== 0 ? "border-primary bg-primary/15 text-foreground" : "text-muted-foreground",
          );

          if (!choice) {
            return (
              <div key={ability} className={chipClass}>
                {content}
              </div>
            );
          }
          return (
            <button
              key={ability}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              disabled={choice.exclude?.includes(ability)}
              onClick={() => toggle(ability)}
              className={cn(
                chipClass,
                "focus-visible:ring-ring/50 outline-none focus-visible:ring-3 disabled:opacity-40",
                bonus === 0 && "hover:bg-muted/40",
              )}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
