"use client";

import { useId } from "react";
import type { ArmorCategory, InventoryItem } from "@/domain/inventory";
import { ARMOR_CATEGORIES } from "@/domain/inventory";
import { generateId } from "@/domain/id";
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
import { ARMOR_CATEGORY_LABELS } from "@/features/shared/armor-class";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const NO_ARMOR = "none";

/** CA de base proposée au choix d'une catégorie (armure de cuir, cuirasse, cotte de mailles,
 * bouclier) — simple point de départ, modifiable ensuite. */
const DEFAULT_BASE_ARMOR_CLASS: Record<ArmorCategory, number> = {
  light: 11,
  medium: 14,
  heavy: 16,
  shield: 2,
};

function optionalNumber(value: string): number | undefined {
  return value ? toNumber(value) : undefined;
}

function createBlankItem(): InventoryItem {
  return { id: generateId(), name: "", quantity: 1 };
}

export function InventoryTab({ draft, onChange }: CharacterTabProps) {
  function updateItem(id: string, patch: Partial<InventoryItem>) {
    onChange({
      inventory: draft.inventory.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function removeItem(id: string) {
    onChange({ inventory: draft.inventory.filter((item) => item.id !== id) });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Inventaire</SectionTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ inventory: [...draft.inventory, createBlankItem()] })}
        >
          Ajouter un objet
        </Button>
      </div>

      {draft.inventory.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucun objet pour l&rsquo;instant.</p>
      )}

      <div className="grid gap-3">
        {draft.inventory.map((item) => (
          <InventoryRow
            key={item.id}
            item={item}
            onChange={(patch) => updateItem(item.id, patch)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function InventoryRow({
  item,
  onChange,
  onRemove,
}: {
  item: InventoryItem;
  onChange: (patch: Partial<InventoryItem>) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  const quantityId = useId();
  const weightId = useId();
  const equippedId = useId();
  const descriptionId = useId();
  const armorTypeId = useId();
  const baseArmorClassId = useId();
  const strengthId = useId();
  const bonusId = useId();
  const { armor } = item;

  function selectArmorCategory(value: string) {
    if (value === NO_ARMOR) {
      onChange({ armor: undefined });
      return;
    }
    const category = value as ArmorCategory;
    onChange({
      armor: {
        category,
        baseArmorClass:
          armor && armor.category !== "shield" && category !== "shield"
            ? armor.baseArmorClass
            : DEFAULT_BASE_ARMOR_CLASS[category],
        ...(category === "heavy" && armor?.strengthRequirement !== undefined
          ? { strengthRequirement: armor.strengthRequirement }
          : {}),
      },
    });
  }

  return (
    <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_1fr_auto_auto] sm:items-end">
      <div className="grid gap-1">
        <Label htmlFor={nameId} className="text-muted-foreground text-xs">
          Nom
        </Label>
        <Input
          id={nameId}
          value={item.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={quantityId} className="text-muted-foreground text-xs">
          Quantité
        </Label>
        <Input
          id={quantityId}
          type="number"
          min={0}
          value={item.quantity}
          onChange={(event) => onChange({ quantity: toNumber(event.target.value) })}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={weightId} className="text-muted-foreground text-xs">
          Poids
        </Label>
        <Input
          id={weightId}
          type="number"
          min={0}
          step="0.1"
          value={item.weight ?? ""}
          onChange={(event) =>
            onChange({ weight: event.target.value ? toNumber(event.target.value) : undefined })
          }
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id={equippedId}
          checked={item.equipped ?? false}
          onCheckedChange={(checked) => onChange({ equipped: checked === true })}
        />
        <Label htmlFor={equippedId} className="text-muted-foreground text-xs">
          Équipé
        </Label>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Retirer
      </Button>
      <div className="grid gap-2 sm:col-span-5 sm:grid-cols-4">
        <div className="grid gap-1">
          <Label htmlFor={armorTypeId} className="text-muted-foreground text-xs">
            Armure
          </Label>
          <Select value={armor?.category ?? NO_ARMOR} onValueChange={selectArmorCategory}>
            <SelectTrigger id={armorTypeId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ARMOR}>Aucune</SelectItem>
              {ARMOR_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "shield" ? "Bouclier" : `Armure ${ARMOR_CATEGORY_LABELS[category]}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {armor && (
          <div className="grid gap-1">
            <Label htmlFor={baseArmorClassId} className="text-muted-foreground text-xs">
              {armor.category === "shield" ? "Bonus bouclier" : "CA de base"}
            </Label>
            <Input
              id={baseArmorClassId}
              type="number"
              value={armor.baseArmorClass}
              onChange={(event) =>
                onChange({ armor: { ...armor, baseArmorClass: toNumber(event.target.value) } })
              }
            />
          </div>
        )}
        {armor?.category === "heavy" && (
          <div className="grid gap-1">
            <Label htmlFor={strengthId} className="text-muted-foreground text-xs">
              Force min.
            </Label>
            <Input
              id={strengthId}
              type="number"
              min={0}
              value={armor.strengthRequirement ?? ""}
              onChange={(event) =>
                onChange({
                  armor: { ...armor, strengthRequirement: optionalNumber(event.target.value) },
                })
              }
            />
          </div>
        )}
        <div className="grid gap-1">
          <Label htmlFor={bonusId} className="text-muted-foreground text-xs">
            Bonus CA (magique)
          </Label>
          <Input
            id={bonusId}
            type="number"
            value={item.armorClassBonus ?? ""}
            onChange={(event) => onChange({ armorClassBonus: optionalNumber(event.target.value) })}
          />
        </div>
      </div>
      <div className="grid gap-1 sm:col-span-5">
        <Label htmlFor={descriptionId} className="text-muted-foreground text-xs">
          Description
        </Label>
        <Input
          id={descriptionId}
          value={item.description ?? ""}
          onChange={(event) => onChange({ description: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
