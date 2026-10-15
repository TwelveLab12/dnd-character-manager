<!-- Géré par claude-kit (module vitest) : ne pas éditer, voir /claude-kit:sync. -->

## Tests unitaires : Vitest

```bash
pnpm test           # vitest run
pnpm test:watch     # mode watch
pnpm test:coverage  # couverture v8
```

- Vitest + Testing Library, `environment: "jsdom"`, `resolve.tsconfigPaths: true`. Globals
  désactivés : importer `describe/it/expect` depuis `vitest`, et `afterEach(cleanup)` explicite dans
  `src/test/setup.ts`.
- Tests colocalisés (`foo.ts` → `foo.test.ts`), voir `include` dans `vitest.config.ts`.
- Logique métier en fonctions pures, testables sans monter de composant. Côté composants, requêter
  comme un utilisateur (`getByRole`, `getByLabelText`) plutôt que par classe ou test-id.
- Un bug corrigé = un test qui l'aurait attrapé.
