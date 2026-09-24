"use client";

import type { Character } from "@/domain/character";
import { Badge } from "@/components/ui/badge";
import { EquipControl } from "@/features/shared/equip-control";
import { usePlayActions } from "./use-play-actions";

export function InventoryViewTab({ character }: { character: Character }) {
  const { equipItem } = usePlayActions(character.id);

  if (character.inventory.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucun objet pour l&rsquo;instant.</p>;
  }

  return (
    <div className="grid gap-3">
      {character.inventory.map((item) => {
        // Armes, armures et boucliers s'équipent en partie (changement d'arme, retrait d'armure) ;
        // les autres objets gardent un simple badge.
        const equippable = item.weapon !== undefined || item.armor !== undefined;
        return (
          <div
            key={item.id}
            className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_12rem] sm:items-center"
          >
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                {item.weight !== undefined && (
                  <span className="text-muted-foreground text-xs">{item.weight} kg</span>
                )}
                {!equippable && item.equipped && <Badge variant="secondary">Équipé</Badge>}
              </div>
              {item.description && (
                <p className="text-muted-foreground text-xs">{item.description}</p>
              )}
            </div>
            {equippable && (
              <EquipControl
                item={item}
                character={character}
                onEquip={(slot) => void equipItem(item.id, slot)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
