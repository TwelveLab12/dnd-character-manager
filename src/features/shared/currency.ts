import type { Coin } from "@/domain/currency";
import type { InventoryItem, ItemValue } from "@/domain/inventory";
import { totalInventoryValueInGold } from "@/domain/inventory";
import { formatDecimal } from "./format";

/** Libellés français des monnaies (abréviations du Manuel des joueurs) et couleur du jeton. */
export const COIN_LABELS: Record<Coin, { abbreviation: string; name: string; tokenClass: string }> =
  {
    platinum: {
      abbreviation: "pp",
      name: "Platine",
      tokenClass: "bg-[#dfe4f0] ring-[#9aa3bb]",
    },
    gold: { abbreviation: "po", name: "Or", tokenClass: "bg-[#d6b25f] ring-[#8c6f2c]" },
    electrum: {
      abbreviation: "pe",
      name: "Électrum",
      tokenClass: "bg-[#c8c48a] ring-[#7f7b4a]",
    },
    silver: { abbreviation: "pa", name: "Argent", tokenClass: "bg-[#b8bfd0] ring-[#6f768a]" },
    copper: { abbreviation: "pc", name: "Cuivre", tokenClass: "bg-[#c07a4f] ring-[#7a4526]" },
  };

/** Valeur d'un objet, ex : « 50 po », « 2 pa ». */
export function formatItemValue(value: ItemValue): string {
  return `${formatDecimal(value.amount)} ${COIN_LABELS[value.coin].abbreviation}`;
}

/** Suffixe « · 123,5 po » de valeur totale de l'inventaire, vide si aucun objet n'a de valeur. */
export function formatInventoryValue(inventory: readonly InventoryItem[]): string {
  return inventory.some((item) => item.value)
    ? ` · ${formatDecimal(totalInventoryValueInGold(inventory))} po`
    : "";
}
