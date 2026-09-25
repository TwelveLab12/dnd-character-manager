"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Character } from "@/domain/character";
import { characterCurrency } from "@/domain/currency";
import type { InventoryItem } from "@/domain/inventory";
import { isGear, sortInventoryByName, totalInventoryWeight } from "@/domain/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailsHint } from "@/features/shared/detail-sheet";
import { EquipControl } from "@/features/shared/equip-control";
import { WeaponPlacementControl } from "@/features/shared/weapon-placement-control";
import { formatDecimal } from "@/features/shared/format";
import { formatInventoryValue, formatItemValue } from "@/features/shared/currency";
import { Purse } from "@/features/shared/purse";
import { QuantityStepper } from "@/features/shared/quantity-stepper";
import type { PlayDetail } from "./play-detail-sheet";
import { PlayDetailSheet } from "./play-detail-sheet";
import { usePlayActions } from "./use-play-actions";

/**
 * Onglet « Inventaire » du mode jeu : bourse et quantités modifiables directement (persistées
 * immédiatement, comme les autres actions du mode jeu), armes à placer (sac, prête, en main —
 * docs/adr/0054) et armures équipables ; le reste se
 * configure dans l'onglet Inventaire de la configuration, ouvert par le bouton crayon. Chaque ligne
 * ouvre le panneau de détail de l'objet (docs/adr/0043).
 */
export function InventoryViewTab({ character }: { character: Character }) {
  const { equipItem, placeWeapon, adjustItemQuantity, setCoinAmount } = usePlayActions(
    character.id,
  );
  const [detail, setDetail] = useState<PlayDetail | undefined>();
  const showItem = (itemId: string) => setDetail({ kind: "item", itemId });
  const gear = sortInventoryByName(character.inventory.filter(isGear));
  const bag = sortInventoryByName(character.inventory.filter((item) => !isGear(item)));

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {character.inventory.length} objet{character.inventory.length > 1 ? "s" : ""} ·{" "}
          {formatDecimal(totalInventoryWeight(character.inventory))} kg
          {formatInventoryValue(character.inventory)}
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
            <ItemRow
              key={item.id}
              item={item}
              highlighted={item.equipped === true}
              onShowDetails={() => showItem(item.id)}
            >
              {item.weapon ? (
                <div className="relative z-10 w-full sm:w-80">
                  <WeaponPlacementControl
                    item={item}
                    character={character}
                    onPlace={(placement) => void placeWeapon(item.id, placement)}
                  />
                </div>
              ) : (
                <div className="relative z-10 w-full sm:w-48">
                  <EquipControl item={item} onEquip={(slot) => void equipItem(item.id, slot)} />
                </div>
              )}
            </ItemRow>
          ))}
        </ItemSection>
      )}

      <ItemSection title="Sac">
        {bag.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun objet pour l&rsquo;instant.</p>
        ) : (
          bag.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              highlighted={false}
              onShowDetails={() => showItem(item.id)}
            >
              <div className="relative z-10">
                <QuantityStepper
                  label={item.name}
                  quantity={item.quantity}
                  onAdjust={(delta) => void adjustItemQuantity(item.id, delta)}
                />
              </div>
            </ItemRow>
          ))
        )}
      </ItemSection>

      <PlayDetailSheet character={character} detail={detail} onClose={() => setDetail(undefined)} />
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

/** Ligne d'objet : toute la ligne ouvre le détail, les contrôles (`children`) passent au-dessus. */
function ItemRow({
  item,
  highlighted,
  onShowDetails,
  children,
}: {
  item: InventoryItem;
  highlighted: boolean;
  onShowDetails: () => void;
  children: ReactNode;
}) {
  // La description se lit dans le panneau de détail, pas tassée sur la ligne.
  const details =
    [
      item.weight !== undefined ? `${formatDecimal(item.weight)} kg` : undefined,
      item.value ? formatItemValue(item.value) : undefined,
    ]
      .filter(Boolean)
      .join(" · ") || undefined;

  return (
    <div
      className={`relative flex flex-wrap items-center gap-3 rounded-xl border py-2.5 pr-2.5 pl-3.5 ${
        highlighted ? "border-primary/30 bg-primary/5" : "bg-background/35"
      } ${item.quantity === 0 ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        aria-label={`Détails : ${item.name}`}
        onClick={onShowDetails}
        className="hover:bg-foreground/[0.03] focus-visible:ring-ring/50 absolute inset-0 cursor-pointer rounded-xl outline-none focus-visible:ring-3"
      />
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <span className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
          {item.name}
          <DetailsHint className="size-3.5" />
          {!item.weapon && !item.armor && item.equipped && (
            <Badge variant="secondary">Équipé</Badge>
          )}
        </span>
        {details && <span className="text-muted-foreground text-xs">{details}</span>}
      </div>
      {children}
    </div>
  );
}
