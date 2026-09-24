"use client";

import { useId } from "react";
import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { ArmorClassEffect } from "@/domain/armor-class-effect";
import type { Character } from "@/domain/character";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { computeWeaponAttacks } from "@/domain/calculations/weapon-attack";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { findRaceDefinition } from "@/domain/race";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatArmorClassBreakdown } from "@/features/shared/armor-class";
import { formatModifier } from "@/features/shared/format";
import { DAMAGE_TYPE_LABELS } from "@/features/shared/weapon";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReadOnlyField } from "./read-only-field";
import { usePlayActions } from "./use-play-actions";

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
  const attacks = computeWeaponAttacks(character);
  const manualEffects = (character.armorClassEffects ?? []).filter(
    (effect) => effect.trigger.type === "manual",
  );

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
          <ReadOnlyField
            label="Classe d'armure"
            value={
              <>
                <span className="text-base font-semibold">{armorClass.total}</span>
                <span className="text-muted-foreground block text-xs">
                  {formatArmorClassBreakdown(armorClass)}
                </span>
              </>
            }
          />
          <ReadOnlyField
            label="Bonus d'initiative"
            value={formatModifier(character.initiativeBonus)}
          />
          <ReadOnlyField label="Vitesse" value={`${character.speed} m`} />
        </div>

        {armorClass.warnings.length > 0 && (
          <ul className="text-warning -mt-2 grid gap-1 text-xs">
            {armorClass.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {manualEffects.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {manualEffects.map((effect) => (
              <ManualEffectSwitch key={effect.id} characterId={character.id} effect={effect} />
            ))}
          </div>
        )}

        <div className="grid gap-2">
          <span className="text-muted-foreground text-xs">Attaques</span>
          {attacks.length === 0 ? (
            <span className="text-sm">—</span>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-3">
              {attacks.map((attack) => (
                <li key={attack.itemId} className="grid gap-0.5">
                  <span className="text-sm font-medium">
                    {attack.name || "Arme"}{" "}
                    <span className="text-base font-semibold">
                      {formatModifier(attack.attackBonus)}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {attack.damage} {DAMAGE_TYPE_LABELS[attack.damageType]}
                    {attack.versatileDamage && ` · ${attack.versatileDamage} à deux mains`}
                  </span>
                  {!attack.proficient && (
                    <span className="text-warning text-xs">
                      Non maîtrisée (sans bonus de maîtrise)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {character.notes && <ReadOnlyField label="Notes" value={character.notes} />}
      </CardContent>
    </Card>
  );
}

function ManualEffectSwitch({
  characterId,
  effect,
}: {
  characterId: string;
  effect: ArmorClassEffect;
}) {
  const { toggleArmorClassEffect } = usePlayActions(characterId);
  const id = useId();
  const active = effect.trigger.type === "manual" && effect.trigger.active;

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={active}
        onCheckedChange={() => void toggleArmorClassEffect(effect.id)}
      />
      <Label htmlFor={id} className={active ? "text-info" : "text-muted-foreground"}>
        {effect.name || "Effet"} ({formatModifier(effect.bonus)} CA)
      </Label>
    </div>
  );
}
