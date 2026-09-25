"use client";

import { useEffect } from "react";
import { useCharacterRepository } from "@/repositories/repository-provider";
import { useCharacterStore } from "@/stores/store-provider";
import { characterPageUrls } from "./character-page-urls";

/** Identifiant du build (voir `next.config.ts`) : change l'URL du script à chaque déploiement. */
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

function isEnabled(): boolean {
  return process.env.NODE_ENV === "production" && "serviceWorker" in navigator;
}

async function warmPages(characterIds: readonly string[]) {
  if (characterIds.length === 0) return;
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: "WARM_PAGES", urls: characterPageUrls(characterIds) });
}

/**
 * Enregistre le service worker hors ligne (production uniquement — en dev il masquerait le
 * rechargement à chaud), demande un stockage persistant et fait mettre en cache les pages de
 * chaque personnage. Ne rend rien. Voir docs/adr/0045-offline-service-worker.md.
 */
export function ServiceWorkerRegistrar() {
  const characterRepository = useCharacterRepository();
  const characterIds = useCharacterStore((state) => state.characters.map((c) => c.id).join("\n"));

  useEffect(() => {
    if (!isEnabled()) return;
    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(BUILD_ID)}`, { scope: "/", updateViaCache: "none" })
      .then(() => characterRepository.list())
      .then((characters) => warmPages(characters.map((c) => c.id)))
      .catch((error: unknown) => console.warn("Service worker non enregistré", error));
    // Protège localStorage de l'éviction automatique du navigateur quand il le permet.
    void navigator.storage?.persist?.().catch(() => false);
  }, [characterRepository]);

  // Personnage créé ou importé pendant la session : ses pages rejoignent le cache.
  useEffect(() => {
    if (!isEnabled() || characterIds === "") return;
    void warmPages(characterIds.split("\n")).catch(() => undefined);
  }, [characterIds]);

  return null;
}
