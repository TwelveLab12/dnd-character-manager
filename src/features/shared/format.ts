/** Affiche un modificateur signé (+3, -1, +0) comme sur une fiche D&D papier. */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

const DECIMAL_FORMAT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** Nombre décimal à la française (virgule, 2 décimales au plus) : 12,5 kg, 49,45 po. */
export function formatDecimal(value: number): string {
  return DECIMAL_FORMAT.format(value);
}
