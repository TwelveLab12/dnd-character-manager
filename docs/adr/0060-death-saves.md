# 0060 — Jets de sauvegarde contre la mort et état stabilisé

**Statut** : Acceptée

## Contexte

À 0 PV, l'application n'affichait qu'un anneau vide : rien pour suivre les jets de sauvegarde
contre la mort ni l'état stabilisé. Règles 2014 (Manuel des joueurs) :

- à 0 PV (sans mort instantanée), le personnage est mourant et lance un d20 sans modificateur à
  chaque tour : 10+ réussite, moins de 10 échec, 1 naturel deux échecs, 20 naturel 1 PV ;
- trois réussites, pas forcément consécutives : stabilisé ; trois échecs : mort ;
- un dégât subi à 0 PV compte comme un échec, deux sur un coup critique ; un dégât d'au moins
  les PV max tue sur le coup ;
- stabilisé : 0 PV, inconscient, plus de jets ; 1 PV après 1d4 heures ; un dégât le rend de nouveau
  mourant ; Médecine DD 10, trousse de soins ou Épargner les mourants stabilisent ;
- tout soin remet les compteurs à zéro.

## Décision

- Stockage : `Character.deathSaves` (`{ successes, failures }`) et `Character.stable`, optionnels et
  sans migration. L'état (vivant, mourant, stabilisé, mort) est déduit des PV, des échecs et de
  `stable` (`dyingStatus`, src/domain/calculations/death-saves.ts). La mort n'est pas un champ
  stocké : trois échecs, tant que les PV sont à 0.
- Automatismes :
  - `damageCharacter` remplace `applyDamage` en mode jeu : à 0 PV, un dégât qui passe les PV
    temporaires ajoute un échec (deux sur un critique, trois s'il atteint les PV max) et fait
    perdre l'état stabilisé ;
  - `reconcileDeathSaves`, appliqué à toutes les actions du mode jeu : remonter au-dessus de 0 PV
    (soin, repos, dé de vie, 20 naturel) ou y tomber remet les jets à zéro. Le repos long fait de
    même.
- Interface, dans l'onglet Combat, entre les PV et la ligne concentration/repos, uniquement à 0 PV :
  - un panneau titré **Mourant**, **Stabilisé** ou **Mort**, teinté selon l'état ;
  - trois cases de réussites et trois d'échecs, cochables à la main (coup critique, effet non
    modélisé, erreur) ;
  - « Lancer 1d20 » ou résultat d'un vrai dé saisi, avec un message qui donne l'issue du jet ;
  - « Stabiliser » ;
  - « Reprendre 1 PV » quand le personnage est stabilisé ;
  - une ligne qui rappelle la règle de l'état en cours.
- Les boutons de dégâts du HUD retirent 1 PV à la fois : un coup critique se reporte en cochant un
  échec de plus. La mort instantanée sur un dégât massif n'est appliquée qu'aux dégâts passés à
  `damageCharacter` ; sinon, elle se coche à la main.

## Conséquences

Soigner un personnage mort le ramène à la vie. L'application ne distingue pas les soins ordinaires
des sorts de résurrection : c'est à la table de juger. Les effets qui modifient le jet (Bénédiction,
Chanceux…) ne sont pas modélisés ; le joueur saisit alors son résultat.
