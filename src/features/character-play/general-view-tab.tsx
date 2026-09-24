import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { Character } from "@/domain/character";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { weaponAttackWarnings } from "@/domain/calculations/weapon-attack";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { findRaceDefinition } from "@/domain/race";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { Card, CardContent } from "@/components/ui/card";
import { ReadOnlyField } from "./read-only-field";

export function GeneralViewTab({ character }: { character: Character }) {
  const race = character.raceSelection
    ? findRaceDefinition(character.raceSelection.raceId)
    : undefined;
  const effectiveScores = character.raceSelection
    ? effectiveAbilityScores(character.abilityScores, character.raceSelection)
    : null;
  const changedAbilities = effectiveScores
    ? ABILITY_NAMES.filter(
        (ability) => effectiveScores[ability] !== character.abilityScores[ability],
      )
    : [];

  const armorClass = computeArmorClass(character);
  const attackWarnings = weaponAttackWarnings(character);

  return (
    <Card>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <ReadOnlyField label="Race" value={character.race ?? "—"} />
          <ReadOnlyField label="Historique" value={character.background ?? "—"} />
        </div>

        {race && changedAbilities.length > 0 && effectiveScores && (
          <p className="text-muted-foreground text-xs">
            Bonus racial ({race.name}) :{" "}
            {changedAbilities
              .map(
                (ability) =>
                  `${ABILITY_LABELS[ability]} ${character.abilityScores[ability]} → ${effectiveScores[ability]} (${formatModifier(
                    effectiveScores[ability] - character.abilityScores[ability],
                  )})`,
              )
              .join(", ")}
          </p>
        )}

        {armorClass.warnings.length > 0 && (
          <ul className="text-warning grid gap-1 text-xs">
            {armorClass.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {attackWarnings.length > 0 && (
          <ul className="text-warning grid gap-1 text-xs">
            {attackWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {character.notes && <ReadOnlyField label="Notes" value={character.notes} />}
      </CardContent>
    </Card>
  );
}
