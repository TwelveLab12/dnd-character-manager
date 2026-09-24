import { describe, expect, it } from "vitest";
import { EMPTY_CURRENCY, characterCurrency, setCoinAmount, totalInGold } from "./currency";

describe("currency", () => {
  it("treats a character without a stored purse as having no coins", () => {
    expect(characterCurrency({})).toEqual(EMPTY_CURRENCY);
    expect(characterCurrency({ currency: { gold: 12 } })).toEqual({ ...EMPTY_CURRENCY, gold: 12 });
  });

  it("converts the whole purse to gold pieces", () => {
    expect(totalInGold({ platinum: 1, gold: 47, electrum: 2, silver: 23, copper: 15 })).toBeCloseTo(
      60.45,
    );
    expect(totalInGold(EMPTY_CURRENCY)).toBe(0);
  });

  it("keeps coin amounts as non-negative integers", () => {
    expect(setCoinAmount(EMPTY_CURRENCY, "gold", -3).gold).toBe(0);
    expect(setCoinAmount(EMPTY_CURRENCY, "silver", 4.7).silver).toBe(4);
    expect(setCoinAmount(EMPTY_CURRENCY, "copper", Number.NaN).copper).toBe(0);
  });
});
