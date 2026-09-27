"use client";

import { useCallback, useSyncExternalStore } from "react";
import { LATEST_CHANGELOG_ID } from "./changelog-entries";

/** Préférence d'affichage propre à l'appareil, hors données de personnage : ni repository, ni
 * sauvegarde (docs/adr/0058). */
const STORAGE_KEY = "dnd-character-manager:changelog-seen";

const listeners = new Set<() => void>();

/** Dernière nouveauté vue avant la première visite de la page dans cette session (`undefined` :
 * pas encore ouverte) — garde les « Nouveau » affichés une fois la plus récente marquée vue, y
 * compris au double montage du mode strict de React. */
let seenBeforeVisit: string | null | undefined;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readSeenId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Visite de la page « Nouveautés » : `seenBeforeVisit` est la dernière nouveauté vue avant cette
 * visite (`null` : aucune ; `undefined` : visite pas encore commencée, ou rendu serveur), et
 * `startVisit` la fige (une fois par session) puis marque la plus récente comme vue.
 */
export function useChangelogVisit() {
  const seenBefore = useSyncExternalStore(
    subscribe,
    () => seenBeforeVisit,
    () => undefined,
  );

  const startVisit = useCallback(() => {
    if (seenBeforeVisit !== undefined) {
      return;
    }
    seenBeforeVisit = readSeenId();
    if (LATEST_CHANGELOG_ID && seenBeforeVisit !== LATEST_CHANGELOG_ID) {
      try {
        window.localStorage.setItem(STORAGE_KEY, LATEST_CHANGELOG_ID);
      } catch {
        // Stockage indisponible (navigation privée…) : la pastille restera affichée.
      }
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { seenBeforeVisit: seenBefore, startVisit };
}

/** Une nouveauté n'a pas encore été vue sur cet appareil. Faux au rendu serveur. */
export function useHasUnseenChangelog(): boolean {
  const seenId = useSyncExternalStore(subscribe, readSeenId, () => LATEST_CHANGELOG_ID ?? null);
  return LATEST_CHANGELOG_ID !== undefined && seenId !== LATEST_CHANGELOG_ID;
}

/** Réinitialise la visite en cours — pour les tests uniquement. */
export function resetChangelogVisitForTests() {
  seenBeforeVisit = undefined;
}
