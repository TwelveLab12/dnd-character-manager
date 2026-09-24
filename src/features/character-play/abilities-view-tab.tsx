import type { AbilityName } from "@/domain/ability-scores";
import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { Character } from "@/domain/character";
import { effectiveSavingThrowProficiencies } from "@/domain/calculations/combat-stats";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { abilityModifier } from "@/domain/calculations/modifiers";
import { clampCharacterLevel, proficiencyBonusForLevel } from "@/domain/calculations/proficiency";
import { ABILITY_LABELS, ABILITY_SHORT_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { ProficiencyDot } from "@/features/shared/proficiency-dot";
import { SKILL_DEFINITIONS } from "@/features/shared/skills";
import { SectionTitle } from "@/components/ui/section-title";

/**
 * Onglet « Caractéristiques » du mode jeu (lecture seule). Chaque carte met en avant le total du jet
 * de sauvegarde (modificateur + bonus de maîtrise si maîtrisé), la valeur utilisée en partie ;
 * modificateur et score restent en petit, pour information. Le bonus de maîtrise, commun à toutes
 * les cartes, n'est affiché qu'une fois en en-tête.
 */
export function AbilitiesViewTab({ character }: { character: Character }) {
  const proficiencyBonus = proficiencyBonusForLevel(clampCharacterLevel(character.level));
  const effectiveScores = effectiveAbilityScores(character.abilityScores, character.raceSelection);
  const savingThrows = effectiveSavingThrowProficiencies(character);

  const skillTotal = (skillName: string, ability: AbilityName) =>
    abilityModifier(effectiveScores[ability]) +
    (character.skillProficiencies.includes(skillName) ? proficiencyBonus : 0);
  const passivePerception = 10 + skillTotal("Perception", "wisdom");

  return (
    <div className="grid gap-7">
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <HeaderChip label="Bonus de maîtrise" value={formatModifier(proficiencyBonus)} accent />
          <HeaderChip label="Perception passive" value={passivePerception} />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {ABILITY_NAMES.map((ability) => (
            <AbilityCard
              key={ability}
              ability={ability}
              baseScore={character.abilityScores[ability]}
              score={effectiveScores[ability]}
              proficient={savingThrows.includes(ability)}
              proficiencyBonus={proficiencyBonus}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <SectionTitle>Compétences</SectionTitle>
        <ul className="grid gap-1 sm:grid-cols-2 sm:gap-x-3">
          {SKILL_DEFINITIONS.map((skill) => {
            const proficient = character.skillProficiencies.includes(skill.name);
            return (
              <li
                key={skill.name}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-1.5 ${
                  proficient ? "border-primary/35 bg-primary/5" : "border-border/70"
                }`}
              >
                <ProficiencyDot proficient={proficient} />
                <span className="flex-1 text-sm">
                  {skill.name}
                  <span className="text-muted-foreground ml-1.5 text-[10px] font-semibold tracking-wider">
                    {ABILITY_SHORT_LABELS[skill.ability]}
                  </span>
                  <span className="sr-only">{proficient ? " (maîtrisée)" : ""}</span>
                </span>
                <span
                  className={`w-8 text-right text-sm tabular-nums ${
                    proficient ? "text-primary font-bold" : "text-muted-foreground font-medium"
                  }`}
                >
                  {formatModifier(skillTotal(skill.name, skill.ability))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function HeaderChip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <p className="bg-background/50 flex items-baseline gap-2 rounded-full border px-3 py-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={`font-heading text-lg font-bold tabular-nums ${accent ? "text-primary" : ""}`}
      >
        {value}
      </span>
    </p>
  );
}

function AbilityCard({
  ability,
  baseScore,
  score,
  proficient,
  proficiencyBonus,
}: {
  ability: AbilityName;
  baseScore: number;
  /** Score effectif (base + bonus racial éventuel). */
  score: number;
  /** Maîtrise du jet de sauvegarde. */
  proficient: boolean;
  proficiencyBonus: number;
}) {
  const modifier = abilityModifier(score);
  const total = modifier + (proficient ? proficiencyBonus : 0);
  const racialBonus = score - baseScore;

  return (
    <section
      aria-label={ABILITY_LABELS[ability]}
      className="bg-background/50 flex flex-col overflow-hidden rounded-2xl border"
    >
      <div className="flex flex-col items-center gap-0.5 px-3 pt-3.5 pb-3">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
          {ABILITY_LABELS[ability]}
        </span>
        <span
          className={`font-heading text-[40px] leading-tight font-bold tabular-nums sm:text-[44px] ${
            proficient ? "text-primary" : ""
          }`}
        >
          <span className="sr-only">Jet de sauvegarde </span>
          {formatModifier(total)}
        </span>
        <span
          className="text-muted-foreground text-xs"
          title={
            racialBonus !== 0
              ? `${baseScore} ${formatModifier(racialBonus)} racial`
              : "Score de base"
          }
        >
          mod. {formatModifier(modifier)} · score {score}
        </span>
      </div>
      <div
        className={`flex items-center justify-center gap-2 border-t px-3.5 py-2 text-[13px] ${
          proficient ? "bg-primary/10" : "text-muted-foreground"
        }`}
      >
        <ProficiencyDot proficient={proficient} />
        <span aria-hidden>Maîtrise</span>
        <span className="sr-only">{proficient ? "Maîtrisé" : "Non maîtrisé"}</span>
      </div>
    </section>
  );
}

/** Pastille de maîtrise : pleine (dorée) si maîtrisé, cercle vide sinon. */
