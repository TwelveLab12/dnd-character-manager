@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project

Gestionnaire de personnage D&D 5e (multi-personnages), porté depuis une Google Sheet. Next.js App
Router + TypeScript strict, 100% client-side en v1 (localStorage derrière un repository pattern —
voir `docs/adr/`). Le plan d'implémentation complet (phases, décisions) vit dans le fil de
conversation qui a créé ce repo ; les décisions structurantes sont, elles, dans `docs/adr/`.

## Commands

```bash
pnpm dev            # serveur de dev (Turbopack)
pnpm build           # build de production
pnpm start           # sert le build de production
pnpm lint            # eslint
pnpm lint:ci          # eslint --max-warnings=0 (ce que la CI lance)
pnpm typecheck        # next typegen && tsc --noEmit (next typegen est nécessaire : les helpers
                       # LayoutProps/PageProps ne sont générés qu'au dev/build/typegen — sans ça
                       # tsc échoue sur un clone frais qui n'a jamais lancé `next dev`)
pnpm format          # prettier --write .
pnpm test            # vitest run
pnpm test:watch       # vitest en mode watch
pnpm test:coverage    # vitest run --coverage
pnpm convert:open5e <entree.json> <sortie.json>  # utilitaire manuel, pas lancé en CI
```

Avant tout commit : `pnpm typecheck`, `pnpm lint:ci`, `pnpm test` et `pnpm build` doivent être au
vert — c'est le baseline du projet, pas optionnel, et c'est ce que la CI vérifie. Un hook
`pre-commit` (Husky + lint-staged) formate/lint automatiquement les fichiers stagés.

## Architecture

- **`src/domain/`** — types D&D et calculs (`calculations/`) purs, zéro dépendance framework,
  testables sans monter de composant React.
- **`src/repositories/`** — contrats indépendants de l'implémentation (`contracts/`) ; v1 =
  `local-storage/`. `repository-provider.tsx` est le seul point d'instanciation — une future
  implémentation API/DB ne changerait que ce fichier. Voir
  [docs/adr/0002](docs/adr/0002-repository-pattern-localstorage-v1.md).
- **`src/stores/`** — un store Zustand par ressource, créé par une factory qui reçoit le
  repository en paramètre (testable avec un repository en mémoire factice, sans React). Instancié
  une seule fois dans `store-provider.tsx`, imbriqué dans `RepositoryProvider`
  (`app/layout.tsx`). Voir [docs/adr/0003](docs/adr/0003-zustand-stores-over-repositories.md).
- **`src/import-export/`** — schémas Zod + validation JSON ligne par ligne (une entrée invalide ne
  bloque pas les autres), adapter open5e/SRD, dédup par égalité structurelle
  (`deep-equal.ts`). Voir [docs/adr/0004](docs/adr/0004-json-import-export-open5e-schema.md).
- **`src/features/`** — écrans, organisés par feature (`character-list/`, `character-sheet/`,
  `spell-library/`), colocation des composants/tests d'un même écran.
- **`src/components/ui/`** — primitives générées par le CLI shadcn sur **Radix UI**
  (`components.json` : `"base": "radix"`, package `radix-ui`) — ne pas laisser le CLI basculer sur
  Base UI (son défaut actuel), toujours relancer avec `-b radix` en cas de doute.
- **`docs/adr/`** — décisions d'architecture (une par fichier, jamais éditées rétroactivement : une
  décision reconsidérée donne lieu à un nouvel ADR).

## Conventions de qualité (portables d'un projet à l'autre)

- **TypeScript strict** : `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax` (imports de type toujours via `import type`),
  `forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch`.
- **ESLint** : flat config native `next/core-web-vitals` + `next/typescript`
  (`eslint.config.mjs`), pas de wrapper `FlatCompat` (Next 16+ l'expose nativement). Override
  projet : `@typescript-eslint/no-unused-vars` ignore les identifiants préfixés `_` (args,
  variables, éléments de déstructuration) — convention pour le pattern « omettre une clé via
  déstructuration » (`const { id: _id, ...rest } = x`). Ça aligne ESLint sur ce que TypeScript
  tolère déjà nativement pour les patterns de déstructuration et les paramètres de fonction sous
  `noUnusedLocals`/`noUnusedParameters` (mais pas pour une variable isolée type `const _x = 1`
  hors déstructuration, que `noUnusedLocals` continue de signaler).
- **Prettier** + `prettier-plugin-tailwindcss` (tri automatique des classes Tailwind),
  `printWidth: 100`, doubles guillemets.
- **Husky + lint-staged** sur `pre-commit` (prettier + eslint --fix sur les fichiers stagés
  uniquement) ; **jamais** les tests dans le hook — ça reste une responsabilité CI, pour un hook
  rapide.
- **Vitest + Testing Library**, `environment: "jsdom"`, `resolve.tsconfigPaths: true` (pas besoin
  du plugin `vite-tsconfig-paths`, Vite le supporte nativement). Vitest globals désactivés →
  `afterEach(cleanup)` explicite dans `src/test/setup.ts` (sinon le DOM n'est pas nettoyé entre
  tests et les requêtes RTL deviennent ambiguës d'un test à l'autre).
- **CI** (`.github/workflows/ci.yml`) : `typecheck` → `lint:ci` → `test` → `build`, dans cet
  ordre, sur chaque push/PR vers `main`.

## Workflow

Un ticket GitHub par tâche (label `enhancement`/`bug`/`chore`/`documentation`) ; une branche + une
PR par sujet ; rebase sur `main` plutôt que merge ; squash-merge ; suppression des branches après
merge ; un ADR par décision structurante plutôt que rétro-édition d'un ADR existant. Voir aussi le
CLAUDE.md de [BrunoSchvartzDev](https://github.com/TwelveLab12/BrunoSchvartzDev/blob/main/CLAUDE.md)
pour le détail du cycle Project board / labels, repris tel quel ici.
