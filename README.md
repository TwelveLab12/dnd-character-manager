# D&D Character Manager

Application web pour gérer ses personnages de Donjons & Dragons 5e, à la table comme hors partie. Elle remplace une feuille Google Sheet : les valeurs se calculent toutes seules (modificateurs, classe d'armure, jets de sauvegarde, attaques, emplacements de sorts) et un mode jeu suit l'état du personnage en temps réel.

**En ligne : [dnd.brunoschvartz.dev](https://dnd.brunoschvartz.dev)**

[![CI](https://github.com/TwelveLab12/dnd-character-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/TwelveLab12/dnd-character-manager/actions/workflows/ci.yml)

**English —** A web app to manage D&D 5e characters at the table and away from it. It replaces a Google Sheet: derived values are computed automatically and a play mode tracks the character in real time. Everything runs in the browser, with no account and no server-side data. Live at [dnd.brunoschvartz.dev](https://dnd.brunoschvartz.dev); documentation is in French.

## Ce que fait l'application

- **Plusieurs personnages**, chacun avec une fiche complète : caractéristiques, compétences, inventaire, capacités, sorts.
- **Mode jeu** : un tableau de bord pour la partie. Points de vie, repos, concentration, emplacements de sorts et utilisations de capacités se mettent à jour d'un geste, sans bouton « Enregistrer ».
- **Mode configuration** : la fiche complète, pour créer et faire évoluer le personnage.
- **Règles calculées** : les valeurs dérivées viennent des règles du jeu, pas d'une saisie manuelle. Quatre classes sont prises en charge à ce jour : clerc, barbare, moine et druide.
- **Utilisable sans réseau** : l'application s'installe sur l'écran d'accueil et fonctionne hors ligne.
- **Sauvegarde** : import et export JSON des sorts, des personnages ou de l'ensemble, pour passer d'un appareil à l'autre.

## Choix techniques

- **Next.js 16, React 19, TypeScript strict.** UI en Radix, shadcn/ui et Tailwind CSS.
- **Couche métier séparée de l'interface** (`src/domain/`) : les règles du jeu sont testées sans dépendre du framework.
- **Repository pattern** : l'accès aux données passe par des contrats. Aujourd'hui, le stockage est le navigateur (`localStorage`) ; une base de données pourrait s'ajouter sans réécrire la logique métier ni les écrans.
- **Données validées par Zod** à chaque import, avec aperçu ligne par ligne avant d'écrire quoi que ce soit.
- **Formats versionnés** : une évolution du format des fiches migre les données déjà enregistrées au lieu de les perdre.
- **Qualité** : tests Vitest, ESLint, TypeScript, et une CI qui exécute le tout avant chaque mise en production sur Vercel.
- **Décisions documentées** : chaque choix structurant a son [ADR](docs/adr) ; le rôle de chaque dépendance est dans [`docs/dependencies.md`](docs/dependencies.md).

## Contraintes légales et données

- **Aucun contenu de sorts n'est fourni avec l'application.** Les textes officiels sont protégés par le droit d'auteur, et leur redistribution est encadrée par les licences ouvertes du SRD. L'utilisateur importe donc ses propres données, par exemple depuis une source SRD comme [open5e](https://open5e.com), dont le format est pris en charge. Le raisonnement complet est dans l'[ADR 0004](docs/adr/0004-json-import-export-open5e-schema.md).
- **Aucune donnée personnelle n'est collectée.** L'application n'a ni compte ni serveur de données : les personnages restent dans le navigateur de l'utilisateur. Ce dépôt public ne contient aucune fiche réelle ; les modèles de [`public/templates/`](public/templates) sont génériques et vérifiés en CI.
- **Marques.** « Dungeons & Dragons » et « D&D » sont des marques de Wizards of the Coast. Ce projet est indépendant et n'est ni affilié, ni approuvé par Wizards of the Coast.

## Lancer en local

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Avant un commit, `pnpm typecheck`, `pnpm lint`, `pnpm test` et `pnpm build` doivent passer : c'est ce que vérifie la CI. Les conventions de travail sont dans [`CLAUDE.md`](CLAUDE.md).

## Licence

Code sous [licence MIT](LICENSE). Elle couvre le code de ce dépôt ; elle ne donne aucun droit sur les contenus de Wizards of the Coast, qui n'y figurent pas.

## Contact

Projet de [Bruno Schvartz](https://brunoschvartz.dev), développeur front-end React / TypeScript — [LinkedIn](https://www.linkedin.com/in/bruno-schvartz).
