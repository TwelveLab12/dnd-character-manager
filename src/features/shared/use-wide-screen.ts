"use client";

import { useSyncExternalStore } from "react";

const WIDE_QUERY = "(min-width: 640px)";

// `matchMedia` peut manquer (environnement de test) : on retombe alors sur le panneau à droite.
function wideQuery(): MediaQueryList | undefined {
  return typeof window.matchMedia === "function" ? window.matchMedia(WIDE_QUERY) : undefined;
}

function subscribeWide(onChange: () => void) {
  const query = wideQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

/** Écran d'au moins 640 px : panneau à droite ; sinon, panneau par le bas (glisser pour fermer). */
export function useWideScreen(): boolean {
  return useSyncExternalStore(
    subscribeWide,
    () => wideQuery()?.matches ?? true,
    () => true,
  );
}
