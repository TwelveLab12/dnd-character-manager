"use client";

import { Minus, Plus, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "cn";
import type { AbilityName } from "@/domain/ability-scores";
import type { Character } from "@/domain/character";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { DEFAULT_SPEED } from "@/domain/calculations/combat-stats";
import { changeClass } from "@/domain/calculations/class-change";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import { changeRace } from "@/domain/calculations/race-change";
import type { CharacterClassDefinition } from "@/domain/character-class";
import {
  CHARACTER_CLASSES,
  findClassDefinition,
  findClassDefinitionByLabel,
} from "@/domain/character-class";
import type { RaceDefinition } from "@/domain/race";
import { RACE_DEFINITIONS, findRaceDefinition, findRaceDefinitionByLabel } from "@/domain/race";
import { ABILITY_LABELS, ABILITY_SHORT_LABELS } from "@/features/shared/ability-labels";
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

/** Bonus d'une race en clair : « +2 Cha, +1 Int », « +2 Cha, +1 à 2 caractéristiques au choix ». */
function describeRaceBonuses(race: RaceDefinition): string {
  return race.abilityBonusRules
    .map((rule) =>
      rule.type === "fixed"
        ? `+${rule.amount} ${ABILITY_SHORT_LABELS[rule.ability]}`
        : `+${rule.amount} à ${rule.count} caractéristiques au choix`,
    )
    .join(", ");
}

/** Règles d'une classe en clair : « d8, JS For et Dex, Ki ». */
function describeClass(definition: CharacterClassDefinition): string {
  const saves = definition.savingThrows
    .map((ability) => ABILITY_SHORT_LABELS[ability])
    .join(" et ");
  return [
    `dé de vie d${definition.hitDie}`,
    `jets de sauvegarde ${saves}`,
    ...definition.resources.map((resource) => resource.name),
    ...(definition.unarmoredDefense ? ["Défense sans armure"] : []),
    ...(definition.movementBonus ? [definition.movementBonus.name] : []),
    ...(definition.martialArts ? ["Arts martiaux"] : []),
  ].join(", ");
}

/** PV max qu'aurait le personnage avec cette classe, et l'écart avec les PV saisis s'il y en a un
 * (ex : un don Robuste coché, ignoré tant que les PV étaient saisis à la main). */
function describeComputedHitPoints(draft: Character, classId: string): string {
  const computed = computeMaxHitPoints({ ...draft, classId }).total;
  return draft.baseMaxHitPoints !== undefined && draft.baseMaxHitPoints !== computed
    ? `${computed} (${draft.baseMaxHitPoints} saisis)`
    : String(computed);
}

function formatSpeed(meters: number): string {
  return `${String(meters).replace(".", ",")} m`;
}

/** Vitesse en mètres : accepte les décimales (7,5 m). */
function toMeters(value: string): number {
  const parsed = Number.parseFloat(value);
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
  const raceNameId = useId();
  const baseSpeedId = useId();

  const classDefinition = findClassDefinition(draft.classId);
  // Classe saisie en texte libre mais connue des règles (ex : personnage importé) : proposée.
  const recognizedClass = classDefinition ? undefined : findClassDefinitionByLabel(draft.class);
  const subclasses = classDefinition?.subclasses ?? [];
  const race = draft.raceSelection ? findRaceDefinition(draft.raceSelection.raceId) : undefined;
  // Race saisie en texte libre mais connue des règles (ex : personnage importé) : proposée.
  const recognizedRace = race ? undefined : findRaceDefinitionByLabel(draft.race);
  const subclassKnown = subclasses.some((definition) => definition.id === draft.subclassId);

  function selectClass(value: string) {
    onChange(changeClass(draft, value === OTHER ? undefined : value));
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
    onChange(changeRace(draft, value === OTHER ? undefined : value));
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
          {recognizedClass && (
            <RulesCallout
              buttonLabel="Appliquer les règles de la classe"
              onApply={() => onChange(changeClass(draft, recognizedClass.id))}
            >
              <strong className="font-semibold">{recognizedClass.name}</strong> est connu des règles
              : {describeClass(recognizedClass)}. PV max calculés :{" "}
              {describeComputedHitPoints(draft, recognizedClass.id)}. Les valeurs saisies à la main
              qu&rsquo;elles remplacent sont retirées, sans rien compter deux fois.
            </RulesCallout>
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
              <div className="grid gap-1">
                <Label htmlFor={raceNameId} className="text-muted-foreground text-xs font-normal">
                  Nom de la race
                </Label>
                <Input
                  id={raceNameId}
                  placeholder="Ex : Elfe des bois"
                  className="border-dashed"
                  value={draft.race ?? ""}
                  onChange={(event) => onChange({ race: event.target.value || undefined })}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={baseSpeedId} className="text-muted-foreground text-xs font-normal">
                  Vitesse (m)
                </Label>
                <Input
                  id={baseSpeedId}
                  type="number"
                  step={1.5}
                  placeholder={String(DEFAULT_SPEED)}
                  className="border-dashed"
                  value={draft.baseSpeed ?? ""}
                  onChange={(event) =>
                    onChange({
                      baseSpeed: event.target.value ? toMeters(event.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          )}
          {recognizedRace && (
            <RulesCallout
              buttonLabel="Appliquer les règles de la race"
              onApply={() => onChange(changeRace(draft, recognizedRace.id))}
            >
              <strong className="font-semibold">{recognizedRace.name}</strong> est connu des règles
              : {describeRaceBonuses(recognizedRace)}, vitesse {formatSpeed(recognizedRace.speed)}.
              Les scores actuels du personnage ne changent pas.
            </RulesCallout>
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

/** Encart « connu des règles » sous un champ en texte libre (docs/adr/0051, 0052). */
function RulesCallout({
  buttonLabel,
  onApply,
  children,
}: {
  buttonLabel: string;
  onApply: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-primary/40 bg-primary/10 grid gap-2 rounded-xl border p-3">
      <p className="flex gap-2 text-sm">
        <Sparkles aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
        <span>{children}</span>
      </p>
      <Button type="button" size="sm" className="justify-self-start" onClick={onApply}>
        {buttonLabel}
      </Button>
    </div>
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
          {race.name} · {describeRaceBonuses(race)} · vitesse {formatSpeed(race.speed)}
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
