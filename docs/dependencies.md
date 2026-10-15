# Dépendances

Ce que fait chaque librairie du `package.json` et pourquoi elle est utilisée ici. À vérifier avant
d'ajouter ou d'évaluer une nouvelle dépendance, et à tenir à jour dans la même PR que l'ajout.

## `dependencies`

- **next** — framework (App Router), routing, build, dev server (Turbopack par défaut en v16).
- **react** / **react-dom** — UI.
- **radix-ui** — primitives UI headless (accessibilité, comportement clavier/focus) sur lesquelles
  les composants `src/components/ui/` générés par shadcn sont construits — voir
  [ADR 0007](adr/0007-ui-stack-radix-shadcn-tailwind.md) (attention au piège Base UI par défaut du
  CLI shadcn, détaillé dans cet ADR).
- **shadcn** — CLI utilisée pour générer les composants UI dans `src/components/ui/` (le code généré
  est copié dans le repo, pas importé comme dépendance à l'exécution ; le paquet `shadcn` référencé
  dans `dependencies` fournit des styles/utilitaires runtime consommés par ce code généré).
- **cn** — utilitaire de fusion de classes Tailwind, dépendance du code généré par shadcn.
- **class-variance-authority** — variantes de composants UI typées (ex : `Button`).
- **lucide-react** — icônes, utilisées par les composants shadcn.
- **tw-animate-css** — animations Tailwind utilitaires, dépendance du thème shadcn.
- **sonner** — notifications (toasts) : retours d'action en mode jeu (sort lancé, repos, jets de
  mort) et invitation à installer la PWA ; monté une fois via `Toaster` dans `src/app/layout.tsx`.
- **next-themes** — importé uniquement par `src/components/ui/sonner.tsx` (code généré par shadcn)
  pour donner son thème au `Toaster`. L'app n'a pas de bascule clair/sombre ni de `ThemeProvider`
  (voir `globals.css`) : `useTheme()` renvoie donc toujours `"system"`.
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
- **eslint-plugin-jsx-a11y** — règles d'accessibilité JSX en config `strict`, bloquantes dans
  `lint:ci` (voir `.claude/kit/a11y.md`).
- **prettier** / **prettier-plugin-tailwindcss** — formatage, tri automatique des classes Tailwind.
- **husky** / **lint-staged** — hook `pre-commit` qui formate/lint les fichiers stagés.
- **vitest** / **@vitejs/plugin-react** — test runner (config dans `vitest.config.ts`,
  `resolve.tsconfigPaths: true` résout nativement l'alias `@/*` du `tsconfig.json`).
- **jsdom** — environnement DOM pour les tests Vitest (composants + accès `localStorage`).
- **@testing-library/react** / **@testing-library/jest-dom** / **@testing-library/user-event** —
  tests de composants centrés utilisateur plutôt que sur les détails d'implémentation.
- **@testing-library/dom** — requêtes DOM de Testing Library, dépendance pair de
  `@testing-library/react` (déclarée explicitement depuis l'adoption de claude-kit).
- **@vitest/coverage-v8** — rapport de couverture (`pnpm test:coverage`).
- **axe-core** — moteur d'audit d'accessibilité des tests Vitest (`src/test/a11y.ts`,
  `*.a11y.test.tsx`).
- **@playwright/test** — tests end-to-end dans Chromium, sur le build de production en CI
  (`pnpm test:e2e`, `e2e/`).
- **@axe-core/playwright** — audit axe (WCAG 2.2 AA et bonnes pratiques) des pages rendues dans les
  tests e2e (`e2e/a11y.spec.ts`).
- **tsx** — exécution TypeScript directe pour les utilitaires manuels de `scripts/`
  (`convert-open5e-spells.ts`, voir [ADR 0004](adr/0004-json-import-export-open5e-schema.md), et
  `generate-icons.ts`), pas utilisé en CI.
- **sharp** — rendu SVG → PNG/ICO des icônes PWA et du favicon par `scripts/generate-icons.ts`
  (`pnpm generate:icons`), utilitaire manuel : les fichiers générés sont versionnés.
- **@types/node**, **@types/react**, **@types/react-dom** — types. `@types/node` suit la majeure
  de Node du projet (`.nvmrc`), pas la dernière publiée.
