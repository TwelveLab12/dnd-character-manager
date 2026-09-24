"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Character } from "@/domain/character";
import { characterCurrency } from "@/domain/currency";
import type { InventoryItem } from "@/domain/inventory";
import { isGear, sortInventoryByName, totalInventoryWeight } from "@/domain/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EquipControl } from "@/features/shared/equip-control";
import { formatDecimal } from "@/features/shared/format";
import { Purse } from "@/features/shared/purse";
import { QuantityStepper } from "@/features/shared/quantity-stepper";
import { usePlayActions } from "./use-play-actions";

/**
 * Onglet « Inventaire » du mode jeu : bourse et quantités modifiables directement (persistées
 * immédiatement, comme les autres actions du mode jeu), armes et armures équipables ; le reste se
 * configure dans l'onglet Inventaire de la configuration, ouvert par le bouton crayon.
 */
export function InventoryViewTab({ character }: { character: Character }) {
  const { equipItem, adjustItemQuantity, setCoinAmount } = usePlayActions(character.id);
  const gear = sortInventoryByName(character.inventory.filter(isGear));
  const bag = sortInventoryByName(character.inventory.filter((item) => !isGear(item)));

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {character.inventory.length} objet{character.inventory.length > 1 ? "s" : ""} ·{" "}
          {formatDecimal(totalInventoryWeight(character.inventory))} kg
        </p>
        <Button variant="outline" asChild>
          <Link
            href={`/characters/${character.id}/edit?tab=inventory`}
            aria-label="Modifier l’inventaire"
          >
            <Pencil />
            Modifier<span className="max-sm:hidden"> l&rsquo;inventaire</span>
          </Link>
        </Button>
      </div>

      <Purse
        currency={characterCurrency(character)}
        onChange={(coin, amount) => void setCoinAmount(coin, amount)}
      />

      {gear.length > 0 && (
        <ItemSection title="Armes & armures">
          {gear.map((item) => (
            <ItemRow key={item.id} item={item} highlighted={item.equipped === true}>
              <div className="w-full sm:w-48">
                <EquipControl
                  item={item}
                  character={character}
                  onEquip={(slot) => void equipItem(item.id, slot)}
                />
              </div>
            </ItemRow>
          ))}
        </ItemSection>
      )}

      <ItemSection title="Sac">
        {bag.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun objet pour l&rsquo;instant.</p>
        ) : (
          bag.map((item) => (
            <ItemRow key={item.id} item={item} highlighted={false}>
              <QuantityStepper
                label={item.name}
                quantity={item.quantity}
                onAdjust={(delta) => void adjustItemQuantity(item.id, delta)}
              />
            </ItemRow>
          ))
        )}
      </ItemSection>
    </div>
  );
}

function ItemSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="grid gap-2">
      <h3 className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ItemRow({
  item,
  highlighted,
  children,
}: {
  item: InventoryItem;
  highlighted: boolean;
  children: ReactNode;
}) {
  const details = [
    item.weight !== undefined ? `${formatDecimal(item.weight)} kg` : undefined,
    item.description,
  ].filter(Boolean);

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border py-2.5 pr-2.5 pl-3.5 ${
        highlighted ? "border-primary/30 bg-primary/5" : "bg-background/35"
      } ${item.quantity === 0 ? "opacity-60" : ""}`}
    >
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <span className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
          {item.name}
          {!item.weapon && !item.armor && item.equipped && (
            <Badge variant="secondary">Équipé</Badge>
          )}
        </span>
        {details.length > 0 && (
          <span className="text-muted-foreground text-xs">{details.join(" · ")}</span>
        )}
      </div>
      {children}
    </div>
  );
}
