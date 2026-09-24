"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { cn } from "cn";
import type { AbilityName } from "@/domain/ability-scores";
import { ABILITY_NAMES } from "@/domain/ability-scores";
import { toggleProficiency } from "@/domain/calculations/class-features";
import {
  effectiveSavingThrowProficiencies,
  savingThrowGrantedBy,
} from "@/domain/calculations/combat-stats";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { abilityModifier } from "@/domain/calculations/modifiers";
import { clampCharacterLevel, proficiencyBonusForLevel } from "@/domain/calculations/proficiency";
import { Button } from "@/components/ui/button";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { ProficiencyDot } from "@/features/shared/proficiency-dot";
import type { SkillDefinition } from "@/features/shared/skills";
import { SKILL_DEFINITIONS } from "@/features/shared/skills";
import { GeneralSection } from "./general-section";
import type { CharacterTabProps } from "./types";

const MIN_SCORE = 1;
const MAX_SCORE = 30;

function clampScore(score: number): number {
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
}

/**
 * Onglet Caractéristiques de la configuration (docs/adr/0037) : une carte par caractéristique
 * (score de base, modificateur, bonus de race, maîtrise du jet de sauvegarde), puis les
 * compétences groupées par caractéristique.
 */
export function AbilitiesTab({ draft, onChange }: CharacterTabProps) {
  const titleId = useId();
  const proficiencyBonus = proficiencyBonusForLevel(clampCharacterLevel(draft.level));
  const effectiveScores = effectiveAbilityScores(draft.abilityScores, draft.raceSelection);
  const savingThrows = effectiveSavingThrowProficiencies(draft);

  function setSavingThrow(ability: AbilityName, checked: boolean) {
    const next = toggleProficiency(
      ABILITY_NAMES,
      {
        manual: draft.savingThrowProficiencies,
        removed: draft.removedSavingThrowProficiencies ?? [],
        granted: savingThrowGrantedBy(draft, ability) !== undefined,
      },
      ability,
      checked,
    );
    onChange({
      savingThrowProficiencies: next.manual ?? [],
      removedSavingThrowProficiencies: next.removed,
    });
  }

  return (
    <div className="grid gap-7 pt-2">
      <section aria-labelledby={titleId} className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id={titleId} className="font-heading text-xl font-semibold">
            Caractéristiques
          </h3>
          <p className="text-muted-foreground text-sm">
            Bonus de maîtrise{" "}
            <span className="font-heading text-primary text-lg font-bold tabular-nums">
              {formatModifier(proficiencyBonus)}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ABILITY_NAMES.map((ability) => (
            <AbilityCard
              key={ability}
              ability={ability}
              baseScore={draft.abilityScores[ability]}
              effectiveScore={effectiveScores[ability]}
              proficient={savingThrows.includes(ability)}
              grantedBy={savingThrowGrantedBy(draft, ability)}
              proficiencyBonus={proficiencyBonus}
              onScoreChange={(score) =>
                onChange({
                  abilityScores: { ...draft.abilityScores, [ability]: clampScore(score) },
                })
              }
              onProficiencyChange={(checked) => setSavingThrow(ability, checked)}
            />
          ))}
        </div>
      </section>

      <SkillsSection
        draft={draft}
        onChange={onChange}
        effectiveScores={effectiveScores}
        proficiencyBonus={proficiencyBonus}
      />
    </div>
  );
}

function AbilityCard({
  ability,
  baseScore,
  effectiveScore,
  proficient,
  grantedBy,
  proficiencyBonus,
  onScoreChange,
  onProficiencyChange,
}: {
  ability: AbilityName;
  /** Score de base, saisi ici. */
  baseScore: number;
  /** Score effectif (base + bonus racial de l'onglet Général) : il donne le modificateur. */
  effectiveScore: number;
  /** Maîtrise effective du jet de sauvegarde. */
  proficient: boolean;
  /** Classe dont les règles prévoient cette maîtrise, qu'elle soit conservée ou retirée. */
  grantedBy?: string;
  proficiencyBonus: number;
  onScoreChange: (score: number) => void;
  onProficiencyChange: (proficient: boolean) => void;
}) {
  const nameId = useId();
  const scoreId = useId();
  const saveLabelId = useId();
  const label = ABILITY_LABELS[ability];
  const modifier = abilityModifier(effectiveScore);
  const savingThrow = modifier + (proficient ? proficiencyBonus : 0);
  const racialBonus = effectiveScore - baseScore;
  const removed = grantedBy !== undefined && !proficient;

  return (
    <div
      role="group"
      aria-labelledby={nameId}
      className="bg-background/60 flex flex-col gap-3 rounded-2xl border p-3.5"
    >
      <span id={nameId} className="font-heading text-lg font-semibold">
        {label}
      </span>

      <div className="flex items-center justify-between gap-2">
        <div className="border-input bg-card flex h-11 items-center rounded-lg border">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="h-full w-8 rounded-r-none"
            aria-label={`Baisser ${label}`}
            disabled={baseScore <= MIN_SCORE}
            onClick={() => onScoreChange(baseScore - 1)}
          >
            <Minus />
          </Button>
          <input
            id={scoreId}
            type="number"
            min={MIN_SCORE}
            max={MAX_SCORE}
            aria-label={`Score de base : ${label}`}
            className="w-10 [appearance:textfield] bg-transparent text-center text-lg font-semibold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
            value={baseScore}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              onScoreChange(Number.isFinite(parsed) ? parsed : MIN_SCORE);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="h-full w-8 rounded-l-none"
            aria-label={`Monter ${label}`}
            disabled={baseScore >= MAX_SCORE}
            onClick={() => onScoreChange(baseScore + 1)}
          >
            <Plus />
          </Button>
        </div>
        <span
          aria-label={`Modificateur ${formatModifier(modifier)}`}
          className="font-heading text-3xl leading-none font-bold tabular-nums"
        >
          {formatModifier(modifier)}
        </span>
      </div>

      {racialBonus !== 0 && (
        <span className="text-primary text-xs">
          {formatModifier(racialBonus)} race → {effectiveScore}
        </span>
      )}

      <div
        role="group"
        aria-labelledby={saveLabelId}
        className="mt-auto grid gap-1.5 border-t pt-2.5"
      >
        <span
          id={saveLabelId}
          className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase"
        >
          Jet de sauvegarde
        </span>
        <button
          type="button"
          aria-pressed={proficient}
          onClick={() => onProficiencyChange(!proficient)}
          className={cn(
            "focus-visible:ring-ring/50 flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-1.5 text-left transition-colors outline-none focus-visible:ring-3",
            proficient ? "border-primary bg-primary/10" : "hover:bg-muted/40",
            removed && "border-dashed",
          )}
        >
          <ProficiencyDot proficient={proficient} />
          <span className="grid flex-1 gap-px">
            <span className="text-sm font-semibold">Maîtrise</span>
            {removed && (
              <span className="text-muted-foreground text-[11px]">Retirée · {grantedBy}</span>
            )}
          </span>
          <span
            className={cn(
              "font-heading text-xl font-bold tabular-nums",
              proficient && "text-primary",
            )}
          >
            {formatModifier(savingThrow)}
          </span>
        </button>
      </div>
    </div>
  );
}

/** Groupes de compétences par caractéristique, répartis en deux colonnes équilibrées. */
function skillColumns(): SkillDefinition[][][] {
  const groups = ABILITY_NAMES.map((ability) =>
    SKILL_DEFINITIONS.filter((skill) => skill.ability === ability),
  ).filter((group) => group.length > 0);
  const half = SKILL_DEFINITIONS.length / 2;
  const columns: SkillDefinition[][][] = [[], []];
  let count = 0;
  for (const group of groups) {
    const column = count < half ? 0 : 1;
    columns[column]?.push(group);
    count += group.length;
  }
  return columns;
}

const SKILL_COLUMNS = skillColumns();

function SkillsSection({
  draft,
  onChange,
  effectiveScores,
  proficiencyBonus,
}: CharacterTabProps & {
  effectiveScores: Record<AbilityName, number>;
  proficiencyBonus: number;
}) {
  const count = SKILL_DEFINITIONS.filter((skill) =>
    draft.skillProficiencies.includes(skill.name),
  ).length;

  function toggle(skill: string, checked: boolean) {
    onChange({
      skillProficiencies: checked
        ? [...draft.skillProficiencies, skill]
        : draft.skillProficiencies.filter((existing) => existing !== skill),
    });
  }

  return (
    <GeneralSection
      title="Compétences"
      action={
        <p className="text-muted-foreground text-sm">
          <span className="text-primary font-semibold">{count}</span> maîtrisée
          {count > 1 ? "s" : ""}
        </p>
      }
    >
      <div className="grid items-start gap-4 sm:grid-cols-2 sm:gap-5">
        {SKILL_COLUMNS.map((column, index) => (
          <div key={index} className="grid gap-4">
            {column.map((group) => {
              const ability = group[0]?.ability;
              if (!ability) {
                return null;
              }
              return (
                <SkillGroup
                  key={ability}
                  ability={ability}
                  skills={group}
                  score={effectiveScores[ability]}
                  proficiencies={draft.skillProficiencies}
                  proficiencyBonus={proficiencyBonus}
                  onToggle={toggle}
                />
              );
            })}
          </div>
        ))}
      </div>
    </GeneralSection>
  );
}

function SkillGroup({
  ability,
  skills,
  score,
  proficiencies,
  proficiencyBonus,
  onToggle,
}: {
  ability: AbilityName;
  skills: SkillDefinition[];
  score: number;
  proficiencies: readonly string[];
  proficiencyBonus: number;
  onToggle: (skill: string, checked: boolean) => void;
}) {
  const modifier = abilityModifier(score);

  return (
    <div
      role="group"
      aria-label={`Compétences de ${ABILITY_LABELS[ability]}`}
      className="grid gap-1"
    >
      <span
        aria-hidden
        className="text-muted-foreground px-1 pb-0.5 text-xs font-semibold tracking-widest uppercase"
      >
        {ABILITY_LABELS[ability]}
      </span>
      {skills.map((skill) => {
        const proficient = proficiencies.includes(skill.name);
        return (
          <button
            key={skill.name}
            type="button"
            aria-pressed={proficient}
            onClick={() => onToggle(skill.name, !proficient)}
            className={cn(
              "focus-visible:ring-ring/50 flex min-h-11 items-center gap-2.5 rounded-lg border px-3 text-left transition-colors outline-none focus-visible:ring-3",
              proficient ? "border-primary/45 bg-primary/5" : "bg-background/60 hover:bg-muted/40",
            )}
          >
            <ProficiencyDot proficient={proficient} />
            <span className="flex-1 text-sm">{skill.name}</span>
            <span
              className={cn(
                "text-[15px] font-semibold tabular-nums",
                proficient ? "text-primary" : "text-muted-foreground",
              )}
            >
              {formatModifier(modifier + (proficient ? proficiencyBonus : 0))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
