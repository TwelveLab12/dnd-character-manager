# dnd-character-manager

Gestionnaire de personnage D&D 5e (multi-personnages) — portage d'une feuille Google Sheet vers une
web app Next.js/TypeScript, pensé pour évoluer vers une vraie base de données sans réécriture de la
couche métier ni de l'UI.

**En ligne** : [dnd.brunoschvartz.dev](https://dnd.brunoschvartz.dev) (ou
[dnd-character-manager-theta.vercel.app](https://dnd-character-manager-theta.vercel.app))

## Fonctionnalités

- **Liste de personnages** (`/`) : créer/supprimer/lister, chacun avec son état complet.
- **Fiche personnage** (`/characters/[id]`) : onglets Général, Caractéristiques (modificateurs et
  jets de sauvegarde calculés en direct), Sorts (incantation avec DD/bonus calculés ou forcés,
  emplacements de sorts, sorts connus/préparés), Inventaire, Capacités (Channel Divinity, features
  de domaine...).
- **Bibliothèque de sorts** (`/spells`) : aucun sort officiel fourni avec l'appli pour des raisons
  de droits — import JSON (coller ou fichier, aligné sur le format
  [open5e](https://open5e.com)/SRD), export, modèle téléchargeable.
- **Import/export** : sorts, personnages, et sauvegarde complète combinée (round-trip entre
  environnements), avec preview ligne par ligne (Nouveau/Mise à jour/Identique/Invalide) pour les
  imports individuels.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript strict
- [Radix UI](https://www.radix-ui.com) + [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- [Zod](https://zod.dev) pour la validation (import/export JSON)
- [Zustand](https://github.com/pmndrs/zustand) pour l'état réactif au-dessus des repositories
- [Vitest](https://vitest.dev) + Testing Library

## Architecture

- **`src/domain/`** — types D&D et calculs (modificateurs, bonus de maîtrise, DD/bonus d'attaque de
  sort, table d'emplacements de sorts...), sans dépendance framework.
- **`src/repositories/`** — contrats (`CharacterRepository`, `SpellRepository`) indépendants de
  l'implémentation ; v1 = `localStorage`. Voir [docs/adr/0002](docs/adr/0002-repository-pattern-localstorage-v1.md).
- **`src/stores/`** — état réactif (Zustand) au-dessus des repositories. Voir
  [docs/adr/0003](docs/adr/0003-zustand-stores-over-repositories.md).
- **`src/import-export/`** — validation Zod, preview/dédup génériques (`preview-import.ts`,
  partagé sorts/personnages), schéma de sorts aligné [open5e](https://open5e.com)/SRD, schéma de
  sauvegarde combinée. Voir [docs/adr/0004](docs/adr/0004-json-import-export-open5e-schema.md) et
  [docs/adr/0008](docs/adr/0008-generalized-import-export-and-backup.md).
- **`src/features/`** — écrans par domaine fonctionnel (`character-list/`, `character-sheet/`,
  `spell-library/`), `shared/` pour les composants réutilisés entre écrans (ex : `ImportDialog`).
- **`src/components/ui/`** — primitives shadcn sur Radix UI. Voir
  [docs/adr/0007](docs/adr/0007-ui-stack-radix-shadcn-tailwind.md).
- **`scripts/convert-open5e-spells.ts`** — utilitaire manuel (`pnpm convert:open5e`) de conversion
  d'un export open5e brut vers le schéma canonique, pas exécuté en CI.
- **`docs/adr/`** — décisions d'architecture ; **`docs/dependencies.md`** — rôle de chaque
  dépendance.

## ⚠️ Données

Ce repo est **public**. Aucune donnée de personnage réelle ni aucun contenu de sort protégé par le
SRD/OGL/ORC n'est commité — voir [docs/adr/0004](docs/adr/0004-json-import-export-open5e-schema.md).
Les données personnelles sont importées à l'exécution via l'UI et restent uniquement dans le
`localStorage` du navigateur. Les modèles JSON dans `public/templates/` sont génériques et validés
en CI contre les schémas réels.

## Commandes

```bash
pnpm dev            # serveur de dev (Turbopack)
pnpm build           # build de production
pnpm start           # sert le build de production
pnpm lint            # eslint
pnpm lint:ci          # eslint --max-warnings=0 (ce que la CI lance)
pnpm typecheck        # next typegen && tsc --noEmit
pnpm format          # prettier --write .
pnpm test            # vitest run
pnpm test:watch       # vitest en mode watch
pnpm test:coverage    # vitest run --coverage
pnpm convert:open5e <entree.json> <sortie.json>  # conversion open5e -> schéma canonique
```

Avant chaque commit, `pnpm typecheck`, `pnpm lint`, `pnpm test` et `pnpm build` doivent être au
vert — c'est ce que vérifie la CI. Un hook `pre-commit` (Husky + lint-staged) formate/lint
automatiquement les fichiers stagés.

## Déploiement

Vercel, déploiement automatique à chaque push sur `main`. Voir
[docs/adr/0006](docs/adr/0006-vercel-subdomain-deployment.md).
