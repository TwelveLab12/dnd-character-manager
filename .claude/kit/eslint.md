<!-- Géré par claude-kit (module eslint) : ne pas éditer, voir /claude-kit:sync. -->

## ESLint

```bash
pnpm lint         # eslint
pnpm lint:ci      # eslint --max-warnings=0 (ce que la CI lance)
```

Flat config native `next/core-web-vitals` + `next/typescript` (`eslint.config.mjs`), sans wrapper
`FlatCompat`. Override : `@typescript-eslint/no-unused-vars` ignore les identifiants préfixés `_`,
convention pour « omettre une clé via déstructuration » (`const { id: _id, ...rest } = x`).
Ne pas désactiver une règle en ligne (`eslint-disable`) sans commentaire qui justifie pourquoi.
