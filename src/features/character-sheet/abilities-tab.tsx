"use client";

import { useId } from "react";
import type { AbilityName } from "@/domain/ability-scores";
import { ABILITY_NAMES } from "@/domain/ability-scores";
import { abilityModifier } from "@/domain/calculations/modifiers";
import { clampCharacterLevel, proficiencyBonusForLevel } from "@/domain/calculations/proficiency";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ABILITY_LABELS } from "./ability-labels";
import { formatModifier } from "./format";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AbilitiesTab({ draft, onChange }: CharacterTabProps) {
  const proficiencyBonus = proficiencyBonusForLevel(clampCharacterLevel(draft.level));

  return (
    <div className="grid gap-6">
      <p className="text-muted-foreground text-sm">
        Bonus de maîtrise (niveau {draft.level}) :{" "}
        <span className="text-foreground font-medium">{formatModifier(proficiencyBonus)}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {ABILITY_NAMES.map((ability) => (
          <AbilityRow
            key={ability}
            ability={ability}
            score={draft.abilityScores[ability]}
            proficient={draft.savingThrowProficiencies.includes(ability)}
            proficiencyBonus={proficiencyBonus}
            onScoreChange={(score) =>
              onChange({ abilityScores: { ...draft.abilityScores, [ability]: score } })
            }
            onProficiencyChange={(proficient) => {
              const next = proficient
                ? [...draft.savingThrowProficiencies, ability]
                : draft.savingThrowProficiencies.filter((existing) => existing !== ability);
              onChange({ savingThrowProficiencies: next });
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface AbilityRowProps {
  ability: AbilityName;
  score: number;
  proficient: boolean;
  proficiencyBonus: number;
  onScoreChange: (score: number) => void;
  onProficiencyChange: (proficient: boolean) => void;
}

function AbilityRow({
  ability,
  score,
  proficient,
  proficiencyBonus,
  onScoreChange,
  onProficiencyChange,
}: AbilityRowProps) {
  const scoreId = useId();
  const saveId = useId();
  const modifier = abilityModifier(score);
  const savingThrow = modifier + (proficient ? proficiencyBonus : 0);

  return (
    <div className="flex items-end gap-3 rounded-lg border p-3">
      <div className="grid flex-1 gap-2">
        <Label htmlFor={scoreId}>{ABILITY_LABELS[ability]}</Label>
        <Input
          id={scoreId}
          type="number"
          value={score}
          onChange={(event) => onScoreChange(toNumber(event.target.value))}
        />
      </div>
      <p className="text-muted-foreground w-12 text-center text-sm">{formatModifier(modifier)}</p>
      <div className="flex items-center gap-2">
        <Checkbox
          id={saveId}
          checked={proficient}
          onCheckedChange={(checked) => onProficiencyChange(checked === true)}
        />
        <Label htmlFor={saveId} className="text-muted-foreground text-xs">
          Sauv. {formatModifier(savingThrow)}
        </Label>
      </div>
    </div>
  );
}
