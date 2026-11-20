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
      className="grid gap-3 rounded-2xl border border-primary/30 bg-background/50 p-3.5 sm:p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <SectionTitle className="text-base">Bourse</SectionTitle>
        <p className="text-xs text-muted-foreground">
          ≈{" "}
          <span className="font-heading text-lg font-bold text-primary tabular-nums">
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
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-1 pt-2 pb-1.5">
      <span className="flex items-center gap-1.5">
        <span aria-hidden className={`size-3 rounded-full ring-2 ring-inset ${label.tokenClass}`} />
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">
          {label.abbreviation}
        </span>
      </span>
      {/* Repère de focus (WCAG 1.4.11, #183) : la bordure pointillée devient pleine, plus un
          contour de 2 px comme les PV temporaires ; la bordure seule ne fait qu'un trait de 1 px. */}
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
        className="w-full [appearance:textfield] border-b border-dashed border-border bg-transparent text-center font-heading text-xl font-bold tabular-nums outline-none focus:border-solid focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring focus-visible:outline-solid sm:text-2xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <label htmlFor={id} className="text-[11px] text-muted-foreground">
        {label.name}
      </label>
    </div>
  );
}
