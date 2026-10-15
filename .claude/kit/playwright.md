<!-- Géré par claude-kit (module playwright) : ne pas éditer, voir /claude-kit:sync. -->

## Tests e2e : Playwright

```bash
pnpm test:e2e       # playwright test (build de prod en CI, serveur de dev en local)
pnpm test:e2e:ui    # mode UI interactif
```

- Specs dans `e2e/*.spec.ts`, réservées aux parcours utilisateur critiques : ce qui peut être testé
  en Vitest l'est en Vitest (plus rapide, plus stable).
- Chaque nouvelle page reçoit au minimum un check d'accessibilité axe (`@axe-core/playwright`, voir
  `e2e/smoke.spec.ts`) : zéro violation `serious`/`critical`.
- Sélecteurs par rôle ou label (`getByRole`), jamais par classe CSS. Pas de `waitForTimeout` :
  utiliser les assertions auto-retry (`await expect(...).toBeVisible()`).
- Premier lancement local : `pnpm exec playwright install chromium`. Sous Linux/WSL, Chromium a
  aussi besoin de bibliothèques système, à installer une fois par machine **par l'utilisateur**
  (`sudo` demande son mot de passe, ne pas le lancer à sa place). Seul `apt` passe en root, Node
  reste dans l'espace utilisateur (un shim Volta ne fonctionne pas sous `sudo`) :
  `sudo apt-get install -y $(pnpm exec playwright install-deps --dry-run chromium 2>/dev/null | sed -n 's/^  //p')`.
  Symptôme si elles manquent : `error while loading shared libraries: libnspr4.so`.
