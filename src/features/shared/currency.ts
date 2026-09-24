import type { Coin } from "@/domain/currency";

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
