"use client";

import { useId, useState } from "react";
import type { Coin, Currency } from "@/domain/currency";
import { COINS, totalInGold } from "@/domain/currency";
import { SectionTitle } from "@/components/ui/section-title";
import { COIN_LABELS } from "@/features/shared/currency";
import { formatDecimal } from "@/features/shared/format";

/**
 * Bourse du personnage, commune au mode jeu et à la configuration (docs/adr/0029, 0036) : une
 * pièce par jeton, modifiable sur place, et le total converti en po.
 */
export function Purse({
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
