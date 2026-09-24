"use client";

import { useEffect, useId } from "react";
import type { ArmorClassEffect, ArmorClassEffectTrigger } from "@/domain/armor-class-effect";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { generateId } from "@/domain/id";
import type { ArmorCategory } from "@/domain/inventory";
import type { Spell } from "@/domain/spell";
import { ARMOR_CATEGORIES } from "@/domain/inventory";
import { useSpellStore } from "@/stores/store-provider";
import { ARMOR_CATEGORY_LABELS, formatArmorClassBreakdown } from "@/features/shared/armor-class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CharacterTabProps } from "./types";

const MANUAL = "manual";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * CA calculée (voir src/domain/calculations/armor-class.ts) : l'armure et le bouclier se règlent
 * dans l'onglet Inventaire ; ici, les maîtrises, le don Maître des armures intermédiaires et les
 * effets de sorts/capacités.
 */
export function ArmorClassSection({ draft, onChange }: CharacterTabProps) {
  const masterId = useId();
  const result = computeArmorClass(draft);
  const proficiencies = draft.armorProficiencies ?? [];
  const effects = draft.armorClassEffects ?? [];
  const spells = useSpellStore((state) => state.spells);
  const loadSpells = useSpellStore((state) => state.load);

  useEffect(() => {
    void loadSpells();
  }, [loadSpells]);

  const concentrationSpells = spells
    .filter((spell) => spell.concentration && draft.knownSpellIds.includes(spell.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  function toggleProficiency(category: ArmorCategory, checked: boolean) {
    onChange({
      armorProficiencies: checked
        ? ARMOR_CATEGORIES.filter((item) => item === category || proficiencies.includes(item))
        : proficiencies.filter((item) => item !== category),
    });
  }

  function updateEffect(id: string, patch: Partial<ArmorClassEffect>) {
    onChange({
      armorClassEffects: effects.map((effect) =>
        effect.id === id ? { ...effect, ...patch } : effect,
      ),
    });
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <SectionTitle>Classe d&rsquo;armure</SectionTitle>
        <p className="text-sm">
          <span className="font-heading text-2xl font-semibold">{result.total}</span>{" "}
          <span className="text-muted-foreground">= {formatArmorClassBreakdown(result)}</span>
        </p>
      </div>
      <p className="text-muted-foreground text-xs">
        Calculée : armure et bouclier équipés dans l&rsquo;onglet Inventaire, 10 + Dex sans armure.
      </p>

      {result.warnings.length > 0 && (
        <ul className="text-warning grid gap-1 text-xs">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-2">
        <span className="text-muted-foreground text-xs">Maîtrises</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ARMOR_CATEGORIES.map((category) => (
            <ProficiencySwitch
              key={category}
              label={ARMOR_CATEGORY_LABELS[category]}
              checked={proficiencies.includes(category)}
              onCheckedChange={(checked) => toggleProficiency(category, checked)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id={masterId}
          checked={draft.mediumArmorMaster ?? false}
          onCheckedChange={(checked) => onChange({ mediumArmorMaster: checked || undefined })}
        />
        <Label htmlFor={masterId}>Maître des armures intermédiaires (Dex max +3)</Label>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Effets (sorts, capacités)</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                armorClassEffects: [
                  ...effects,
                  {
                    id: generateId(),
                    name: "",
                    bonus: 2,
                    trigger: { type: "manual", active: false },
                  },
                ],
              })
            }
          >
            Ajouter un effet
          </Button>
        </div>
        {effects.map((effect) => (
          <EffectRow
            key={effect.id}
            effect={effect}
            concentrationSpells={concentrationSpells}
            onChange={(patch) => updateEffect(effect.id, patch)}
            onRemove={() =>
              onChange({ armorClassEffects: effects.filter((item) => item.id !== effect.id) })
            }
          />
        ))}
      </div>
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
      <Label htmlFor={id} className="capitalize">
        {label}
      </Label>
    </div>
  );
}

function EffectRow({
  effect,
  concentrationSpells,
  onChange,
  onRemove,
}: {
  effect: ArmorClassEffect;
  concentrationSpells: Spell[];
  onChange: (patch: Partial<ArmorClassEffect>) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  const bonusId = useId();
  const triggerId = useId();
  function selectTrigger(value: string) {
    const trigger: ArmorClassEffectTrigger =
      value === MANUAL
        ? { type: "manual", active: false }
        : { type: "concentration", spellId: value };
    const spellName = concentrationSpells.find((spell) => spell.id === value)?.name;
    onChange({ trigger, ...(spellName && !effect.name ? { name: spellName } : {}) });
  }

  return (
    <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
      <div className="grid gap-1">
        <Label htmlFor={nameId} className="text-muted-foreground text-xs">
          Nom
        </Label>
        <Input
          id={nameId}
          value={effect.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={bonusId} className="text-muted-foreground text-xs">
          Bonus CA
        </Label>
        <Input
          id={bonusId}
          type="number"
          value={effect.bonus}
          onChange={(event) => onChange({ bonus: toNumber(event.target.value) })}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={triggerId} className="text-muted-foreground text-xs">
          Actif
        </Label>
        <Select
          value={effect.trigger.type === "manual" ? MANUAL : effect.trigger.spellId}
          onValueChange={selectTrigger}
        >
          <SelectTrigger id={triggerId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MANUAL}>Manuellement, en mode jeu</SelectItem>
            {concentrationSpells.map((spell) => (
              <SelectItem key={spell.id} value={spell.id}>
                Concentration : {spell.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Retirer
      </Button>
    </div>
  );
}
