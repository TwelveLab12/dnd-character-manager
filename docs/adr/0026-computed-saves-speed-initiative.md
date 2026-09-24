# 0026 — Jets de sauvegarde, vitesse et initiative calculés

**Statut** : Acceptée

## Contexte

Trois valeurs se déduisent de paramètres connus mais étaient saisies à la main, en contradiction
avec la règle de [0022](0022-computed-class-values-and-resources.md) :

- **Jets de sauvegarde maîtrisés** : ils viennent de la classe (Clerc : Sagesse et Charisme), mais
  étaient cochés un par un.
- **Vitesse** : elle vient de la race (9 m pour un humain) et peut baisser de 3 m en armure lourde
  portée sans la Force requise. Elle était stockée comme un total (`speed`).
- **Initiative** : c'est le modificateur de Dextérité, auquel s'ajoute un bonus éventuel (don
  Vigilant…). Elle était stockée comme un total (`initiativeBonus`), qu'une montée de Dextérité ne
  mettait donc pas à jour.

## Décision

- **Jets de sauvegarde** : chaque classe du registre déclare ses jets maîtrisés (`savingThrows`).
  `effectiveSavingThrowProficiencies` renvoie ceux de la classe, plus ceux cochés sur la fiche.
  `savingThrowProficiencies` ne stocke plus que les maîtrises en plus (ex : don Résilient). En
  configuration, les jets de la classe apparaissent cochés, verrouillés et accompagnés de leur
  source.
- **Vitesse** : chaque race du registre déclare sa vitesse (`RaceDefinition.speed`, en mètres).
  `computeSpeed` renvoie la vitesse de la race, avec un repli :
  - pour une race hors registre, la vitesse de base saisie (`baseSpeed`) ;
  - sinon, 9 m.

  S'y ajoute un malus de 3 m en armure lourde équipée si la Force effective est inférieure à la
  Force requise.

- **Initiative** : `computeInitiative` = modificateur de Dextérité effectif, plus
  `initiativeExtraBonus` pour un bonus hors règles modélisées. Ce champ est la seule surcharge.
- **Format stocké des personnages en version 4** ([0023](0023-stored-format-migrations.md)). Les
  conversions reposent sur la présence des anciens champs, ce qui les rend idempotentes :
  - `initiativeBonus` (total) devient `initiativeExtraBonus` = total − modificateur de Dextérité
    effectif, supprimé s'il vaut 0 ;
  - `speed` est supprimée pour une race connue, et conservée comme `baseSpeed` sinon ;
  - les jets de sauvegarde accordés par la classe sont retirés de `savingThrowProficiencies`.

  L'import JSON applique la même normalisation.

## Conséquences

- La fiche se met à jour d'elle-même quand la Dextérité, la race, la classe ou l'armure change.
- L'onglet Notes affiche la vitesse, l'initiative et les jets de sauvegarde, avec leur
  décomposition.
- Seules les races du registre (Humain, Humain variant) ont une vitesse calculée. Les autres gardent
  la vitesse saisie tant qu'elles n'y sont pas ajoutées.
