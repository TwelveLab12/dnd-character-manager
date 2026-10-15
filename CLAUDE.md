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

Commandes courantes et baseline : règles du kit (bloc claude-kit ci-dessous). Propres au projet :

```bash
pnpm convert:open5e <entree.json> <sortie.json>  # utilitaire manuel, pas lancé en CI
pnpm generate:icons  # régénère les icônes PWA/favicon (d20) — utilitaire manuel, fichiers versionnés
```

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
  `spell-library/`), colocation des composants/tests d'un même écran. Toute page place `FullscreenToggle` dans
  son en-tête ([docs/adr/0063](docs/adr/0063-fullscreen-on-every-page.md)).
- **`src/components/ui/`** — primitives générées par le CLI shadcn sur **Radix UI**
  (`components.json` : `"base": "radix"`, package `radix-ui`) — ne pas laisser le CLI basculer sur
  Base UI (son défaut actuel), toujours relancer avec `-b radix` en cas de doute.
- **`docs/adr/`** — décisions d'architecture (une par fichier, jamais éditées rétroactivement : une
  décision reconsidérée donne lieu à un nouvel ADR). **Lire d'abord
  [`docs/architecture.md`](docs/architecture.md)** : les règles actives, ce qui a changé en route et
  l'index des ADR par thème ([docs/adr/0073](docs/adr/0073-architecture-summary.md)). Un nouvel ADR
  s'y range dans la même PR ; un test le vérifie.

## Workflow

Outillage, conventions de qualité et workflow issue → branche → PR → squash-merge : règles du kit,
importées par le bloc claude-kit ci-dessous. Propre à ce projet :

- Le board est le [projet 2](https://github.com/users/TwelveLab12/projects/2) de `TwelveLab12`. Ce
  n'est **pas** le board de BrunoSchvartzDev (projet 1) : ne jamais y ajouter de ticket de ce repo.
- Toute PR fonctionnelle (ce qu'un joueur voit ou peut faire) ajoute son entrée dans
  `src/features/changelog/changelog-entries.ts` — page « Nouveautés », voir
  [docs/adr/0058](docs/adr/0058-changelog-page.md).

<!-- BEGIN:claude-kit -->

@.claude/kit/core.md
@.claude/kit/tailwind-shadcn.md
@.claude/kit/eslint.md
@.claude/kit/prettier.md
@.claude/kit/husky.md
@.claude/kit/vitest.md
@.claude/kit/playwright.md
@.claude/kit/a11y.md
@.claude/kit/docs-adr.md
@.claude/kit/github-ci.md
@.claude/kit/vercel-check.md
@.claude/kit/dependabot.md
@.claude/kit/github-workflow.md
<!-- END:claude-kit -->
