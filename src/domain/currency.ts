/** Les cinq monnaies de D&D 5e, de la plus forte à la plus faible. */
export const COINS = ["platinum", "gold", "electrum", "silver", "copper"] as const;

export type Coin = (typeof COINS)[number];

/** Pièces possédées, par monnaie (entiers ≥ 0). */
export type Currency = Record<Coin, number>;

/** Valeur de chaque pièce en pièces de cuivre (1 po = 10 pa = 100 pc, 1 pp = 10 po, 1 pe = ½ po). */
export const COIN_VALUE_IN_COPPER: Record<Coin, number> = {
  platinum: 1000,
  gold: 100,
  electrum: 50,
  silver: 10,
  copper: 1,
};

export const EMPTY_CURRENCY: Currency = {
  platinum: 0,
  gold: 0,
  electrum: 0,
  silver: 0,
  copper: 0,
};

/** Bourse d'un personnage : une fiche sans bourse enregistrée a 0 pièce de chaque monnaie. */
export function characterCurrency(character: { currency?: Partial<Currency> }): Currency {
  return { ...EMPTY_CURRENCY, ...character.currency };
}

/** Fixe le nombre de pièces d'une monnaie, ramené à un entier ≥ 0. */
export function setCoinAmount(currency: Currency, coin: Coin, amount: number): Currency {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 0;
  return { ...currency, [coin]: safe };
}

/** Valeur totale de la bourse, en pièces d'or (peut être fractionnaire : 15 pc = 0,15 po). */
export function totalInGold(currency: Currency): number {
  const copper = COINS.reduce((sum, coin) => sum + currency[coin] * COIN_VALUE_IN_COPPER[coin], 0);
  return copper / COIN_VALUE_IN_COPPER.gold;
}
