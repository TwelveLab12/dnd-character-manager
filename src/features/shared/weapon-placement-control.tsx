"use client";

import type { Character } from "@/domain/character";
import type { WeaponPlacement } from "@/domain/equipment";
import { canWieldOffHand, weaponPlacement } from "@/domain/equipment";
import type { InventoryItem } from "@/domain/inventory";
import { SegmentedControl } from "@/features/shared/segmented-control";

type Zone = "bag" | "ready" | "hand";

/**
 * Emplacement d'une arme (docs/adr/0054) : Sac · Prête · En main (« Deux mains » pour une arme à
 * deux mains), puis la main pour une arme qui peut aller en main secondaire. Les conflits de mains
 * sont résolus par l'appelant via `placeWeapon` (src/domain/equipment.ts).
 */
export function WeaponPlacementControl({
  item,
  character,
  onPlace,
}: {
  item: InventoryItem;
  character: Pick<Character, "dualWielder">;
  onPlace: (placement: WeaponPlacement) => void;
}) {
  const weapon = item.weapon;
  if (!weapon) {
    return null;
  }
  const placement = weaponPlacement(item);
  const zone: Zone = placement === "main" || placement === "off" ? "hand" : placement;
  const offHandAllowed = !weapon.twoHanded && canWieldOffHand(character, weapon);

  return (
    <div className="grid gap-2">
      <SegmentedControl<Zone>
        label={`Emplacement : ${item.name || "arme"}`}
        options={[
          { value: "bag", label: "Sac" },
          { value: "ready", label: "Prête" },
          { value: "hand", label: weapon.twoHanded ? "Deux mains" : "En main" },
        ]}
        value={zone}
        onValueChange={(next) => onPlace(next === "hand" ? "main" : next)}
      />
      {zone === "hand" && offHandAllowed && (
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground flex-1 text-xs">Main</span>
          <SegmentedControl<"main" | "off">
            label={`Main : ${item.name || "arme"}`}
            options={[
              { value: "main", label: "Principale" },
              { value: "off", label: "Secondaire" },
            ]}
            value={placement === "off" ? "off" : "main"}
            onValueChange={onPlace}
          />
        </div>
      )}
      <p className="text-muted-foreground text-xs">{placementCaption(zone, weapon.twoHanded)}</p>
    </div>
  );
}

function placementCaption(zone: Zone, twoHanded: boolean | undefined): string {
  switch (zone) {
    case "bag":
      return "Rangée : pas d’attaque en combat.";
    case "ready":
      return "À la ceinture : attaque listée en combat, à dégainer (interaction gratuite).";
    case "hand":
      return twoHanded ? "Occupe les deux mains." : "Prend une main.";
  }
}
