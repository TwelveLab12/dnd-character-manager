# 0027 — PV max calculés (valeur fixe ou dés lancés)

**Statut** : Acceptée

## Contexte

Les PV max étaient saisis (`hitPoints.max`). Pourtant, avec la valeur fixe, ils se déduisent
entièrement de la classe, du niveau et de la Constitution. Avec les dés lancés, seuls les résultats
des dés sont propres au joueur.

La fiche de référence en donnait d'ailleurs une illustration : Clerc niv. 3, Constitution 15, gain
fixe, **23** PV saisis au lieu des **24** attendus.

Règles 2014 :

- **au niveau 1** : maximum du dé de vie + modificateur de Constitution ;
- **à chaque niveau suivant** : soit le dé lancé, soit la valeur fixe (moitié du dé + 1, donc 5
  pour un d8), + modificateur de Constitution ;
- une hausse de Constitution augmente les PV max rétroactivement, sur tous les niveaux.

## Décision

- **Dé de vie** déclaré par chaque classe du registre (`hitDie` : Clerc, Barde, Druide d8 ;
  Ensorceleur, Magicien d6).
- **`computeMaxHitPoints`** calcule le total, avec le détail par niveau :
  - le niveau 1 prend le maximum du dé ;
  - les niveaux suivants prennent la valeur fixe ou le résultat saisi ;
  - la Constitution effective s'applique à chaque niveau ;
  - chaque niveau rapporte au moins 1 PV.
- **Le joueur choisit la méthode** (`hitPointMethod`) :
  - **valeur fixe** (par défaut) : tout est calculé ;
  - **dés lancés** : seul le résultat du dé se saisit, niveau par niveau (`hitPointRolls`, qui
    commence au niveau 2). Le maximum du niveau 1, la Constitution et le plancher de 1 restent
    automatiques. Un résultat manquant ou hors du dé est remplacé par la valeur fixe, avec un
    avertissement.
- **Le maximum n'est plus stocké** : `HitPoints` ne contient plus que `current` et `temporary`.
  Soins, saisie directe et repos long sont bornés par le maximum calculé.
- **Classe hors registre** : les PV max restent saisis (`baseMaxHitPoints`), faute de dé de vie
  connu.
- **Format stocké des personnages en version 5** ([0023](0023-stored-format-migrations.md)) :
  `hitPoints.max` est supprimé pour une classe connue (la méthode par défaut est la valeur fixe), et
  conservé comme `baseMaxHitPoints` sinon. L'import JSON applique la même normalisation.

## Conséquences

- Monter de niveau ou augmenter sa Constitution met les PV max à jour sans saisie.
- Une fiche au format précédent avec des PV lancés passe en valeur fixe à la migration : le joueur
  rebascule en « dés lancés » et saisit ses résultats. Les jets n'étaient pas stockés et ne peuvent
  donc pas être reconstitués.
- Les bonus de PV par niveau hors classe (don Robuste, nain des collines…) ne sont pas encore
  modélisés.
