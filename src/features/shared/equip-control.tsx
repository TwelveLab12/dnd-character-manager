"use client";

import { useId } from "react";
import type { EquipSlot } from "@/domain/equipment";
import { currentSlot } from "@/domain/equipment";
import type { InventoryItem } from "@/domain/inventory";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Interrupteur « Équipé » d'une armure, d'un bouclier ou d'un objet porté (anneau, cape…), commun à
 * la configuration et au mode jeu. Une arme se place avec WeaponPlacementControl (sac, prête, en
 * main — docs/adr/0054). Les conflits d'emplacement (armure, bouclier) sont résolus par l'appelant
 * via `equipItem` (src/domain/equipment.ts).
 */
export function EquipControl({
  item,
  onEquip,
}: {
  item: InventoryItem;
  onEquip: (slot: EquipSlot) => void;
}) {
  const id = useId();
  return (
    <div className="flex h-9 items-center gap-2">
      <Switch
        id={id}
        checked={currentSlot(item) !== null}
        onCheckedChange={(checked) => onEquip(checked ? "equipped" : null)}
      />
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        Équipé
      </Label>
    </div>
  );
}
