# 0004 — Import/export JSON versionné, schéma de sorts aligné open5e/SRD

**Statut** : Acceptée

## Contexte

Deux besoins motivent ce choix :

1. Les sorts D&D 5e (textes, descriptions) ne peuvent pas être redistribués librement dans un repo
   public — droits d'auteur, licences OGL/ORC du SRD. Aucune donnée de sort n'est donc bundlée dans
   ce dépôt ; l'utilisateur doit importer les siennes.
2. Les données de personnage (les vraies, celles de l'utilisateur) ne doivent pas non plus être
   committées dans un repo public — voir aussi la note de sécurité dans le README.

Il faut malgré tout un mécanisme fiable pour peupler l'application avec ses propres données, testable
facilement dans n'importe quel environnement (dev local, preview Vercel), et permettant un
mouvement de données entre navigateurs/appareils.

## Décision

- **Format** : JSON, avec validation [Zod](https://zod.dev) (`src/import-export/schemas/`). Un
  schéma `spellSchema` aligné sur les champs standards que republient les API ouvertes du SRD (ex :
  [open5e](https://open5e.com)) — `name`, `level`, `school`, `castingTime`, `range`, `components`,
  `duration`, `concentration`, `ritual`, `description`, `classes`... — pour permettre un mapping
  quasi direct depuis ces sources, sans jamais bundler leur contenu dans le repo.
- Un adapter dédié (`src/import-export/open5e-adapter.ts`) traduit les formats open5e v1
  (snake_case, chaînes) et v2 (imbriqué, types natifs) vers le schéma canonique de l'app. Un script
  utilitaire (`scripts/convert-open5e-spells.ts`, exécuté à la main via `pnpm tsx`, hors CI) produit
  un fichier conforme à partir d'un export open5e brut.
- **UI d'import** dédiée (pas un simple `JSON.parse` + insertion) : validation, preview ligne par
  ligne (New / Update / Identique / Invalide), dédoublonnage (par `id` ou `slugify(name)`), import
  partiel possible.
- **Export** par ressource, plus un export combiné "backup" versionné
  (`{ schemaVersion, exportedAt, characters, spells }`) qui permet un aller-retour complet entre
  environnements.
- Seuls des templates JSON **génériques** (pas les vraies données) vivent dans
  `public/templates/`.

## Conséquences

L'app reste utilisable et démontrable (captures, démo) sans jamais contenir de contenu protégé ni de
données personnelles. En contrepartie, l'utilisateur doit fournir ses propres données à chaque
nouvel environnement (pas de seed automatique) — c'est un compromis assumé, pas une limitation
technique contournable sans risque juridique.
