"use client";

import { useId } from "react";
import type { Character } from "@/domain/character";
import type { EquipSlot } from "@/domain/equipment";
import { canWieldOffHand, currentSlot } from "@/domain/equipment";
import type { InventoryItem } from "@/domain/inventory";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const UNEQUIPPED = "none";

/**
 * Contrôle d'équipement commun à la configuration et au mode jeu : sélecteur de main pour une
 * arme, interrupteur pour le reste. Les conflits d'emplacement (armure, bouclier, mains) sont
 * résolus par l'appelant via `equipItem` (src/domain/equipment.ts).
 */
export function EquipControl({
  item,
  character,
  onEquip,
}: {
  item: InventoryItem;
  character: Pick<Character, "dualWielder">;
  onEquip: (slot: EquipSlot) => void;
}) {
  const id = useId();
  const slot = currentSlot(item);
  const { weapon } = item;

  if (!weapon) {
    return (
      <div className="flex h-9 items-center gap-2">
        <Switch
          id={id}
          checked={slot !== null}
          onCheckedChange={(checked) => onEquip(checked ? "equipped" : null)}
        />
        <Label htmlFor={id} className="text-muted-foreground text-xs">
          Équipé
        </Label>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        Équipement
      </Label>
      <Select
        value={slot ?? UNEQUIPPED}
        onValueChange={(value) => onEquip(value === UNEQUIPPED ? null : (value as EquipSlot))}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNEQUIPPED}>Non équipée</SelectItem>
          <SelectItem value="main">
            {weapon.twoHanded ? "Deux mains" : "Main principale"}
          </SelectItem>
          {!weapon.twoHanded && (
            <SelectItem value="off" disabled={!canWieldOffHand(character, weapon)}>
              Main secondaire
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
