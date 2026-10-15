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

**Baseline avant tout commit** (c'est ce que la CI vérifie, ce n'est pas optionnel) :
`pnpm typecheck`, `pnpm lint:ci`, `pnpm test` et `pnpm build`.

Version de Node : `.nvmrc`, lu
aussi par la CI. `@types/node` suit la majeure de Node (`pnpm add -D @types/node@^<majeure>`
quand on change Node) : les types doivent décrire l'exécution, pas la dernière version publiée.

## TypeScript

Strict : `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax` (imports de type toujours via `import type`),
`forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch`. Ne jamais relâcher une option du
`tsconfig.json` pour faire passer du code : corriger le code.

## Next.js

La version installée peut être plus récente que tes connaissances : lire le guide concerné dans
`node_modules/next/dist/docs/` avant d'utiliser une API dont tu n'es pas sûr (voir `AGENTS.md`).

## Faits dérivés

Un chiffre ou un fait affiché qui se déduit d'une source déjà présente dans le dépôt (une date, un
dossier, une liste) est **calculé** au build ou au rendu, jamais tapé en dur : il serait exact
aujourd'hui et faux demain (« 5 ans d'expérience », « 12 décisions documentées »…). Avant d'écrire
un nombre, vérifier s'il est dérivable. Exception : un contenu daté par nature (article publié,
changelog) reste un instantané.
