"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId } from "react";
import type { ArmorClassEffect, ArmorClassEffectTrigger } from "@/domain/armor-class-effect";
import { grantedProficiencies } from "@/domain/calculations/class-features";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { generateId } from "@/domain/id";
import type { ArmorCategory } from "@/domain/inventory";
import type { Spell } from "@/domain/spell";
import { ARMOR_CATEGORIES } from "@/domain/inventory";
import { useSpellStore } from "@/stores/store-provider";
import { ARMOR_CATEGORY_LABELS, formatArmorClassBreakdown } from "@/features/shared/armor-class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeneralSection, GroupLabel, ProficiencyChip } from "./general-section";
import type { CharacterTabProps } from "./types";

const MANUAL = "manual";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function capitalize(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * CA calculée (voir src/domain/calculations/armor-class.ts) : l'armure et le bouclier se règlent
 * dans l'onglet Inventaire ; ici, les maîtrises et les effets de sorts/capacités. Le don Maître des
 * armures intermédiaires est rangé avec les autres dons (docs/adr/0035).
 */
export function ArmorClassSection({ draft, onChange }: CharacterTabProps) {
  const proficienciesId = useId();
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
    <GeneralSection
      id="general-defense"
      title="Défense"
      description={
        <>
          CA {result.total} = {formatArmorClassBreakdown(result)} · armure et bouclier équipés dans
          l&rsquo;onglet Inventaire
        </>
      }
    >
      {result.warnings.length > 0 && (
        <ul className="text-warning grid gap-1 text-xs">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div role="group" aria-labelledby={proficienciesId} className="grid gap-2">
        <GroupLabel id={proficienciesId}>Maîtrises d&rsquo;armure</GroupLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ARMOR_CATEGORIES.map((category) => (
            <ProficiencyChip
              key={category}
              label={capitalize(ARMOR_CATEGORY_LABELS[category])}
              checked={proficiencies.includes(category)}
              grantedBy={
                grantedProficiencies(draft).find((grant) => grant.armor.includes(category))?.source
              }
              onCheckedChange={(checked) => toggleProficiency(category, checked)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <GroupLabel>Effets temporaires</GroupLabel>
          <Button
            type="button"
            variant="outline"
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
            <Plus />
            Ajouter un effet
          </Button>
        </div>
        {effects.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-center text-sm">
            Aucun effet. Ex : Bouclier de la foi +2, lié à sa concentration.
          </p>
        ) : (
          effects.map((effect) => (
            <EffectRow
              key={effect.id}
              effect={effect}
              concentrationSpells={concentrationSpells}
              onChange={(patch) => updateEffect(effect.id, patch)}
              onRemove={() =>
                onChange({ armorClassEffects: effects.filter((item) => item.id !== effect.id) })
              }
            />
          ))
        )}
      </div>
    </GeneralSection>
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
  function selectTrigger(value: string) {
    const trigger: ArmorClassEffectTrigger =
      value === MANUAL
        ? { type: "manual", active: false }
        : { type: "concentration", spellId: value };
    const spellName = concentrationSpells.find((spell) => spell.id === value)?.name;
    onChange({ trigger, ...(spellName && !effect.name ? { name: spellName } : {}) });
  }

  return (
    <div className="bg-background/60 grid gap-2 rounded-xl border p-2 sm:grid-cols-[minmax(0,1fr)_6rem_15rem_auto] sm:items-center">
      <Input
        aria-label="Nom de l’effet"
        placeholder="Nom de l’effet"
        className="font-medium"
        value={effect.name}
        onChange={(event) => onChange({ name: event.target.value })}
      />
      <label className="bg-primary/10 text-primary flex h-8 items-center gap-1 rounded-lg px-2.5 font-semibold">
        <span aria-hidden>+</span>
        <input
          aria-label="Bonus de CA"
          type="number"
          className="w-8 min-w-0 bg-transparent outline-none"
          value={effect.bonus}
          onChange={(event) => onChange({ bonus: toNumber(event.target.value) })}
        />
        <span className="text-xs">CA</span>
      </label>
      <Select
        value={effect.trigger.type === "manual" ? MANUAL : effect.trigger.spellId}
        onValueChange={selectTrigger}
      >
        <SelectTrigger aria-label="Déclenchement" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={MANUAL}>Activé à la main en jeu</SelectItem>
          {concentrationSpells.map((spell) => (
            <SelectItem key={spell.id} value={spell.id}>
              Concentration : {spell.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={`Retirer ${effect.name || "l’effet"}`}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
