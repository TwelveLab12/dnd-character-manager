"use client";

import { Maximize, Minimize } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

/**
 * Bascule plein écran de la page (API Fullscreen) : sur tablette, la barre du navigateur prend
 * beaucoup de place. Rien n'est affiché si le navigateur ne permet pas le plein écran (ex :
 * Safari sur iPhone), ni au rendu serveur.
 */
export function FullscreenToggle() {
  const supported = useSyncExternalStore(
    subscribe,
    () => document.fullscreenEnabled === true,
    () => false,
  );
  const fullscreen = useSyncExternalStore(
    subscribe,
    () => document.fullscreenElement !== null,
    () => false,
  );

  if (!supported) {
    return null;
  }

  const label = fullscreen ? "Quitter le plein écran" : "Plein écran";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      title={label}
      onClick={() =>
        void (
          fullscreen ? document.exitFullscreen() : document.documentElement.requestFullscreen()
        ).catch(() => {
          // Refus du navigateur (geste non reconnu, politique) : on reste dans l'état actuel.
        })
      }
    >
      {fullscreen ? <Minimize /> : <Maximize />}
    </Button>
  );
}
