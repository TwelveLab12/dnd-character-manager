# 0013 — Thème visuel par personnage via `data-theme` scopé

**Statut** : Acceptée

## Contexte

L'app gère plusieurs personnages indépendants et l'utilisateur veut personnaliser la palette de
couleurs, avec une première palette « Séluné » (déesse de la lune) associée à son personnage
clerc. Un thème global unique pour toute l'application (ex : via `next-themes` et un toggle
clair/sombre) ne conviendrait pas ici : chaque personnage doit pouvoir garder sa propre identité
visuelle, indépendamment des autres et sans affecter le reste de l'app pendant qu'on la consulte.

## Décision

- `Character.themeId?: string` (optionnel, texte libre validé au moment de l'affichage contre un
  registre, pas au niveau du schéma Zod).
- `src/features/character-theme/theme-registry.ts` : liste des palettes connues,
  `CHARACTER_THEMES` — pour l'instant uniquement `{ id: "selune", label: "Séluné (Lune, Clerc)" }`.
- `src/features/character-theme/character-theme-scope.tsx` : composant client qui pose un
  attribut `data-theme="<id>"` sur un `<div>` wrapper, avec repli silencieux (pas d'attribut) si
  `themeId` est absent ou inconnu du registre. Jamais dans `app/layout.tsx` (server component,
  sans accès au store client) — utilisé en racine de `character-play.tsx` (mode jeu) et
  `character-sheet.tsx` (mode configuration).
- Dans `globals.css`, un bloc `[data-theme="selune"]` surcharge un sous-ensemble des tokens CSS
  existants (background/foreground/primary/secondary/muted/accent/border/ring) sans toucher
  `:root` ni `.dark` — les deux mécanismes coexistent sans interférence. Les tokens sémantiques
  (`success`/`warning`/`info`/`destructive`) ne sont **pas** redéfinis par un thème : ils doivent
  rester constants pour que le code couleur (PV bas, avertissement…) reste lisible quelle que soit
  la palette active.
- Un sélecteur dans l'onglet Général du mode configuration (`Select` listant `CHARACTER_THEMES` +
  option « Aucun / thème par défaut ») permet de choisir la palette du personnage.
- Pas de `next-themes`, pas de toggle clair/sombre global — hors scope de cette demande.

## Conséquences

Ajouter une palette est un ajout additif (entrée dans `CHARACTER_THEMES` + bloc CSS), jamais une
modification des tokens neutres existants. En contrepartie, chaque nouvelle palette doit rester
disciplinée sur les tokens qu'elle touche (ne jamais redéfinir les tokens sémantiques) pour ne pas
casser la lisibilité garantie par ailleurs. Le thème ne s'applique qu'à la zone visible du
personnage (fiche jeu/configuration) — le reste du chrome de l'app (liste des personnages,
bibliothèque de sorts) reste neutre, ce qui est cohérent avec « thème par personnage » mais laisse
ces écrans communs visuellement neutres même quand un personnage a un thème actif.
