# 0009 — Bonus raciaux de caractéristiques, modélisés génériquement

**Statut** : Acceptée

## Contexte

Un personnage humain variant (règles 2014) choisit 2 caractéristiques parmi lesquelles répartir
+1 chacune. D'autres races ont des règles différentes (bonus fixe sur une caractéristique donnée,
ou combinaison des deux comme le Demi-Elfe). Il fallait un moyen de saisir ce choix sans que
l'utilisateur ait à recalculer et re-saisir ses scores de caractéristiques "finaux" à la main à
chaque fois — et sans coder en dur un cas particulier "Humain variant" qui devrait être réécrit
pour chaque nouvelle race.

## Décision

- **`src/domain/race.ts`** : `RaceDefinition` = un id/nom + une liste de `AbilityBonusRule`, soit
  `{ type: "fixed", ability, amount }` (bonus fixe), soit `{ type: "choice", amount, count,
exclude? }` (choisir `count` caractéristiques distinctes parmi lesquelles répartir `amount`
  chacune, `exclude` permettant d'exclure celles déjà couvertes par une règle fixe — utile pour le
  Demi-Elfe plus tard). Registre `RACE_DEFINITIONS` volontairement minimal au démarrage (Humain,
  Humain variant) : ajouter une race = ajouter une entrée, pas réécrire de logique. Uniquement des
  noms/nombres, aucun trait racial du SRD reproduit — même logique que la table d'emplacements de
  sorts ([0004](0004-json-import-export-open5e-schema.md)).
- **`Character.abilityScores` reste le score DE BASE** (avant tout bonus racial) — c'est la seule
  chose que le joueur édite. Un nouveau champ optionnel `Character.raceSelection` (`{ raceId,
abilityBonusChoices }`) capture le choix de race + les caractéristiques sélectionnées,
  indépendant du champ `race` (texte libre, purement descriptif).
- **`effectiveAbilityScores(baseScores, raceSelection)`** (calcul pur, testé isolément) combine
  les deux pour produire les scores EFFECTIFS. Tous les calculs de gameplay (modificateur, jets de
  sauvegarde, compétences, DD/bonus d'attaque de sort) utilisent ce résultat, jamais
  `abilityScores` directement — les onglets Caractéristiques et Sorts ont été mis à jour en
  conséquence.

## Conséquences

Ajouter une race supplémentaire (Nain, Elfe, Demi-Elfe...) ne touche que `RACE_DEFINITIONS`, ni le
calcul ni les onglets. En contrepartie, toute nouvelle fonctionnalité qui aurait besoin d'une
caractéristique doit explicitement penser à utiliser le score effectif plutôt que la base — un
oubli reviendrait à ignorer silencieusement le bonus racial (pas de garde-fou au niveau des types
pour l'empêcher, seulement la convention).

**Effet de bord découvert en testant** : Radix Select nécessite un polyfill pour
`hasPointerCapture`/`setPointerCapture`/`releasePointerCapture`/`scrollIntoView` sous jsdom (absents
par défaut), ajouté dans `src/test/setup.ts` — jusqu'ici aucun test n'avait encore cliqué dans un
composant `Select`.
