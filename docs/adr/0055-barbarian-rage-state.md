# 0055 — État « en rage » du Barbare

**Statut** : Acceptée

## Contexte

Le Barbare ([0053](0053-barbarian-class.md)) avait une réserve de Rage, mais l'app ne savait pas
quand le personnage était en rage : le bonus aux dégâts et les résistances n'apparaissaient nulle
part. L'utilisateur a demandé l'état « en rage » pour Murrik.

## Décision

- Un champ optionnel `Character.raging`, comme la concentration : un état de jeu, modifié en mode
  jeu.
- **Entrer en rage** (bouton de la carte Rage, onglet Combat) dépense une rage et met fin à la
  concentration, puisqu'un barbare en rage ne peut ni lancer de sort ni se concentrer. C'est
  impossible sans rage restante ou en armure lourde ; la raison s'affiche sous le bouton désactivé.
- **Pendant la rage** : les attaques d'arme au corps à corps qui utilisent la Force gagnent le bonus
  de Rage aux dégâts (+2, +3 au niveau 9, +4 au niveau 16), signalé par l'étiquette « Rage +2 ». Les
  autres effets, que l'app ne calcule pas, sont rappelés dans la carte : résistances, avantage aux
  tests et jets de sauvegarde de Force, pas de sorts, durée d'une minute.
- **Esprit de l'ours** : la fiche note l'esprit totem dans le libellé de la sous-classe (« Voie du
  guerrier totémique (Ours) »), seul endroit où il est connu. Avec ce libellé, la résistance
  couvre tous les dégâts sauf psychiques.
- **Fin** : bouton « Mettre fin à la rage », ou tout repos (une rage dure une minute). La fin
  automatique quand le barbare n'attaque pas et ne subit pas de dégâts pendant un tour reste à la
  charge du joueur.
- Un badge « En rage » s'ajoute au résumé fixe du mode jeu (CA, PV, concentration), et chaque
  ressource de classe a désormais son icône (soleil, patte, vent, flamme).

## Conséquences

L'état en rage se voit depuis tous les onglets du mode jeu et ses chiffres sont justes dans les
attaques. Un choix d'esprit totem structuré (plutôt que lu dans le libellé) pourra venir avec les
autres esprits (aigle, loup), s'ils ont un jour un effet calculé.
