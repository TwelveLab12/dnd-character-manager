"use client";

import { grantedProficiencies } from "@/domain/calculations/class-features";
import { useId } from "react";
import { computeWeaponAttacks, weaponAttackWarnings } from "@/domain/calculations/weapon-attack";
import type { WeaponCategory } from "@/domain/inventory";
import { WEAPON_CATEGORIES } from "@/domain/inventory";
import { formatModifier } from "@/features/shared/format";
import {
  WEAPON_CATEGORY_LABELS,
  formatWeaponDamage,
  weaponAttackTags,
} from "@/features/shared/weapon";
import { GeneralSection, GroupLabel, ProficiencyChip } from "./general-section";
import type { CharacterTabProps } from "./types";

/**
 * Attaques calculées par arme équipée (voir src/domain/calculations/weapon-attack.ts) : les armes
 * se règlent dans l'onglet Inventaire ; ici, les maîtrises d'armes par catégorie et l'aperçu. Arts
 * martiaux, Ambidextre et le style Combat à deux armes sont rangés avec les dons (docs/adr/0035).
 */
export function AttacksSection({ draft, onChange }: CharacterTabProps) {
  const proficienciesId = useId();
  const proficiencies = draft.weaponProficiencies ?? [];
  const attacks = computeWeaponAttacks(draft);
  const warnings = weaponAttackWarnings(draft);

  function toggleProficiency(category: WeaponCategory, checked: boolean) {
    onChange({
      weaponProficiencies: checked
        ? WEAPON_CATEGORIES.filter((item) => item === category || proficiencies.includes(item))
        : proficiencies.filter((item) => item !== category),
    });
  }

  return (
    <GeneralSection
      title="Attaques"
      description={<>Calculées pour chaque arme équipée dans l&rsquo;onglet Inventaire</>}
    >
      <div role="group" aria-labelledby={proficienciesId} className="grid gap-2">
        <GroupLabel id={proficienciesId}>Maîtrises d&rsquo;armes</GroupLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WEAPON_CATEGORIES.map((category) => (
            <ProficiencyChip
              key={category}
              label={`Armes ${WEAPON_CATEGORY_LABELS[category]}s`}
              checked={proficiencies.includes(category)}
              grantedBy={
                grantedProficiencies(draft).find((grant) => grant.weapons.includes(category))
                  ?.source
              }
              onCheckedChange={(checked) => toggleProficiency(category, checked)}
            />
          ))}
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="text-warning grid gap-1 text-xs">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {attacks.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-center text-sm">
          Aucune arme équipée.
        </p>
      ) : (
        <ul className="bg-background/60 divide-y rounded-xl border">
          {attacks.map((attack) => {
            const tags = weaponAttackTags(attack);
            return (
              <li
                key={attack.itemId}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,14rem)]"
              >
                <span className="grid min-w-0 gap-0.5">
                  <span className="font-medium">{attack.name || "Arme"}</span>
                  {tags.length > 0 && (
                    <span className="text-muted-foreground text-xs">{tags.join(" · ")}</span>
                  )}
                </span>
                <span
                  aria-label={`Bonus d’attaque ${formatModifier(attack.attackBonus)}`}
                  className="bg-primary/15 text-primary justify-self-center rounded-lg px-2.5 py-1 font-semibold tabular-nums"
                >
                  {formatModifier(attack.attackBonus)}
                </span>
                <span className="text-muted-foreground col-span-2 text-sm sm:col-span-1">
                  {formatWeaponDamage(attack)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </GeneralSection>
  );
}
