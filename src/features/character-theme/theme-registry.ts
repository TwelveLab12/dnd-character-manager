export interface CharacterTheme {
  id: string;
  label: string;
}

/**
 * Palettes visuelles disponibles, sélectionnables par personnage (voir
 * docs/adr/0013-per-character-visual-theme.md). Chaque id doit avoir un bloc
 * `[data-theme="<id>"]` correspondant dans src/app/globals.css.
 */
export const CHARACTER_THEMES: readonly CharacterTheme[] = [
  { id: "selune", label: "Séluné (Lune, Clerc)" },
];

export function isKnownThemeId(themeId: string | undefined): boolean {
  return themeId !== undefined && CHARACTER_THEMES.some((theme) => theme.id === themeId);
}
