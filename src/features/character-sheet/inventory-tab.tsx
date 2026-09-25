"use client";

import { Backpack, ChevronDown, Plus, Shield, Shirt, Sword } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { cn } from "cn";
import type { EquipSlot } from "@/domain/equipment";
import { equipItem, placeWeapon } from "@/domain/equipment";
import { characterCurrency, setCoinAmount } from "@/domain/currency";
import { generateId } from "@/domain/id";
import type { InventoryItem } from "@/domain/inventory";
import { isGear, sortInventoryByName, totalInventoryWeight } from "@/domain/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ARMOR_CATEGORY_LABELS } from "@/features/shared/armor-class";
import { EquipControl } from "@/features/shared/equip-control";
import { WeaponPlacementControl } from "@/features/shared/weapon-placement-control";
import { formatDecimal } from "@/features/shared/format";
import { Purse } from "@/features/shared/purse";
import { DAMAGE_TYPE_LABELS, WEAPON_CATEGORY_LABELS } from "@/features/shared/weapon";
import { InventoryItemEditor } from "./inventory-item-editor";
import { itemKind, newItem, type ItemKind } from "./inventory-item-kind";
import type { CharacterTabProps } from "./types";

/**
 * Onglet Inventaire de la configuration (docs/adr/0036) : la bourse, puis les objets en deux
 * groupes triés par nom (« Armes & armures », « Sac »). Chaque objet tient sur une ligne résumée,
 * avec l'emplacement d'une arme (sac, prête, en main — docs/adr/0054) ;
 * un seul se déplie à la fois pour être modifié, avec les champs propres à son type.
 */
export function InventoryTab({ draft, onChange }: CharacterTabProps) {
  // Objet déplié et son nom à l'ouverture : l'ordre alphabétique utilise ce nom figé, pour que
  // l'objet ne change pas de place (et ne perde pas le focus) pendant qu'on le renomme.
  const [open, setOpen] = useState<{ id: string; name: string } | null>(null);
  const openId = open?.id ?? null;
  const nameOf = (item: InventoryItem) => (item.id === openId ? (open?.name ?? "") : item.name);
  const currency = characterCurrency(draft);
  const gear = sortInventoryByName(draft.inventory.filter(isGear), nameOf);
  const bag = sortInventoryByName(
    draft.inventory.filter((item) => !isGear(item)),
    nameOf,
  );

  function setOpenId(id: string | null) {
    const item = draft.inventory.find((candidate) => candidate.id === id);
    setOpen(id ? { id, name: item?.name ?? "" } : null);
  }

  function updateItem(id: string, patch: Partial<InventoryItem>) {
    onChange({
      inventory: draft.inventory.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function addItem(kind: ItemKind) {
    const item = newItem(generateId(), kind);
    onChange({ inventory: [...draft.inventory, item] });
    setOpen({ id: item.id, name: "" });
  }

  function renderItems(items: InventoryItem[]) {
    return items.map((item) => (
      <ItemCard
        key={item.id}
        item={item}
        open={openId === item.id}
        onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        trailing={
          item.weapon ? (
            <div className="w-full sm:w-72">
              <WeaponPlacementControl
                item={item}
                character={draft}
                onPlace={(placement) =>
                  onChange({ inventory: placeWeapon(draft, item.id, placement) })
                }
              />
            </div>
          ) : isGear(item) ? (
            <div className="w-full sm:w-44">
              <EquipControl
                item={item}
                onEquip={(slot: EquipSlot) =>
                  onChange({ inventory: equipItem(draft, item.id, slot) })
                }
              />
            </div>
          ) : item.quantity !== 1 ? (
            <span className="text-muted-foreground text-sm font-semibold tabular-nums">
              ×{item.quantity}
            </span>
          ) : null
        }
      >
        <InventoryItemEditor
          item={item}
          character={draft}
          onChange={(patch) => updateItem(item.id, patch)}
          onEquip={(slot) => onChange({ inventory: equipItem(draft, item.id, slot) })}
          onRemove={() => {
            onChange({ inventory: draft.inventory.filter((other) => other.id !== item.id) });
            setOpenId(null);
          }}
          onClose={() => setOpenId(null)}
        />
      </ItemCard>
    ));
  }

  return (
    <div className="grid gap-7 pt-2">
      <Purse
        currency={currency}
        onChange={(coin, amount) => onChange({ currency: setCoinAmount(currency, coin, amount) })}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <h3 className="font-heading text-xl font-semibold">Objets</h3>
          <p className="text-muted-foreground text-sm">
            {draft.inventory.length} objet{draft.inventory.length > 1 ? "s" : ""} ·{" "}
            {formatDecimal(totalInventoryWeight(draft.inventory))} kg portés
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-label="Ajouter une arme"
            onClick={() => addItem("weapon")}
          >
            <Plus />
            Arme
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-label="Ajouter une armure"
            onClick={() => addItem("armor")}
          >
            <Plus />
            Armure
          </Button>
          <Button
            type="button"
            size="lg"
            aria-label="Ajouter un objet"
            onClick={() => addItem("item")}
          >
            <Plus />
            Objet
          </Button>
        </div>
      </div>

      <ItemGroup title="Armes & armures" items={gear} empty="Aucune arme ni armure.">
        {renderItems(gear)}
      </ItemGroup>
      <ItemGroup title="Sac" items={bag} empty="Aucun objet pour l’instant.">
        {renderItems(bag)}
      </ItemGroup>
    </div>
  );
}

function ItemGroup({
  title,
  items,
  empty,
  children,
}: {
  title: string;
  items: InventoryItem[];
  empty: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          {title}
        </h4>
        {items.length > 0 && (
          <span className="text-muted-foreground text-xs">
            {formatDecimal(totalInventoryWeight(items))} kg
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-center text-sm">
          {empty}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

const KIND_ICONS: Record<ItemKind, typeof Sword> = {
  weapon: Sword,
  armor: Shirt,
  shield: Shield,
  item: Backpack,
};

/** Résumé d'une ligne, ex : « Arme courante · 1d6 contondant · 2 kg ». */
function itemSummary(item: InventoryItem): string {
  const { weapon, armor } = item;
  const magic = weapon?.magicBonus ?? item.armorClassBonus;
  const parts = [
    weapon
      ? `Arme ${WEAPON_CATEGORY_LABELS[weapon.category]} · ${weapon.damageDice} ${
          DAMAGE_TYPE_LABELS[weapon.damageType]
        }${weapon.range === "ranged" ? " · distance" : ""}`
      : armor
        ? armor.category === "shield"
          ? `Bouclier · +${armor.baseArmorClass} CA`
          : `Armure ${ARMOR_CATEGORY_LABELS[armor.category]} · CA ${armor.baseArmorClass}`
        : item.description,
    magic ? `+${magic} magique` : undefined,
    item.weight !== undefined ? `${formatDecimal(item.weight)} kg` : undefined,
  ];
  return parts.filter(Boolean).join(" · ");
}

function ItemCard({
  item,
  open,
  onToggle,
  trailing,
  children,
}: {
  item: InventoryItem;
  open: boolean;
  onToggle: () => void;
  trailing: ReactNode;
  children: ReactNode;
}) {
  const panelId = useId();
  const kind = itemKind(item);
  const Icon = KIND_ICONS[kind];
  const summary = itemSummary(item);
  const equipped = item.equipped === true;

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        open
          ? "border-primary/50 bg-background/70"
          : equipped && kind !== "item"
            ? "border-primary/30 bg-primary/5"
            : "bg-background/35",
        item.quantity === 0 && !open && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 py-2 pr-2 pl-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="focus-visible:ring-ring/50 flex min-w-0 flex-1 basis-56 items-center gap-3 rounded-lg py-1 text-left outline-none focus-visible:ring-3"
        >
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              kind === "item" ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
            )}
          >
            <Icon className="size-4.5" />
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
              {item.name || "Nouvel objet"}
              {kind === "item" && equipped && <Badge variant="secondary">Équipé</Badge>}
            </span>
            {summary && <span className="text-muted-foreground truncate text-xs">{summary}</span>}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "text-muted-foreground size-4.5 shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {trailing}
      </div>
      {open && (
        <div id={panelId} className="border-t p-4">
          {children}
        </div>
      )}
    </div>
  );
}
