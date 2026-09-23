"use client";

import { useId } from "react";
import type { AbilityName } from "@/domain/ability-scores";
import { ABILITY_NAMES } from "@/domain/ability-scores";
import { abilityModifier } from "@/domain/calculations/modifiers";
import { clampCharacterLevel, proficiencyBonusForLevel } from "@/domain/calculations/proficiency";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { ABILITY_LABELS, ABILITY_SHORT_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import type { SkillDefinition } from "@/features/shared/skills";
import { SKILL_DEFINITIONS } from "@/features/shared/skills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "@/components/ui/section-title";
import { Switch } from "@/components/ui/switch";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AbilitiesTab({ draft, onChange }: CharacterTabProps) {
  const proficiencyBonus = proficiencyBonusForLevel(clampCharacterLevel(draft.level));
  const effectiveScores = effectiveAbilityScores(draft.abilityScores, draft.raceSelection);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <p className="text-muted-foreground text-sm">
          Bonus de maîtrise (niveau {draft.level}) :{" "}
          <span className="text-foreground font-medium">{formatModifier(proficiencyBonus)}</span>
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {ABILITY_NAMES.map((ability) => (
            <AbilityRow
              key={ability}
              ability={ability}
              baseScore={draft.abilityScores[ability]}
              effectiveScore={effectiveScores[ability]}
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

      <div className="grid gap-3">
        <SectionTitle>Compétences</SectionTitle>
        <div className="grid gap-1 sm:grid-cols-2">
          {SKILL_DEFINITIONS.map((skill) => (
            <SkillRow
              key={skill.name}
              skill={skill}
              score={effectiveScores[skill.ability]}
              proficient={draft.skillProficiencies.includes(skill.name)}
              proficiencyBonus={proficiencyBonus}
              onProficiencyChange={(proficient) => {
                const next = proficient
                  ? [...draft.skillProficiencies, skill.name]
                  : draft.skillProficiencies.filter((existing) => existing !== skill.name);
                onChange({ skillProficiencies: next });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AbilityRowProps {
  ability: AbilityName;
  /** Score de base, saisi ici. */
  baseScore: number;
  /** Score effectif (base + bonus racial éventuel, voir l'onglet Général) — utilisé pour le
   * modificateur et le jet de sauvegarde affichés. */
  effectiveScore: number;
  proficient: boolean;
  proficiencyBonus: number;
  onScoreChange: (score: number) => void;
  onProficiencyChange: (proficient: boolean) => void;
}

function AbilityRow({
  ability,
  baseScore,
  effectiveScore,
  proficient,
  proficiencyBonus,
  onScoreChange,
  onProficiencyChange,
}: AbilityRowProps) {
  const scoreId = useId();
  const saveId = useId();
  const modifier = abilityModifier(effectiveScore);
  const savingThrow = modifier + (proficient ? proficiencyBonus : 0);
  const racialBonus = effectiveScore - baseScore;

  return (
    <div className="flex items-end gap-3 rounded-lg border p-3">
      <div className="grid flex-1 gap-2">
        <Label htmlFor={scoreId}>
          {ABILITY_LABELS[ability]}
          {racialBonus !== 0 && (
            <span className="text-muted-foreground ml-1 font-normal">
              ({formatModifier(racialBonus)} racial = {effectiveScore})
            </span>
          )}
        </Label>
        <Input
          id={scoreId}
          type="number"
          value={baseScore}
          onChange={(event) => onScoreChange(toNumber(event.target.value))}
        />
      </div>
      <p className="text-muted-foreground w-12 text-center text-sm">{formatModifier(modifier)}</p>
      <div className="flex items-center gap-2">
        <Switch
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

interface SkillRowProps {
  skill: SkillDefinition;
  /** Score effectif (déjà résolu avec le bonus racial) de la caractéristique liée. */
  score: number;
  proficient: boolean;
  proficiencyBonus: number;
  onProficiencyChange: (proficient: boolean) => void;
}

function SkillRow({
  skill,
  score,
  proficient,
  proficiencyBonus,
  onProficiencyChange,
}: SkillRowProps) {
  const skillId = useId();
  const modifier = abilityModifier(score);
  const total = modifier + (proficient ? proficiencyBonus : 0);

  return (
    <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
      <Switch
        id={skillId}
        checked={proficient}
        onCheckedChange={(checked) => onProficiencyChange(checked === true)}
      />
      <Label htmlFor={skillId} className="flex-1 text-sm font-normal">
        {skill.name}{" "}
        <span className="text-muted-foreground text-xs">
          ({ABILITY_SHORT_LABELS[skill.ability]})
        </span>
      </Label>
      <span className="w-10 text-right text-sm font-medium">{formatModifier(total)}</span>
    </div>
  );
}
