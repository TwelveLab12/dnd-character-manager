/**
 * Onglets miroirs du mode jeu et de la configuration d'un personnage (docs/adr/0067) : « Modifier »
 * et « Voir la fiche » ouvrent l'onglet correspondant à celui affiché.
 */
export const PLAY_TABS = [
  "combat",
  "abilities",
  "spells",
  "inventory",
  "features",
  "notes",
] as const;
export type PlayTab = (typeof PLAY_TABS)[number];

export const CONFIG_TABS = ["general", "abilities", "spells", "inventory", "features"] as const;
export type ConfigTab = (typeof CONFIG_TABS)[number];

export function toPlayTab(value: string | undefined): PlayTab {
  return PLAY_TABS.find((tab) => tab === value) ?? "combat";
}

export function toConfigTab(value: string | undefined): ConfigTab {
  return CONFIG_TABS.find((tab) => tab === value) ?? "general";
}

/** Combat et Notes se règlent dans Général ; les autres onglets portent le même nom. */
export function configTabFor(tab: PlayTab): ConfigTab {
  return tab === "combat" || tab === "notes" ? "general" : tab;
}

/** Général regroupe ce que montre l'onglet Combat. */
export function playTabFor(tab: ConfigTab): PlayTab {
  return tab === "general" ? "combat" : tab;
}

export function characterPlayHref(characterId: string, tab: PlayTab): string {
  return tab === "combat" ? `/characters/${characterId}` : `/characters/${characterId}?tab=${tab}`;
}

export function characterEditHref(characterId: string, tab: ConfigTab): string {
  return tab === "general"
    ? `/characters/${characterId}/edit`
    : `/characters/${characterId}/edit?tab=${tab}`;
}

/** Garde l'onglet dans l'URL (rechargement, retour arrière) sans nouvelle entrée d'historique. */
export function rememberTabInUrl(tab: string, defaultTab: string) {
  const url = new URL(window.location.href);
  if (tab === defaultTab) {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", tab);
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
