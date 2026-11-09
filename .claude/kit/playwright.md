<!-- Géré par claude-kit (module playwright) : ne pas éditer, voir /claude-kit:sync. -->

## Tests e2e : Playwright

```bash
pnpm test:e2e       # playwright test sur le serveur de dev (rapide, pour itérer)
pnpm test:e2e:ci    # build de prod puis les e2e comme en CI : avant d'ouvrir une PR
pnpm test:e2e:ui    # mode UI interactif
```

- `test:e2e` en local ne reproduit pas la CI : serveur de dev, tests en parallèle, aucun réessai.
  `test:e2e:ci` la reproduit (`next start` sur le build, un seul processus, deux réessais). Arrêter
  le serveur de dev avant de le lancer : en mode CI, Playwright refuse un port 3000 déjà occupé.
- Un test qui ne passe qu'après un réessai passe la CI sans se voir. Après avoir ajouté ou modifié
  une spec, la lancer plusieurs fois sans réessai :
  `pnpm test:e2e:ci --repeat-each=3 --retries=0 e2e/<spec>.spec.ts`. Un seul échec signale un
  test instable, à corriger avant la PR.
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
