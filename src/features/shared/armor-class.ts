import type { ArmorClassResult } from "@/domain/calculations/armor-class";
import type { ArmorCategory } from "@/domain/inventory";

export const ARMOR_CATEGORY_LABELS: Record<ArmorCategory, string> = {
  light: "légère",
  medium: "intermédiaire",
  heavy: "lourde",
  shield: "bouclier",
};

/** Détail compact du calcul de CA, ex : « Cuirasse 14 + Dex 2 + Bouclier 2 ». */
export function formatArmorClassBreakdown(result: ArmorClassResult): string {
  return result.breakdown
    .map((part, index) => {
      const value = `${part.label} ${Math.abs(part.value)}`;
      if (index === 0) {
        return part.value < 0 ? `${part.label} -${Math.abs(part.value)}` : value;
      }
      return `${part.value < 0 ? "−" : "+"} ${value}`;
    })
    .join(" ");
}
