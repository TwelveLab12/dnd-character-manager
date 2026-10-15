<!-- Géré par claude-kit (module tailwind-shadcn) : ne pas éditer, voir /claude-kit:sync. -->

## UI : Tailwind v4 + shadcn/ui

- Design system en tokens Tailwind v4 `@theme` dans `src/app/globals.css`, pas de
  `tailwind.config.js`. Pas de couleur ni d'espacement en dur quand un token existe.
- `src/components/ui/` contient les primitives générées par le CLI shadcn sur **Radix UI**
  (paquet `radix-ui`). C'est un choix du projet : ne jamais mélanger avec l'autre
  bibliothèque (`@base-ui/react`), ni en migrer sans ADR.
- Toujours préciser la base au CLI, son défaut peut changer d'une version à l'autre. Ajouter un
  composant : `pnpm dlx shadcn@latest add <composant> -y` (il suit `components.json`).
  Réinitialiser : `pnpm dlx shadcn@latest init -b radix -p nova -y`. Vérifier ensuite que
  `package.json` liste `radix-ui` et pas `@base-ui/react`.
- Les API diffèrent entre Base UI et Radix (composition via `render` côté Base UI, `asChild` côté
  Radix, noms de props) : se référer à la documentation de **Radix UI**, pas à un exemple écrit
  pour l'autre.
- On peut modifier un composant généré, mais dans un commit dédié pour garder la trace de l'écart
  avec la version shadcn.
