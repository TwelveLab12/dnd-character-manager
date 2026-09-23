# 0016 — Vues lecture seule séparées pour le mode jeu, plutôt qu'un prop `readOnly` générique

**Statut** : Acceptée

## Contexte

Le mode jeu ne montrait qu'un sous-ensemble curaté des informations (PV, concentration, repos,
sorts disponibles, capacités à compteur). Retour utilisateur : il doit pouvoir _tout_ visualiser
en lecture seule, comme un classeur miroir de la configuration, avec seulement les quelques champs
vraiment actionnables (PV, concentration, repos, préparation de sort, usages de capacité/
emplacement de sort) mis en avant.

## Décision

Le mode jeu est restructuré en onglets identiques à la configuration (Général/Caractéristiques/
Sorts/Inventaire/Capacités). Chaque onglet du mode jeu est un **nouveau composant dédié**
(`*-view-tab.tsx` dans `src/features/character-play/`), prenant `{ character: Character }` en
props — pas `draft`/`onChange`, pas le type `CharacterTabProps` des onglets de configuration —
plutôt que d'ajouter un prop `readOnly?: boolean` aux composants `*-tab.tsx` existants de
`character-sheet/` qui basculerait leur rendu entre inputs et texte. Les vues lecture seule
réutilisent les fonctions de calcul du domaine (`effectiveAbilityScores`, `resolvedSpellSaveDC`,
etc.) et les constantes partagées — `format.ts`, `ability-labels.ts` et `skills.ts` ont été migrés
de `character-sheet/` vers `src/features/shared/` à cette occasion, consommés par les deux
features sans dépendance imbriquée entre elles.

Une zone persistante (PV, concentration, repos) reste au-dessus des onglets, toujours visible quel
que soit l'onglet actif — ce sont les seuls widgets vraiment temps-réel du mode jeu. Un nouveau
compteur d'emplacements de sorts (+/- par niveau, même patron que les capacités) a été ajouté dans
l'onglet Sorts du mode jeu, jusqu'ici absent (seul un repos complet réinitialisait les emplacements).

Cette séparation est cohérente avec [0012](0012-play-mode-vs-configuration-mode.md), qui actait
déjà l'absence de mode conditionnel à l'intérieur d'un même composant entre mode jeu et
configuration.

## Conséquences

Duplication de structure JSX entre `*-tab.tsx` (éditable) et `*-view-tab.tsx` (lecture seule) pour
des écrans qui affichent globalement la même information — accepté comme le prix d'avoir deux
modes visuellement optimisés pour leur usage (formulaire dense vs lecture rapide en jeu) sans
complexité conditionnelle interne à un composant. La logique de calcul, elle, n'est jamais dupliquée
: toujours dans `src/domain/calculations/`, appelée par les deux jeux de composants.
