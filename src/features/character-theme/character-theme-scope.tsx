"use client";

import type { ReactNode } from "react";
import { isKnownThemeId } from "./theme-registry";

/**
 * Applique la palette du personnage (voir theme-registry.ts) via un attribut `data-theme` scopé
 * à ce sous-arbre — jamais au niveau racine (`app/layout.tsx`, server component) puisque le thème
 * dépend du personnage affiché, lui-même connu seulement côté client (store). Un `themeId`
 * inconnu ou absent ne pose pas l'attribut : repli silencieux sur la palette neutre par défaut.
 */
export function CharacterThemeScope({
  themeId,
  children,
}: {
  themeId?: string;
  children: ReactNode;
}) {
  return <div data-theme={isKnownThemeId(themeId) ? themeId : undefined}>{children}</div>;
}
