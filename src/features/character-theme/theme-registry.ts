export interface CharacterTheme {
  id: string;
  label: string;
  /** Trois couleurs représentatives (fond, accent, lueur) pour l'aperçu du sélecteur de thème. */
  swatches: readonly [string, string, string];
}

/** Aperçu du thème par défaut (gris neutres de `:root`, src/app/globals.css). */
export const DEFAULT_THEME_SWATCHES: readonly [string, string, string] = [
  "#1b1b1f",
  "#ebebeb",
  "#8a8a8a",
];

/**
 * Palettes visuelles disponibles, sélectionnables par personnage (voir
 * docs/adr/0013-per-character-visual-theme.md). Chaque id doit avoir un bloc
 * `[data-theme="<id>"]` correspondant dans src/app/globals.css.
 */
export const CHARACTER_THEMES: readonly CharacterTheme[] = [
  { id: "selune", label: "Séluné (Lune, Clerc)", swatches: ["#0e1120", "#d6b25f", "#8fa9ff"] },
  {
    id: "forge-naine",
    label: "Forge naine (Ours, Barbare)",
    swatches: ["#14100d", "#e8913a", "#9fb0bb"],
  },
  {
    id: "ombreflore",
    label: "Ombreflore (Spores, Druide)",
    swatches: ["#0e1511", "#c792d8", "#7fc4c0"],
  },
];

export function isKnownThemeId(themeId: string | undefined): boolean {
  return themeId !== undefined && CHARACTER_THEMES.some((theme) => theme.id === themeId);
}
