/**
 * Service worker maison — fonctionnement hors ligne de l'application (voir
 * docs/adr/0045-offline-service-worker.md).
 *
 * Toutes les données vivent déjà dans localStorage : seul le code de l'application (HTML des pages
 * + fichiers `/_next/static`) a besoin du réseau. Stratégies :
 *
 * - `/_next/static/*`, icônes, manifest : cache d'abord (fichiers hashés, donc immuables) ;
 * - navigations (HTML) : réseau d'abord, repli sur le cache (hors ligne ou réseau trop lent), puis
 *   sur `/offline` pour une page jamais ouverte ;
 * - requêtes RSC (navigations côté client) : réseau uniquement — hors ligne elles échouent, et le
 *   routeur Next retombe alors sur une navigation complète, que ce service worker sert depuis le
 *   cache.
 *
 * Les pages de personnage (`/characters/[id]`) sont rendues à la demande : le client envoie la
 * liste de leurs URL (message `WARM_PAGES`) pour qu'elles soient mises en cache à l'avance.
 *
 * Version = identifiant du build (`/sw.js?v=…`) : un nouveau déploiement installe un nouveau
 * service worker qui repart de caches neufs et supprime les anciens.
 */

const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHED_PAGES = ["/", "/spells", OFFLINE_URL];
const PRECACHED_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];
/** Au-delà, une navigation lente est servie depuis le cache (le réseau met quand même le cache à jour). */
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(PRECACHED_ASSETS);
      await Promise.all(PRECACHED_PAGES.map((url) => cachePage(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.type === "WARM_PAGES" && Array.isArray(data.urls)) {
    event.waitUntil(warmPages(data.urls));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isRscRequest(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event, request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || PRECACHED_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

function isRscRequest(request, url) {
  return request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

async function handleNavigation(event, request) {
  const network = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      await cache.put(request, response.clone());
      event.waitUntil(cacheReferencedAssets(await response.clone().text()));
    }
    return response;
  });
  // Évite une promesse rejetée non gérée si le repli cache a déjà répondu.
  event.waitUntil(network.catch(() => undefined));

  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS, null));
  try {
    const response = await Promise.race([network, timeout]);
    if (response) return response;
  } catch {
    // Hors ligne : repli sur le cache ci-dessous.
  }

  const cached = await matchPage(request);
  if (cached) return cached;
  try {
    // Réseau lent mais pas coupé, et rien en cache : on attend quand même la réponse.
    return await network;
  } catch {
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

/** Correspondance exacte d'abord (`/edit?tab=…`), sinon la même page sans paramètres. */
async function matchPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  return (await cache.match(request)) || (await cache.match(request, { ignoreSearch: true }));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function cachePage(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) return;
  const cache = await caches.open(PAGES_CACHE);
  await cache.put(url, response.clone());
  await cacheReferencedAssets(await response.text());
}

async function warmPages(urls) {
  const cache = await caches.open(PAGES_CACHE);
  for (const url of urls) {
    if (typeof url !== "string" || !url.startsWith("/")) continue;
    if (await cache.match(url)) continue;
    try {
      await cachePage(url);
    } catch {
      // Hors ligne : la page sera mise en cache au prochain envoi de la liste.
    }
  }
}

/**
 * Met en cache les fichiers `/_next/static` cités par une page (scripts, CSS, polices dans le
 * payload RSC), puis les polices citées par les CSS : sans ça, une page mise en cache avant que le
 * service worker contrôle l'onglet s'afficherait hors ligne sans son code.
 */
async function cacheReferencedAssets(text) {
  await cacheAssets(text.match(/\/_next\/static\/[^"'\s)\\]+/g) || []);
}

/** Les CSS citent leurs polices en relatif (`url(../media/…)`) : résolues depuis l'URL du CSS. */
async function cacheCssAssets(css, cssUrl) {
  const urls = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]
    .map((match) => new URL(match[1], new URL(cssUrl, self.location.origin)))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.pathname)
    .filter((pathname) => pathname.startsWith("/_next/static/"));
  await cacheAssets(urls);
}

async function cacheAssets(list) {
  const cache = await caches.open(STATIC_CACHE);
  const urls = new Set(list);
  await Promise.all(
    [...urls].map(async (url) => {
      try {
        let response = await cache.match(url);
        if (!response) {
          response = await fetch(url);
          if (!response.ok) return;
          await cache.put(url, response.clone());
        }
        if (url.endsWith(".css")) {
          await cacheCssAssets(await response.text(), url);
        }
      } catch {
        // Fichier indisponible : il sera mis en cache à sa prochaine demande en ligne.
      }
    }),
  );
}
