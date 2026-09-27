# 0059 — Dés de vie : dépense au repos court, récupération au repos long

**Statut** : Acceptée

## Contexte

Le dé de vie de la classe servait seulement au calcul des PV max
([0027](0027-computed-max-hit-points.md)). Le repos court ne soignait donc rien, alors que c'est son
principal intérêt. Règles 2014 (Manuel des joueurs) :

- la réserve compte un dé de vie de la classe par niveau ;
- pendant un repos court, on dépense autant de dés qu'on veut, dans la limite des dés restants,
  un par un, en décidant après chaque jet. Chaque dé rend son résultat + le modificateur de
  Constitution, sans total négatif et sans dépasser les PV max ;
- un repos long rend tous les PV et les dés dépensés à hauteur de la moitié du niveau (au moins 1).

Il n'y a pas de plafond de 3 dés. Les règles 2024, où le repos long rend tous les dés, ne sont pas
retenues : l'application suit les règles 2014.

## Décision

- Stockage : `Character.hitDiceUsed` (dés dépensés), optionnel, sans migration (absent = 0). La
  réserve et le dé sont calculés (`computeHitDice`, src/domain/calculations/hit-dice.ts), comme les
  emplacements de sorts ([0022](0022-computed-class-values-and-resources.md)). Une classe hors registre n'a pas de
  dés de vie modélisés.
- `applyShortRest(character, hitDieRolls)` dépense les jets fournis (jets invalides ou en trop
  ignorés). `applyLongRest` récupère la moitié du niveau (au moins 1).
- Interface :
  - **pastille « Dés de vie 3/5 d8 »** sous l'anneau de PV de l'onglet Combat, à côté des PV
    temporaires ;
  - la pastille et le bouton « Repos court » ouvrent le même panneau. On y dépense les dés un par
    un : jet lancé par l'application (« Lancer 1d8 ») ou résultat d'un vrai dé saisi, au choix du
    joueur. Chaque dé affiche ses PV rendus et peut être retiré, avec un aperçu des PV
    (« PV 5 → 13/24 ») ;
  - rien n'est enregistré avant « Terminer le repos » : annuler ne dépense aucun dé ;
  - la dépense est bloquée quand les PV atteignent le maximum ou qu'il ne reste plus de dé.
- Les dés ne se dépensent qu'au repos court. Les effets qui en consomment autrement (Chant
  reposant, Périapte de cicatrisation, don Durable…) ne sont pas modélisés.

## Conséquences

Les personnages existants commencent avec toute leur réserve. L'entrée « Nouveautés » le signale
aux joueurs. Le multiclassage, s'il arrive, demandera une réserve par type de dé.
