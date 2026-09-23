"use client";

import { useId } from "react";
import type { InventoryItem } from "@/domain/inventory";
import { generateId } from "@/domain/id";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "@/components/ui/section-title";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
        <Checkbox
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
