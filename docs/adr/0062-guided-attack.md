# 0062 — Attaque guidée : jets d'attaque et de dégâts expliqués

**Statut** : Acceptée

## Contexte

L'onglet Combat affichait le bonus au toucher et la formule de dégâts de chaque arme, mais pas leur
composition. Or les joueurs ne maîtrisent pas toujours les règles : pourquoi Dextérité plutôt que
Force, pourquoi pas de bonus de maîtrise, pourquoi pas de modificateur en main secondaire, que
doubler sur un critique. L'utilisateur voulait pouvoir attaquer depuis l'application, dés lancés ou
saisis, avec le résultat explicité, sans surcharger l'onglet Combat.

## Décision

- **Décomposition dans le domaine** : `WeaponAttack` expose
  - `attackTerms` et `damageTerms` : caractéristique, maîtrise, arme magique, Rage, chacun avec la
    règle qui le justifie. Leur somme vaut le bonus au toucher et le modificateur de dégâts
    affichés ;
  - `damageDice`, le dé réellement lancé (dé à deux mains, dé d'Arts martiaux) ;
  - `attackNotes` et `damageNotes`, les règles appliquées sans terme chiffré : arme non maîtrisée,
    modificateur retiré en main secondaire, dé à deux mains.
- **Résolution** (`attack-roll.ts`) :
  - avantage et désavantage : deux d20, le plus haut ou le plus bas est retenu ;
  - 20 naturel : critique, touche toujours ; 1 naturel : rate toujours ;
  - CA de la cible facultative ;
  - dégâts : dés doublés sur un critique, pas les bonus, et jamais négatifs.
- **Interface** : le panneau de l'arme ([0042](0042-combat-tab-detail-sheet.md)) s'ouvre sur un bloc
  **Attaquer**, les détails restent dessous, et l'onglet Combat ne change pas.
  - Mode Normal, Avantage ou Désavantage, et CA de la cible facultative.
  - « Lancer 1d20 » (2d20 avec avantage ou désavantage), ou saisie du seul dé : l'application ajoute
    les bonus.
  - Résultat en grand, verdict (Coup critique, Échec automatique, Touché, Raté) et calcul en
    pastilles. « Pourquoi ? » se déplie sur l'explication de chaque terme.
  - Sans CA, boutons « Touché » et « Raté » selon ce qu'annonce le MJ.
  - Dégâts lancés ou saisis (total des dés), décomposés et expliqués de la même façon.
- **Historique** ([0061](0061-activity-log.md)) : nouvelle catégorie « Combat ». Chaque attaque
  terminée (ratée ou avec ses dégâts) y est inscrite avec le détail des deux jets.

## Conséquences

Hors périmètre pour l'instant : attaque sournoise, Attaque supplémentaire, effets ajoutant des dés
(Châtiment divin, Bénédiction), application automatique des dégâts à une cible. Chacun pourra
ajouter un terme ou un dé à la décomposition sans changer l'interface.
