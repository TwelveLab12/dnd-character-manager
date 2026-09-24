import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { Character } from "@/domain/character";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { weaponAttackWarnings } from "@/domain/calculations/weapon-attack";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { findRaceDefinition } from "@/domain/race";
import { findClassDefinition } from "@/domain/character-class";
import { computeClassResources } from "@/domain/calculations/class-resources";
import { clampCharacterLevel } from "@/domain/calculations/proficiency";
import { computeSpellSlots } from "@/domain/calculations/spell-slot-table";
import { resolveSpellcasting } from "@/domain/calculations/spellcasting";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

/** Règles appliquées automatiquement au personnage, en texte lisible (ex : bonus racial). */
function appliedRules(character: Character): string[] {
  return [...raceRules(character), ...classRules(character)];
}

const RECHARGE_TEXT = { shortRest: "repos court ou long", longRest: "repos long" } as const;

function classRules(character: Character): string[] {
  const definition = findClassDefinition(character.classId);
  if (!definition) {
    return [];
  }
  const level = clampCharacterLevel(character.level);
  const rules: string[] = [];
  const spellcasting = resolveSpellcasting(character);
  if (definition.spellcasting && spellcasting) {
    rules.push(
      `Incantation (${definition.name}) : ${ABILITY_LABELS[spellcasting.ability]}, DD ${spellcasting.spellSaveDC}, attaque ${formatModifier(spellcasting.spellAttackBonus)}`,
    );
  }
  const slots = computeSpellSlots(character);
  if (slots.length > 0) {
    rules.push(
      `Emplacements de sorts (${definition.name} niv. ${level}) : ${slots
        .map((slot) => `${slot.total} × niv. ${slot.level}`)
        .join(", ")}`,
    );
  }
  for (const resource of computeClassResources(character)) {
    rules.push(
      `${resource.name} : ${resource.max} utilisation${resource.max > 1 ? "s" : ""} (${definition.name} niv. ${level}), récupérée au ${RECHARGE_TEXT[resource.recharge]}`,
    );
  }
  return rules;
}

function raceRules(character: Character): string[] {
  const race = character.raceSelection
    ? findRaceDefinition(character.raceSelection.raceId)
    : undefined;
  if (!race || !character.raceSelection) {
    return [];
  }
  const effectiveScores = effectiveAbilityScores(character.abilityScores, character.raceSelection);
  const changes = ABILITY_NAMES.filter(
    (ability) => effectiveScores[ability] !== character.abilityScores[ability],
  ).map(
    (ability) =>
      `${ABILITY_LABELS[ability]} ${character.abilityScores[ability]} → ${effectiveScores[ability]} (${formatModifier(
        effectiveScores[ability] - character.abilityScores[ability],
      )})`,
  );
  return changes.length > 0 ? [`Bonus racial (${race.name}) : ${changes.join(", ")}`] : [];
}

export function NotesViewTab({ character }: { character: Character }) {
  const rules = appliedRules(character);
  const warnings = [...computeArmorClass(character).warnings, ...weaponAttackWarnings(character)];

  return (
    <Card>
      <CardContent className="grid gap-6">
        <section className="grid gap-2">
          <SectionTitle>Règles appliquées</SectionTitle>
          {rules.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune règle particulière.</p>
          ) : (
            <ul className="grid list-disc gap-1 pl-5 text-sm">
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          )}
        </section>

        {warnings.length > 0 && (
          <section className="grid gap-2">
            <SectionTitle>Avertissements</SectionTitle>
            <ul className="text-warning grid list-disc gap-1 pl-5 text-sm">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        )}

        {character.notes && (
          <section className="grid gap-2">
            <SectionTitle>Notes</SectionTitle>
            <p className="text-sm whitespace-pre-line">{character.notes}</p>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
