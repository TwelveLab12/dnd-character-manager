# 0034 — Lancer et préparer les sorts depuis le mode jeu

**Statut** : Acceptée

## Contexte

En mode jeu, l'onglet Sorts n'était qu'une liste filtrable de noms. Lancer un sort demandait trois
gestes à trois endroits différents : dépenser l'emplacement dans l'onglet Combat, activer la
concentration, puis choisir le sort concentré. Préparer d'autres sorts obligeait à repasser par la
configuration. Les sorts à concentration et les rituels n'étaient pas signalés.

## Décision

- **Une carte par sort disponible**, groupée par niveau. Chaque carte porte des tags :
  - Concentration, couleur `info`, la même que l'indicateur de concentration ;
  - Rituel, couleur `warning` ;
  - domaine.

  Elle affiche aussi le temps d'incantation, la portée et la durée. Toucher la carte déplie la
  description.

- **Lancer un sort** est une logique pure, dans `src/domain/calculations/spell-casting.ts`
  (`castOptions`, `castSpell`).
  - Le bouton principal dépense le plus petit emplacement disponible au niveau du sort ou
    au-dessus. Un tour de magie ne dépense rien.
  - Un sort à concentration active la concentration sur ce sort. Il remplace la concentration en
    cours, comme le veut la règle, et les effets de CA liés suivent
    ([0017](0017-computed-armor-class.md)).
  - Le chevron propose un emplacement supérieur, ou le rituel (sans emplacement).
  - Sans emplacement, un sort rituel ne propose que le rituel ; les autres sorts sont désactivés.
- **Pas de confirmation** : un toast résume ce qui s'est passé (emplacement dépensé,
  concentration activée ou remplacée) et propose « Annuler », qui rétablit les emplacements et la
  concentration d'avant.
- **Préparation depuis le jeu** : un panneau latéral « Préparer les sorts » liste les sorts connus
  de niveau 1 et plus.
  - Il applique la même limite et la même exclusivité que la configuration
    ([0032](0032-known-spells-picker-and-exclusive-preparation.md),
    [0033](0033-prepared-spells-limit-and-casting-header.md)).
  - Les sorts toujours préparés sont affichés sans switch.
  - Il n'existe que pour les lanceurs qui préparent leurs sorts.
  - Ajouter un nouveau sort connu reste dans la configuration.
- **Concentration** : la carte du sort concentré est entourée en `info` et porte un bouton
  « Rompre ». On n'ajoute pas de bloc de concentration en tête d'onglet, car le résumé fixe
  ([0031](0031-combat-tab-and-sticky-summary.md)) l'affiche déjà.
- **Emplacements** : l'en-tête de l'onglet réutilise la carte d'emplacements de l'onglet Combat
  (losanges `info`), pour garder une seule représentation.

## Conséquences

- Le changement de sorts préparés n'est pas limité au repos long : c'est la table qui arbitre.
- `PreparedSpellsList` est remplacé par `SpellsViewTab` et `SpellCastCard`.
