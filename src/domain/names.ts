const NAME_COLLATOR = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

/**
 * Ordre alphabétique d'affichage (docs/adr/0036) : sans tenir compte des majuscules ni des
 * accents ; un nom vide (élément juste ajouté) va à la fin.
 */
export function compareNames(a: string, b: string): number {
  const aName = a.trim();
  const bName = b.trim();
  if (!aName || !bName) {
    return aName ? -1 : bName ? 1 : 0;
  }
  return NAME_COLLATOR.compare(aName, bName);
}
