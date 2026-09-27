"use client";

import type { Character } from "@/domain/character";
import type { WeaponPlacement } from "@/domain/equipment";
import {
  canWieldOffHand,
  canWieldTwoHanded,
  weaponGrip,
  weaponPlacement,
} from "@/domain/equipment";
import type { InventoryItem, WeaponHand } from "@/domain/inventory";
import { SegmentedControl } from "@/features/shared/segmented-control";

type Zone = "bag" | "ready" | "hand";

/**
 * Emplacement d'une arme (docs/adr/0054) : Sac · Prête · En main (« Deux mains » pour une arme à
 * deux mains), puis sa prise en main (docs/adr/0057) : Principale · Secondaire · Deux mains. La
 * main secondaire reste visible, grisée, quand l'arme ne le permet pas ; « Deux mains » n'apparaît
 * que pour une arme polyvalente. Les conflits de mains sont résolus par l'appelant via
 * `placeWeapon` (src/domain/equipment.ts).
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
  const zone: Zone = placement === "bag" || placement === "ready" ? placement : "hand";
  const grip = weaponGrip(character, weapon, item.hand);
  const offHandAllowed = canWieldOffHand(character, weapon);
  const name = item.name || "arme";

  return (
    <div className="grid gap-2">
      <SegmentedControl<Zone>
        label={`Emplacement : ${name}`}
        options={[
          { value: "bag", label: "Sac" },
          { value: "ready", label: "Prête" },
          { value: "hand", label: weapon.twoHanded ? "Deux mains" : "En main" },
        ]}
        value={zone}
        onValueChange={(next) => onPlace(next === "hand" ? "main" : next)}
      />
      {zone === "hand" && !weapon.twoHanded && (
        <SegmentedControl<WeaponHand>
          label={`Prise : ${name}`}
          options={[
            { value: "main", label: "Principale" },
            { value: "off", label: "Secondaire", disabled: !offHandAllowed },
            ...(canWieldTwoHanded(weapon) ? [{ value: "both" as const, label: "Deux mains" }] : []),
          ]}
          value={grip}
          onValueChange={onPlace}
        />
      )}
      <p className="text-muted-foreground text-xs">
        {placementCaption(zone, grip, weapon.versatileDamageDice)}
        {zone === "hand" && !weapon.twoHanded && !offHandAllowed && (
          <> Secondaire : arme légère de corps à corps requise (sauf Ambidextre).</>
        )}
      </p>
    </div>
  );
}

function placementCaption(zone: Zone, grip: WeaponHand, versatileDice: string | undefined): string {
  switch (zone) {
    case "bag":
      return "Rangée : pas d’attaque en combat.";
    case "ready":
      return "À la ceinture : attaque listée en combat, à dégainer (interaction gratuite).";
    case "hand":
      switch (grip) {
        case "both":
          return versatileDice
            ? `Occupe les deux mains : dégâts à deux mains (${versatileDice}).`
            : "Occupe les deux mains.";
        case "off":
          return "Main secondaire : attaque en action bonus.";
        case "main":
          return "Prend une main.";
      }
  }
}
