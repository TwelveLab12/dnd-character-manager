<!-- Géré par claude-kit (module core) : ne pas éditer, voir /claude-kit:sync. -->

## Commandes

Toujours passer par `pnpm <script>`.

```bash
pnpm dev          # serveur de dev (Turbopack)
pnpm build        # build de production
pnpm start        # sert le build de production
pnpm typecheck    # next typegen && tsc --noEmit
```

`next typegen` est nécessaire avant `tsc` : les helpers `LayoutProps`/`PageProps` ne sont générés
qu'au dev/build/typegen, et sans eux `tsc` échoue sur un clone frais.

**Baseline** : les étapes de la CI, lancées en local (ce n'est pas optionnel).

- Avant chaque commit : `pnpm typecheck`, `pnpm format:check`, `pnpm lint:ci` et `pnpm test`.
- Avant d'ouvrir une PR : `pnpm typecheck`, `pnpm format:check`, `pnpm lint:ci`, `pnpm test` et `pnpm test:e2e:ci`. `test:e2e:ci` refait le build de
  production et lance les e2e comme la CI (voir `.claude/kit/playwright.md`).

Version de Node : `.nvmrc`, lu
aussi par la CI. `@types/node` suit la majeure de Node (`pnpm add -D @types/node@^<majeure>`
quand on change Node) : les types doivent décrire l'exécution, pas la dernière version publiée.

## TypeScript

Strict : `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax` (imports de type toujours via `import type`),
`forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch`. Ne jamais relâcher une option du
`tsconfig.json` pour faire passer du code : corriger le code.

Garder `.next/dev/types` dans `exclude`. `next dev` y écrit des types qui restent après l'arrêt du
serveur et peuvent être faux : route supprimée depuis (vercel/next.js#96620), imports inutilisés
depuis Next 16.4 (vercel/next.js#99919). `typecheck` et `build` échoueraient. Les pages restent
vérifiées par `.next/types`, que `next typegen` régénère. Laisser aussi `.next/dev/types/**/*.ts`
dans `include` : Next le remet s'il manque, et `exclude` l'emporte.

## Next.js

La version installée peut être plus récente que tes connaissances : lire le guide concerné dans
`node_modules/next/dist/docs/` avant d'utiliser une API dont tu n'es pas sûr (voir `AGENTS.md`).

## Faits dérivés

Un chiffre ou un fait affiché qui se déduit d'une source déjà présente dans le dépôt (une date, un
dossier, une liste) est **calculé** au build ou au rendu, jamais tapé en dur : il serait exact
aujourd'hui et faux demain (« 5 ans d'expérience », « 12 décisions documentées »…). Avant d'écrire
un nombre, vérifier s'il est dérivable. Exception : un contenu daté par nature (article publié,
changelog) reste un instantané.
