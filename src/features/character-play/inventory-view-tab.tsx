"use client";

import { Minus, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import type { Character } from "@/domain/character";
import type { Coin, Currency } from "@/domain/currency";
import { COINS, characterCurrency, totalInGold } from "@/domain/currency";
import type { InventoryItem } from "@/domain/inventory";
import { totalInventoryWeight } from "@/domain/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { COIN_LABELS } from "@/features/shared/currency";
import { EquipControl } from "@/features/shared/equip-control";
import { formatDecimal } from "@/features/shared/format";
import { usePlayActions } from "./use-play-actions";

/**
 * Onglet « Inventaire » du mode jeu : bourse et quantités modifiables directement (persistées
 * immédiatement, comme les autres actions du mode jeu), armes et armures équipables ; le reste se
 * configure dans l'onglet Inventaire de la configuration, ouvert par le bouton crayon.
 */
export function InventoryViewTab({ character }: { character: Character }) {
  const { equipItem, adjustItemQuantity, setCoinAmount } = usePlayActions(character.id);
  const gear = character.inventory.filter((item) => item.weapon ?? item.armor);
  const bag = character.inventory.filter((item) => !item.weapon && !item.armor);

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
                item={item}
                onAdjust={(delta) => void adjustItemQuantity(item.id, delta)}
              />
            </ItemRow>
          ))
        )}
      </ItemSection>
    </div>
  );
}

function Purse({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange: (coin: Coin, amount: number) => void;
}) {
  return (
    <section
      aria-label="Bourse"
      className="border-primary/30 bg-background/50 grid gap-3 rounded-2xl border p-3.5 sm:p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <SectionTitle className="text-base">Bourse</SectionTitle>
        <p className="text-muted-foreground text-xs">
          ≈{" "}
          <span className="font-heading text-primary text-lg font-bold tabular-nums">
            {formatDecimal(totalInGold(currency))}
          </span>{" "}
          po au total
        </p>
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {COINS.map((coin) => (
          <CoinField
            // Réinitialise la saisie en cours quand la valeur enregistrée change ailleurs.
            key={`${coin}-${currency[coin]}`}
            coin={coin}
            amount={currency[coin]}
            onCommit={(amount) => onChange(coin, amount)}
          />
        ))}
      </div>
    </section>
  );
}

/** Nombre de pièces d'une monnaie, modifiable sur place ; enregistré à la sortie du champ. */
function CoinField({
  coin,
  amount,
  onCommit,
}: {
  coin: Coin;
  amount: number;
  onCommit: (amount: number) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(String(amount));
  const label = COIN_LABELS[coin];

  function commit() {
    const parsed = Number.parseInt(value, 10);
    const next = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    setValue(String(next));
    if (next !== amount) {
      onCommit(next);
    }
  }

  return (
    <div className="bg-card flex flex-col items-center gap-1 rounded-xl border px-1 pt-2 pb-1.5">
      <span className="flex items-center gap-1.5">
        <span aria-hidden className={`size-3 rounded-full ring-2 ring-inset ${label.tokenClass}`} />
        <span className="text-muted-foreground text-[11px] font-semibold tracking-wider">
          {label.abbreviation}
        </span>
      </span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className="font-heading border-border focus:border-ring w-full [appearance:textfield] border-b border-dashed bg-transparent text-center text-xl font-bold tabular-nums outline-none sm:text-2xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <label htmlFor={id} className="text-muted-foreground text-[11px]">
        {label.name}
      </label>
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

function QuantityStepper({
  item,
  onAdjust,
}: {
  item: InventoryItem;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="bg-card flex items-center overflow-hidden rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="rounded-none"
        aria-label={`Retirer 1 ${item.name}`}
        disabled={item.quantity === 0}
        onClick={() => onAdjust(-1)}
      >
        <Minus />
      </Button>
      <span
        className={`min-w-9 text-center text-[15px] font-semibold tabular-nums ${
          item.quantity === 0 ? "text-destructive" : ""
        }`}
      >
        {item.quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="rounded-none"
        aria-label={`Ajouter 1 ${item.name}`}
        onClick={() => onAdjust(1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
