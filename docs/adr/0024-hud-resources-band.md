# 0024 — Bloc « Ressources » du HUD de combat

**Statut** : Acceptée

## Contexte

Depuis [0022](0022-computed-class-values-and-resources.md), les emplacements de sorts et les
ressources de classe (Canalisation divine du Clerc) sont calculés. Pourtant, le mode jeu les
affichait encore à deux endroits :

- les emplacements de sorts, dans l'onglet « Sorts », sous forme de compteurs « 3 / 4 » ;
- la Canalisation divine, dans l'onglet « Capacités ».

Ce sont pourtant des ressources consultées et dépensées à chaque combat, comme les PV ou la CA, qui
sont toujours visibles dans le HUD ([0021](0021-combat-hud-always-visible.md)).

## Décision

- **Un bloc « Ressources » dans le HUD**, entre les attaques et la ligne concentration / repos. Il
  est donc visible quel que soit l'onglet. Sur desktop, ses cartes sont côte à côte ; sur mobile,
  elles sont empilées.
- **Emplacements de sorts** (`spell-slots-card.tsx`), en teinte `info`, comme le DD et l'attaque
  de sort :
  - une rangée de losanges par niveau de sort : plein et lumineux quand l'emplacement est
    disponible, en pointillés quand il est utilisé ;
  - toucher un losange plein dépense un emplacement, toucher un losange en pointillés en récupère
    un ;
  - un compteur par niveau et le total restant.
- **Ressources de classe** (`class-resource-card.tsx`), en teinte `primary` (« divine ») :
  - une carte par ressource, surmontée du nom de la classe ;
  - un médaillon par utilisation, allumé ou éteint, qu'on peut toucher pour dépenser ou corriger ;
  - le mode de recharge ;
  - un bouton « Utiliser » par capacité liée à la ressource (`resourceId`). Tous puisent dans la
    même réserve et se désactivent quand elle est vide.
- **Pas de doublon** : le compteur d'emplacements quitte l'onglet « Sorts », et celui de la
  Canalisation divine quitte l'onglet « Capacités ». Les capacités liées y restent listées, avec la
  mention de la ressource qu'elles consomment.

## Conséquences

- Pendant un combat, tout ce qui se dépense (PV, emplacements, Canalisation divine) se gère sans
  changer d'onglet.
- Toute nouvelle ressource de classe ajoutée au registre apparaît automatiquement dans le HUD,
  avec ses options.
