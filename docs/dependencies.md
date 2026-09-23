# Dépendances

Ce que fait chaque librairie du `package.json` et pourquoi elle est utilisée ici. À vérifier avant
d'ajouter ou d'évaluer une nouvelle dépendance.

## `dependencies`

- **next** — framework (App Router), routing, build, dev server (Turbopack par défaut en v16).
- **react** / **react-dom** — UI.
- **radix-ui** — primitives UI headless (accessibilité, comportement clavier/focus) sur lesquelles
  les composants `src/components/ui/` générés par shadcn sont construits — voir
  [ADR 0003 du portfolio](../../BrunoSchvartzDev/docs/adr) pour le choix de stack équivalent, et
  [docs/adr/0001](adr/0001-record-architecture-decisions.md) et suivants ici.
- **shadcn** — CLI utilisée pour générer les composants UI dans `src/components/ui/` (le code généré
  est copié dans le repo, pas importé comme dépendance à l'exécution ; le paquet `shadcn` référencé
  dans `dependencies` fournit des styles/utilitaires runtime consommés par ce code généré).
- **cn** — utilitaire de fusion de classes Tailwind, dépendance du code généré par shadcn.
- **class-variance-authority** — variantes de composants UI typées (ex : `Button`).
- **lucide-react** — icônes, utilisées par les composants shadcn.
- **tw-animate-css** — animations Tailwind utilitaires, dépendance du thème shadcn.
- **zod** — validation de schémas ; colonne vertébrale de l'import/export JSON
  ([ADR 0004](adr/0004-json-import-export-open5e-schema.md)).
- **zustand** — état réactif au-dessus des repositories
  ([ADR 0003](adr/0003-zustand-stores-over-repositories.md)).

## `devDependencies`

- **typescript** — TypeScript strict, voir `tsconfig.json`.
- **tailwindcss** / **@tailwindcss/postcss** — Tailwind CSS v4 (config via `@theme` dans
  `globals.css`, pas de `tailwind.config.js`).
- **eslint** / **eslint-config-next** — lint, config flat native `next/core-web-vitals` +
  `next/typescript`.
- **prettier** / **prettier-plugin-tailwindcss** — formatage, tri automatique des classes Tailwind.
- **husky** / **lint-staged** — hook `pre-commit` qui formate/lint les fichiers stagés.
- **vitest** / **@vitejs/plugin-react** — test runner (config dans `vitest.config.ts`,
  `resolve.tsconfigPaths: true` résout nativement l'alias `@/*` du `tsconfig.json`).
- **jsdom** — environnement DOM pour les tests Vitest (composants + accès `localStorage`).
- **@testing-library/react** / **@testing-library/jest-dom** / **@testing-library/user-event** —
  tests de composants centrés utilisateur plutôt que sur les détails d'implémentation.
- **@vitest/coverage-v8** — rapport de couverture (`pnpm test:coverage`).
- **tsx** — exécution TypeScript directe pour `scripts/convert-open5e-spells.ts`
  ([ADR 0004](adr/0004-json-import-export-open5e-schema.md)), pas utilisé en CI.
- **@types/node**, **@types/react**, **@types/react-dom** — types.
