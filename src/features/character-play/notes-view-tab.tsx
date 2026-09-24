"use client";

import { useEffect } from "react";
import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { Character } from "@/domain/character";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { weaponAttackWarnings } from "@/domain/calculations/weapon-attack";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { findRaceDefinition } from "@/domain/race";
import { findClassDefinition, findSubclassDefinition } from "@/domain/character-class";
import { computeInitiative, computeSpeed } from "@/domain/calculations/combat-stats";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import { characterFeats } from "@/domain/feat";
import {
  computeAlwaysPreparedSpells,
  computeClassResourceOptions,
  grantedProficiencies,
} from "@/domain/calculations/class-features";
import type { Spell } from "@/domain/spell";
import { useSpellStore } from "@/stores/store-provider";
import { ARMOR_CATEGORY_LABELS } from "@/features/shared/armor-class";
import { computeClassResources } from "@/domain/calculations/class-resources";
import { clampCharacterLevel } from "@/domain/calculations/proficiency";
import { computeSpellSlots } from "@/domain/calculations/spell-slot-table";
import { resolveSpellcasting } from "@/domain/calculations/spellcasting";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

/** Règles appliquées automatiquement au personnage, en texte lisible (ex : bonus racial). */
function featRules(character: Character): string[] {
  const feats = characterFeats(character.featIds);
  return feats.length > 0
    ? [
        `Dons : ${joinWithAnd(
          feats.map((feat) =>
            feat.hitPointsPerLevel
              ? `${feat.name} (+${feat.hitPointsPerLevel} PV/niveau)`
              : feat.name,
          ),
        )}`,
      ]
    : [];
}

function appliedRules(character: Character, library: readonly Spell[]): string[] {
  return [
    ...raceRules(character),
    ...featRules(character),
    ...combatRules(character),
    ...classRules(character),
    ...subclassRules(character, library),
  ];
}

const WEAPON_PROFICIENCY_TEXT = { simple: "armes courantes", martial: "armes de guerre" } as const;

function combatRules(character: Character): string[] {
  const speed = computeSpeed(character);
  const initiative = computeInitiative(character);
  const [base, ...speedAdjustments] = speed.breakdown;
  return [
    `Vitesse : ${speed.total} m (${base?.label ?? "Base"} ${base?.value ?? speed.total} m${speedAdjustments
      .map((part) => `, ${part.label} ${formatModifier(part.value)} m`)
      .join("")})`,
    `Initiative : ${formatModifier(initiative.total)} (${initiative.breakdown
      .map((part) => `${part.label} ${formatModifier(part.value)}`)
      .join(", ")})`,
  ];
}

function joinWithAnd(items: readonly string[]): string {
  return items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function subclassRules(character: Character, library: readonly Spell[]): string[] {
  const subclass = findSubclassDefinition(character.classId, character.subclassId);
  const classDefinition = findClassDefinition(character.classId);
  const rules: string[] = [];
  const level = clampCharacterLevel(character.level);

  const alwaysPrepared = computeAlwaysPreparedSpells(character, library);
  if (subclass && classDefinition && alwaysPrepared.length > 0) {
    const missing = alwaysPrepared.filter(({ spell }) => !spell);
    rules.push(
      `Sorts toujours préparés (${subclass.name}, ${classDefinition.name} niv. ${level}) : ${joinWithAnd(
        alwaysPrepared.map(({ reference, spell }) => spell?.name ?? reference.name),
      )}${
        missing.length > 0
          ? ` — absent${missing.length > 1 ? "s" : ""} de la bibliothèque : ${joinWithAnd(
              missing.map(({ reference }) => reference.name),
            )}`
          : ""
      }`,
    );
  }

  for (const grant of grantedProficiencies(character)) {
    const parts = [
      ...grant.armor.map((category) =>
        category === "shield" ? "boucliers" : `armures ${ARMOR_CATEGORY_LABELS[category]}s`,
      ),
      ...grant.weapons.map((category) => WEAPON_PROFICIENCY_TEXT[category]),
    ];
    if (parts.length > 0) {
      rules.push(`Maîtrises accordées (${grant.source}) : ${joinWithAnd(parts)}`);
    }
  }
  return rules;
}

const RECHARGE_TEXT = { shortRest: "repos court ou long", longRest: "repos long" } as const;

function classRules(character: Character): string[] {
  const definition = findClassDefinition(character.classId);
  if (!definition) {
    return [];
  }
  const level = clampCharacterLevel(character.level);
  const rules: string[] = [];
  const hitPoints = computeMaxHitPoints(character);
  if (hitPoints.hitDie !== undefined) {
    const [first, ...others] = hitPoints.levels;
    const perLevel = others.map((entry) => `${entry.die}${formatModifier(entry.constitution)}`);
    rules.push(
      `PV max : ${hitPoints.total} (d${hitPoints.hitDie}, ${
        hitPoints.method === "fixed" ? "valeur fixe" : "dés lancés"
      } — niv. 1 : ${first ? `${first.die}${formatModifier(first.constitution)}` : ""}${
        perLevel.length > 0 ? `, niv. 2+ : ${perLevel.join(", ")}` : ""
      }${hitPoints.bonusSources
        .map((source) => `, ${source.name} +${source.perLevel} × ${level}`)
        .join("")})`,
    );
  }
  const saves = definition.savingThrows.map((ability) => ABILITY_LABELS[ability]);
  if (saves.length > 0) {
    rules.push(`Jets de sauvegarde maîtrisés (${definition.name}) : ${joinWithAnd(saves)}`);
  }
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
    const options = computeClassResourceOptions(character, resource.id).map(
      (option) => option.name,
    );
    rules.push(
      `${resource.name} : ${resource.max} utilisation${resource.max > 1 ? "s" : ""} (${definition.name} niv. ${level}), récupérée au ${RECHARGE_TEXT[resource.recharge]}${
        options.length > 0 ? ` — options : ${joinWithAnd(options)}` : ""
      }`,
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
  const spells = useSpellStore((state) => state.spells);
  const loadSpells = useSpellStore((state) => state.load);

  useEffect(() => {
    void loadSpells();
  }, [loadSpells]);

  const rules = appliedRules(character, spells);
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
