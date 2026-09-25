# 0045 — Application installable et hors ligne (service worker maison)

**Statut** : Acceptée

## Contexte

L'application doit pouvoir s'installer sur l'écran d'accueil et servir à la table, parfois sans
connexion. Toutes les données sont déjà dans localStorage ([0002](0002-repository-pattern-localstorage-v1.md)).
Seul le code a besoin du réseau : le HTML des pages et les fichiers `/_next/static`.

Pour l'installation, un manifest suffit : `src/app/manifest.ts`, avec une icône d20 générée par
`scripts/generate-icons.ts`. Le hors ligne demande un service worker. Deux options :

- **Serwist** (successeur de `next-pwa`) : complet, mais branché sur le build webpack. Ce projet
  build avec Turbopack (Next 16), et la compatibilité n'est pas garantie.
- **Un `public/sw.js` écrit à la main** : environ 200 lignes, aucune dépendance, et un
  comportement qu'on maîtrise entièrement.

Les pages de personnage (`/characters/[id]`, `/characters/[id]/edit`) sont rendues à la demande.
Elles n'existent donc pas au moment du build et ne peuvent pas être précachées à l'installation.

## Décision

- **Un service worker maison**, `public/sw.js`, enregistré par `ServiceWorkerRegistrar`
  (`src/features/pwa/`). Il n'est actif qu'en production : en dev, il masquerait le rechargement à
  chaud.
- **Stratégies de cache** :
  - `/_next/static/*`, les icônes et le manifest : **cache d'abord**. Ces fichiers sont hashés,
    donc immuables.
  - Les navigations (HTML) : **réseau d'abord**. Si le réseau échoue ou dépasse 4 s, le service
    worker sert la version en cache. Si la page n'a jamais été ouverte, il sert `/offline`.
  - Les requêtes RSC (navigations côté client) : **réseau uniquement**. Hors ligne, elles
    échouent, et le routeur Next retombe alors sur une navigation complète, que le service worker
    sert depuis le cache. On n'active pas `experimental.useOffline` : avec ce flag, Next mettrait
    la navigation en attente au lieu de faire ce repli.
- **Précache à l'installation** : `/`, `/spells` et `/offline`. S'y ajoutent les fichiers
  `/_next/static` cités par chacune de ces pages (scripts, CSS, polices citées par les CSS). Sans
  ça, une page mise en cache avant que le service worker contrôle l'onglet s'afficherait hors
  ligne sans son code.
- **Préchauffage des pages de personnage** : le client envoie au service worker un message
  `WARM_PAGES` avec la page de jeu et la page de configuration de chaque personnage. Il le fait au
  chargement et à chaque création ou import de personnage.
- **Une version par déploiement** : le script est enregistré sous `/sw.js?v=<commit>`, avec
  `NEXT_PUBLIC_BUILD_ID` défini dans `next.config.ts`. Chaque nouveau build installe un nouveau
  service worker (`skipWaiting` + `clients.claim`). Celui-ci repart de caches neufs et supprime
  les anciens.
- **`navigator.storage.persist()`** : on demande au navigateur de ne pas évincer localStorage.
  Sur iOS, une application installée sur l'écran d'accueil échappe déjà à l'éviction après
  7 jours d'inactivité.

## Conséquences

- Une fois installée et ouverte en ligne, l'application fonctionne entièrement sans connexion :
  liste, fiches, bibliothèque de sorts.
- **Limite** : un personnage créé hors ligne ne peut pas être ouvert avant le retour du réseau. Sa
  page est rendue par le serveur et n'a jamais été mise en cache, donc c'est `/offline` qui
  s'affiche. Pour lever cette limite, il faudrait des routes sans paramètre serveur (par exemple
  `/character?id=…`), rendues statiquement : ce serait un nouvel ADR.
- Hors ligne, `/characters/[id]/edit?tab=…` retombe sur la version en cache sans paramètre, donc
  sur l'onglet par défaut, si cet onglet précis n'a jamais été chargé.
- Le code de l'application n'est pas mis à jour tant qu'on est hors ligne : c'est la dernière
  version chargée en ligne qui tourne.
