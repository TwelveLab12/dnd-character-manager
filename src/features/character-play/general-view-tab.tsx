import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { Character } from "@/domain/character";
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

        <div className="grid gap-4 sm:grid-cols-3">
          <ReadOnlyField label="Classe d'armure" value={character.armorClass} />
          <ReadOnlyField
            label="Bonus d'initiative"
            value={formatModifier(character.initiativeBonus)}
          />
          <ReadOnlyField label="Vitesse" value={`${character.speed} m`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <ReadOnlyField
            label="Bonus d'attaque en mêlée"
            value={
              character.meleeAttackBonus !== undefined
                ? formatModifier(character.meleeAttackBonus)
                : "—"
            }
          />
          <ReadOnlyField
            label="Bonus d'attaque à distance"
            value={
              character.rangedAttackBonus !== undefined
                ? formatModifier(character.rangedAttackBonus)
                : "—"
            }
          />
        </div>

        {character.notes && <ReadOnlyField label="Notes" value={character.notes} />}
      </CardContent>
    </Card>
  );
}
