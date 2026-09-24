"use client";

import { useId } from "react";
import type { AbilityName } from "@/domain/ability-scores";
import type { Character, HitPointMethod } from "@/domain/character";
import { computeMaxHitPoints, fixedHitDieValue } from "@/domain/calculations/max-hit-points";
import { CHARACTER_CLASSES, findClassDefinition } from "@/domain/character-class";
import type { StatPart } from "@/domain/calculations/combat-stats";
import { computeInitiative, computeSpeed, DEFAULT_SPEED } from "@/domain/calculations/combat-stats";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import type { RaceSelection } from "@/domain/race";
import { RACE_DEFINITIONS, findRaceDefinition } from "@/domain/race";
import { CHARACTER_THEMES } from "@/features/character-theme/theme-registry";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArmorClassSection } from "./armor-class-section";
import { AttacksSection } from "./attacks-section";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function GeneralTab({ draft, onChange }: CharacterTabProps) {
  const nameId = useId();
  const classId = useId();
  const subclassId = useId();
  const raceId = useId();
  const backgroundId = useId();
  const levelId = useId();
  const hpCurrentId = useId();
  const hpTempId = useId();
  const notesId = useId();

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={nameId}>Nom</Label>
          <Input
            id={nameId}
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={levelId}>Niveau</Label>
          <Input
            id={levelId}
            type="number"
            min={1}
            max={20}
            value={draft.level}
            onChange={(event) => onChange({ level: toNumber(event.target.value) })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={classId}>Classe</Label>
          <Input
            id={classId}
            value={draft.class}
            onChange={(event) => onChange({ class: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={subclassId}>Sous-classe</Label>
          <Input
            id={subclassId}
            value={draft.subclass ?? ""}
            onChange={(event) => onChange({ subclass: event.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={raceId}>Race</Label>
          <Input
            id={raceId}
            value={draft.race ?? ""}
            onChange={(event) => onChange({ race: event.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={backgroundId}>Historique</Label>
          <Input
            id={backgroundId}
            value={draft.background ?? ""}
            onChange={(event) => onChange({ background: event.target.value || undefined })}
          />
        </div>
      </div>

      <ClassRulesSection draft={draft} onChange={onChange} />

      <RaceBonusSection draft={draft} onChange={onChange} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={hpCurrentId}>PV actuels</Label>
          <Input
            id={hpCurrentId}
            type="number"
            value={draft.hitPoints.current}
            onChange={(event) =>
              onChange({ hitPoints: { ...draft.hitPoints, current: toNumber(event.target.value) } })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={hpTempId}>PV temporaires</Label>
          <Input
            id={hpTempId}
            type="number"
            value={draft.hitPoints.temporary}
            onChange={(event) =>
              onChange({
                hitPoints: { ...draft.hitPoints, temporary: toNumber(event.target.value) },
              })
            }
          />
        </div>
      </div>

      <MaxHitPointsSection draft={draft} onChange={onChange} />

      <ArmorClassSection draft={draft} onChange={onChange} />

      <InitiativeAndSpeedSection draft={draft} onChange={onChange} />

      <AttacksSection draft={draft} onChange={onChange} />

      <ThemeSection draft={draft} onChange={onChange} />

      <div className="grid gap-2">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea
          id={notesId}
          value={draft.notes ?? ""}
          onChange={(event) => onChange({ notes: event.target.value || undefined })}
          rows={4}
        />
      </div>
    </div>
  );
}

/**
 * Classe et sous-classe connues des règles (src/domain/character-class.ts, src/domain/subclass.ts) :
 * elles déterminent les valeurs calculées (emplacements, Canalisation divine et ses options,
 * caractéristique d'incantation, sorts toujours préparés, maîtrises). Éditent `classId` et
 * `subclassId`, indépendants des libellés libres `class` et `subclass` ci-dessus.
 */
function ClassRulesSection({ draft, onChange }: CharacterTabProps) {
  const classSelectId = useId();
  const subclassSelectId = useId();
  const classDefinition = findClassDefinition(draft.classId);
  const subclasses = classDefinition?.subclasses ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={classSelectId}>Classe (règles appliquées)</Label>
        <Select
          value={draft.classId ?? "none"}
          onValueChange={(value) =>
            onChange({ classId: value === "none" ? undefined : value, subclassId: undefined })
          }
        >
          <SelectTrigger id={classSelectId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune / non gérée</SelectItem>
            {CHARACTER_CLASSES.map((definition) => (
              <SelectItem key={definition.id} value={definition.id}>
                {definition.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {subclasses.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor={subclassSelectId}>
            {classDefinition?.subclassLabel ?? "Sous-classe"} (règles appliquées)
          </Label>
          <Select
            value={draft.subclassId ?? "none"}
            onValueChange={(value) =>
              onChange({ subclassId: value === "none" ? undefined : value })
            }
          >
            <SelectTrigger id={subclassSelectId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun / non géré</SelectItem>
              {subclasses.map((definition) => (
                <SelectItem key={definition.id} value={definition.id}>
                  {definition.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

/**
 * PV max calculés (docs/adr/0027) : valeur fixe par défaut (moitié du dé de vie + 1 par niveau
 * après le 1er), ou dés lancés — seul le résultat du dé se saisit alors, niveau par niveau ; le
 * maximum du 1er niveau et la Constitution restent automatiques.
 */
function MaxHitPointsSection({ draft, onChange }: CharacterTabProps) {
  const methodId = useId();
  const manualId = useId();
  const result = computeMaxHitPoints(draft);

  if (result.method === "manual" || result.hitDie === undefined) {
    return (
      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor={manualId}>PV max</Label>
        <Input
          id={manualId}
          type="number"
          min={1}
          value={draft.baseMaxHitPoints ?? ""}
          onChange={(event) =>
            onChange({
              baseMaxHitPoints: event.target.value ? toNumber(event.target.value) : undefined,
            })
          }
        />
        <p className="text-muted-foreground text-xs">
          Choisis une classe gérée ci-dessus pour que les PV max soient calculés.
        </p>
      </div>
    );
  }

  const hitDie = result.hitDie;
  const rolls = draft.hitPointRolls ?? [];

  function setRoll(level: number, value: number | undefined) {
    const next = [...rolls];
    next[level - 2] = value as number;
    onChange({ hitPointRolls: next });
  }

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <span className="text-sm font-medium">PV max — {result.total}</span>
          <span className="text-muted-foreground text-xs">
            Dé de vie d{hitDie}, Constitution appliquée à chaque niveau
          </span>
        </div>
        <div className="grid gap-1 sm:w-64">
          <Label htmlFor={methodId} className="text-muted-foreground text-xs">
            Gain de PV à chaque niveau
          </Label>
          <Select
            value={result.method}
            onValueChange={(value) => onChange({ hitPointMethod: value as HitPointMethod })}
          >
            <SelectTrigger id={methodId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Valeur fixe ({fixedHitDieValue(hitDie)} + Con)</SelectItem>
              <SelectItem value="rolled">Dés lancés (d{hitDie} + Con)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ul className="grid gap-1.5 text-sm">
        {result.levels.map((entry) => (
          <li key={entry.level} className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground w-14">Niv. {entry.level}</span>
            {entry.level === 1 || result.method === "fixed" ? (
              <span className="tabular-nums">{entry.die}</span>
            ) : (
              <Input
                type="number"
                min={1}
                max={hitDie}
                aria-label={`Résultat du d${hitDie} au niveau ${entry.level}`}
                placeholder={String(fixedHitDieValue(hitDie))}
                className="h-8 w-16"
                value={rolls[entry.level - 2] ?? ""}
                onChange={(event) =>
                  setRoll(
                    entry.level,
                    event.target.value ? toNumber(event.target.value) : undefined,
                  )
                }
              />
            )}
            <span className="text-muted-foreground tabular-nums">
              {formatModifier(entry.constitution)} Con = {entry.total}
            </span>
            {entry.level === 1 && (
              <span className="text-muted-foreground text-xs">(maximum du dé)</span>
            )}
          </li>
        ))}
      </ul>

      {result.warnings.length > 0 && (
        <ul className="text-warning grid gap-1 text-xs">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatBreakdown(parts: readonly StatPart[], unit = ""): string {
  return parts
    .map((part, index) =>
      index === 0
        ? `${part.label} ${part.value}${unit}`
        : `${part.label} ${formatModifier(part.value)}${unit}`,
    )
    .join(" ");
}

/**
 * Initiative et vitesse calculées (docs/adr/0026) : seuls un bonus d'initiative hors Dextérité et,
 * pour une race hors registre, une vitesse de base se saisissent ici.
 */
function InitiativeAndSpeedSection({ draft, onChange }: CharacterTabProps) {
  const extraId = useId();
  const baseSpeedId = useId();
  const initiative = computeInitiative(draft);
  const speed = computeSpeed(draft);
  const raceKnown = draft.raceSelection
    ? findRaceDefinition(draft.raceSelection.raceId) !== undefined
    : false;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={extraId}>
          Initiative — {formatModifier(initiative.total)}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            (Dex {formatModifier(initiative.breakdown[0]?.value ?? 0)} + bonus)
          </span>
        </Label>
        <Input
          id={extraId}
          type="number"
          placeholder="Bonus hors Dextérité (ex : don Vigilant)"
          value={draft.initiativeExtraBonus ?? ""}
          onChange={(event) =>
            onChange({
              initiativeExtraBonus: event.target.value ? toNumber(event.target.value) : undefined,
            })
          }
        />
      </div>
      <div className="grid gap-2">
        {raceKnown ? (
          <>
            <span className="text-sm font-medium">Vitesse — {speed.total} m</span>
            <p className="text-muted-foreground text-xs">
              Calculée : {formatBreakdown(speed.breakdown, " m")}
            </p>
          </>
        ) : (
          <>
            <Label htmlFor={baseSpeedId}>Vitesse — {speed.total} m</Label>
            <Input
              id={baseSpeedId}
              type="number"
              placeholder={`Vitesse de base (${DEFAULT_SPEED} m par défaut)`}
              value={draft.baseSpeed ?? ""}
              onChange={(event) =>
                onChange({
                  baseSpeed: event.target.value ? toNumber(event.target.value) : undefined,
                })
              }
            />
            <p className="text-muted-foreground text-xs">
              Choisis une race gérée ci-dessus pour que la vitesse soit calculée.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ThemeSection({ draft, onChange }: CharacterTabProps) {
  const selectId = useId();

  return (
    <div className="grid gap-2 sm:max-w-xs">
      <Label htmlFor={selectId}>Thème visuel</Label>
      <Select
        value={draft.themeId ?? "none"}
        onValueChange={(value) => onChange({ themeId: value === "none" ? undefined : value })}
      >
        <SelectTrigger id={selectId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Aucun / thème par défaut</SelectItem>
          {CHARACTER_THEMES.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              {theme.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Bonus de caractéristiques liés à la race — voir src/domain/race.ts. Édite `raceSelection`
 * (indépendant du champ `race` texte libre ci-dessus) ; les scores de base saisis dans l'onglet
 * Caractéristiques ne changent pas, seul le score EFFECTIF (affiché ici en aperçu) en tient compte.
 */
function RaceBonusSection({ draft, onChange }: CharacterTabProps) {
  const selectId = useId();
  const race = draft.raceSelection ? findRaceDefinition(draft.raceSelection.raceId) : undefined;
  const choiceRule = race?.abilityBonusRules.find((rule) => rule.type === "choice");
  const choices = draft.raceSelection?.abilityBonusChoices ?? [];

  function selectRace(raceId: string) {
    if (raceId === "none") {
      onChange({ raceSelection: undefined });
      return;
    }
    onChange({ raceSelection: { raceId, abilityBonusChoices: [] } });
  }

  function selectChoice(index: number, ability: AbilityName) {
    const raceId = draft.raceSelection?.raceId;
    if (!raceId) {
      return;
    }
    const next = [...choices];
    next[index] = ability;
    onChange({ raceSelection: { raceId, abilityBonusChoices: next } });
  }

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor={selectId}>Race (bonus de caractéristiques)</Label>
        <Select value={draft.raceSelection?.raceId ?? "none"} onValueChange={selectRace}>
          <SelectTrigger id={selectId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune / non renseignée</SelectItem>
            {RACE_DEFINITIONS.map((definition) => (
              <SelectItem key={definition.id} value={definition.id}>
                {definition.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {choiceRule && choiceRule.type === "choice" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: choiceRule.count }, (_, index) => (
            <AbilityChoiceSelect
              key={index}
              index={index}
              value={choices[index]}
              excluded={choiceRule.exclude ?? []}
              taken={choices.filter((_, otherIndex) => otherIndex !== index)}
              onSelect={(ability) => selectChoice(index, ability)}
            />
          ))}
        </div>
      )}

      {draft.raceSelection && (
        <RaceBonusPreview abilityScores={draft.abilityScores} raceSelection={draft.raceSelection} />
      )}
    </div>
  );
}

const ABILITY_NAMES_LIST: AbilityName[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

function AbilityChoiceSelect({
  index,
  value,
  excluded,
  taken,
  onSelect,
}: {
  index: number;
  value: AbilityName | undefined;
  excluded: AbilityName[];
  taken: AbilityName[];
  onSelect: (ability: AbilityName) => void;
}) {
  const selectId = useId();
  const options = ABILITY_NAMES_LIST.filter(
    (ability) => !excluded.includes(ability) && (ability === value || !taken.includes(ability)),
  );

  return (
    <div className="grid gap-1">
      <Label htmlFor={selectId} className="text-muted-foreground text-xs">
        Choix {index + 1}
      </Label>
      <Select value={value ?? ""} onValueChange={(next) => onSelect(next as AbilityName)}>
        <SelectTrigger id={selectId}>
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((ability) => (
            <SelectItem key={ability} value={ability}>
              {ABILITY_LABELS[ability]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RaceBonusPreview({
  abilityScores,
  raceSelection,
}: {
  abilityScores: Character["abilityScores"];
  raceSelection: RaceSelection;
}) {
  const effective = effectiveAbilityScores(abilityScores, raceSelection);
  const changed = ABILITY_NAMES_LIST.filter(
    (ability) => effective[ability] !== abilityScores[ability],
  );

  if (changed.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        Sélectionnez les caractéristiques à bonifier ci-dessus.
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-xs">
      Scores effectifs (base + race) :{" "}
      {changed
        .map(
          (ability) =>
            `${ABILITY_LABELS[ability]} ${abilityScores[ability]} → ${effective[ability]} (${formatModifier(
              effective[ability] - abilityScores[ability],
            )})`,
        )
        .join(", ")}
    </p>
  );
}
