"use client";

import { useId } from "react";
import type { AbilityName } from "@/domain/ability-scores";
import type { Character } from "@/domain/character";
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
  const hpMaxId = useId();
  const hpTempId = useId();
  const initiativeId = useId();
  const speedId = useId();
  const meleeId = useId();
  const rangedId = useId();
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

      <RaceBonusSection draft={draft} onChange={onChange} />

      <div className="grid gap-4 sm:grid-cols-3">
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
          <Label htmlFor={hpMaxId}>PV max</Label>
          <Input
            id={hpMaxId}
            type="number"
            value={draft.hitPoints.max}
            onChange={(event) =>
              onChange({ hitPoints: { ...draft.hitPoints, max: toNumber(event.target.value) } })
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

      <ArmorClassSection draft={draft} onChange={onChange} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={initiativeId}>Bonus d&rsquo;initiative</Label>
          <Input
            id={initiativeId}
            type="number"
            value={draft.initiativeBonus}
            onChange={(event) => onChange({ initiativeBonus: toNumber(event.target.value) })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={speedId}>Vitesse (m)</Label>
          <Input
            id={speedId}
            type="number"
            value={draft.speed}
            onChange={(event) => onChange({ speed: toNumber(event.target.value) })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={meleeId}>Bonus d&rsquo;attaque en mêlée</Label>
          <Input
            id={meleeId}
            type="number"
            value={draft.meleeAttackBonus ?? ""}
            onChange={(event) =>
              onChange({
                meleeAttackBonus: event.target.value ? toNumber(event.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={rangedId}>Bonus d&rsquo;attaque à distance</Label>
          <Input
            id={rangedId}
            type="number"
            value={draft.rangedAttackBonus ?? ""}
            onChange={(event) =>
              onChange({
                rangedAttackBonus: event.target.value ? toNumber(event.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

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
