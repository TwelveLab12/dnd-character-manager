# dnd-character-manager

Gestionnaire de personnage D&D 5e (multi-personnages) — portage d'une feuille Google Sheet vers une
web app Next.js/TypeScript, pensé pour évoluer vers une vraie base de données sans réécriture de la
couche métier ni de l'UI.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript strict
- [Radix UI](https://www.radix-ui.com) + [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- [Zod](https://zod.dev) pour la validation (import/export JSON)
- [Zustand](https://github.com/pmndrs/zustand) pour l'état réactif au-dessus des repositories
- [Vitest](https://vitest.dev) + Testing Library

## Architecture

- **`src/domain/`** — types D&D et calculs (modificateurs, DD de sort, emplacements de sorts...),
  sans dépendance framework.
- **`src/repositories/`** — contrats (`CharacterRepository`, `SpellRepository`) indépendants de
  l'implémentation ; v1 = `localStorage`. Voir [docs/adr/0002](docs/adr/0002-repository-pattern-localstorage-v1.md).
- **`src/stores/`** — état réactif (Zustand) au-dessus des repositories. Voir
  [docs/adr/0003](docs/adr/0003-zustand-stores-over-repositories.md).
- **`src/import-export/`** — import/export JSON validé (Zod), schéma de sorts aligné
  [open5e](https://open5e.com)/SRD. Voir [docs/adr/0004](docs/adr/0004-json-import-export-open5e-schema.md).
- **`src/features/`** — écrans (liste de personnages, fiche personnage, bibliothèque de sorts,
  import/export).
- **`docs/adr/`** — décisions d'architecture ; **`docs/dependencies.md`** — rôle de chaque
  dépendance.

## ⚠️ Données

Ce repo est **public**. Aucune donnée de personnage réelle ni aucun contenu de sort protégé par le
SRD/OGL/ORC n'est commité — voir [docs/adr/0004](docs/adr/0004-json-import-export-open5e-schema.md).
Les données personnelles sont importées à l'exécution via l'UI et restent uniquement dans le
`localStorage` du navigateur.

## Commandes

```bash
pnpm dev            # serveur de dev (Turbopack)
pnpm build           # build de production
pnpm start           # sert le build de production
pnpm lint            # eslint
pnpm lint:ci          # eslint --max-warnings=0 (ce que la CI lance)
pnpm typecheck        # tsc --noEmit
pnpm format          # prettier --write .
pnpm test            # vitest run
pnpm test:watch       # vitest en mode watch
pnpm test:coverage    # vitest run --coverage
```

Avant chaque commit, `pnpm typecheck`, `pnpm lint`, `pnpm test` et `pnpm build` doivent être au
vert — c'est ce que vérifie la CI. Un hook `pre-commit` (Husky + lint-staged) formate/lint
automatiquement les fichiers stagés.
