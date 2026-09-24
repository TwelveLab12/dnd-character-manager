"use client";

import { useId } from "react";
import {
  computeWeaponAttacks,
  martialArtsDie,
  weaponAttackWarnings,
} from "@/domain/calculations/weapon-attack";
import type { WeaponCategory } from "@/domain/inventory";
import { WEAPON_CATEGORIES } from "@/domain/inventory";
import { WEAPON_CATEGORY_LABELS, formatWeaponAttack } from "@/features/shared/weapon";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "@/components/ui/section-title";
import { Switch } from "@/components/ui/switch";
import type { CharacterTabProps } from "./types";

/**
 * Attaques calculées par arme équipée (voir src/domain/calculations/weapon-attack.ts) : les armes
 * se règlent dans l'onglet Inventaire ; ici, les maîtrises d'armes par catégorie et l'aperçu.
 */
export function AttacksSection({ draft, onChange }: CharacterTabProps) {
  const proficiencies = draft.weaponProficiencies ?? [];
  const attacks = computeWeaponAttacks(draft);
  const warnings = weaponAttackWarnings(draft);
  const martialArtsId = useId();

  function toggleProficiency(category: WeaponCategory, checked: boolean) {
    onChange({
      weaponProficiencies: checked
        ? WEAPON_CATEGORIES.filter((item) => item === category || proficiencies.includes(item))
        : proficiencies.filter((item) => item !== category),
    });
  }

  return (
    <section className="grid gap-4">
      <SectionTitle>Attaques</SectionTitle>
      <p className="text-muted-foreground text-xs">
        Calculées pour chaque arme équipée dans l&rsquo;onglet Inventaire.
      </p>

      <div className="grid gap-2">
        <span className="text-muted-foreground text-xs">Maîtrises d&rsquo;armes</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {WEAPON_CATEGORIES.map((category) => (
            <ProficiencySwitch
              key={category}
              label={`Armes ${WEAPON_CATEGORY_LABELS[category]}s`}
              checked={proficiencies.includes(category)}
              onCheckedChange={(checked) => toggleProficiency(category, checked)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id={martialArtsId}
          checked={draft.martialArts ?? false}
          onCheckedChange={(checked) => onChange({ martialArts: checked || undefined })}
        />
        <Label htmlFor={martialArtsId}>
          Arts martiaux (Moine) — dé {martialArtsDie(draft.level).slice(1)}, armes de moine et mains
          nues
        </Label>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <ProficiencySwitch
          label="Don Ambidextre"
          checked={draft.dualWielder ?? false}
          onCheckedChange={(checked) => onChange({ dualWielder: checked || undefined })}
        />
        <ProficiencySwitch
          label="Style : Combat à deux armes"
          checked={draft.twoWeaponFightingStyle ?? false}
          onCheckedChange={(checked) => onChange({ twoWeaponFightingStyle: checked || undefined })}
        />
      </div>

      {warnings.length > 0 && (
        <ul className="text-warning grid gap-1 text-xs">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {attacks.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune arme équipée.</p>
      ) : (
        <ul className="grid gap-1 text-sm">
          {attacks.map((attack) => (
            <li key={attack.itemId}>
              <span className="font-medium">{attack.name || "Arme"}</span>{" "}
              <span className="text-muted-foreground">{formatWeaponAttack(attack)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProficiencySwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value)} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
