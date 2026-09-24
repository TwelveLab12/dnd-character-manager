import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { Character } from "@/domain/character";
import { effectiveSavingThrowProficiencies } from "@/domain/calculations/combat-stats";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { abilityModifier } from "@/domain/calculations/modifiers";
import { clampCharacterLevel, proficiencyBonusForLevel } from "@/domain/calculations/proficiency";
import { ABILITY_LABELS, ABILITY_SHORT_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { SKILL_DEFINITIONS } from "@/features/shared/skills";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/section-title";

export function AbilitiesViewTab({ character }: { character: Character }) {
  const proficiencyBonus = proficiencyBonusForLevel(clampCharacterLevel(character.level));
  const effectiveScores = effectiveAbilityScores(character.abilityScores, character.raceSelection);
  const savingThrows = effectiveSavingThrowProficiencies(character);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <p className="text-muted-foreground text-sm">
          Bonus de maîtrise (niveau {character.level}) :{" "}
          <span className="text-foreground font-medium">{formatModifier(proficiencyBonus)}</span>
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {ABILITY_NAMES.map((ability) => {
            const score = effectiveScores[ability];
            const modifier = abilityModifier(score);
            const proficient = savingThrows.includes(ability);
            const savingThrow = modifier + (proficient ? proficiencyBonus : 0);
            return (
              <div key={ability} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{ABILITY_LABELS[ability]}</p>
                  <p className="text-muted-foreground text-xs">Score {score}</p>
                </div>
                <p className="text-muted-foreground w-12 text-center text-sm">
                  {formatModifier(modifier)}
                </p>
                <Badge variant={proficient ? "default" : "outline"}>
                  Sauv. {formatModifier(savingThrow)}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        <SectionTitle>Compétences</SectionTitle>
        <div className="grid gap-1 sm:grid-cols-2">
          {SKILL_DEFINITIONS.map((skill) => {
            const score = effectiveScores[skill.ability];
            const modifier = abilityModifier(score);
            const proficient = character.skillProficiencies.includes(skill.name);
            const total = modifier + (proficient ? proficiencyBonus : 0);
            return (
              <div
                key={skill.name}
                className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
              >
                {proficient && <Badge variant="secondary">✓</Badge>}
                <span className="flex-1 text-sm">
                  {skill.name}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({ABILITY_SHORT_LABELS[skill.ability]})
                  </span>
                </span>
                <span className="w-10 text-right text-sm font-medium">{formatModifier(total)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
