# 0069 — Entité symbiotique et Halo de spores

**Statut** : Acceptée

## Contexte

Le Cercle des spores (Chaudron de Tasha) figurait dans le registre avec ses sorts toujours préparés
et une option « Entité symbiotique » sur la Forme sauvage, qui ne faisait que dépenser une
utilisation. Un joueur a signalé que ses effets n'étaient pas pris en compte. Règles, dès le
niveau 2 :

- **Halo de spores** : en réaction, une créature qui entre ou commence son tour à 3 m ou moins
  réussit un jet de sauvegarde de Constitution contre le DD des sorts, ou subit 1d4 dégâts
  nécrotiques (1d6 au niveau 6, 1d8 au 10, 1d10 au 14) ;
- **Entité symbiotique** : une action et une utilisation de Forme sauvage, sans transformation.
  4 PV temporaires par niveau de druide, dé du halo lancé deux fois, +1d6 dégâts nécrotiques aux
  attaques d'arme au corps à corps. Dure 10 minutes, jusqu'à la perte de tous ces PV temporaires
  ou jusqu'à la Forme sauvage suivante.

L'Entité ne modifie aucune caractéristique.

## Décision

- **Stockage** : `Character.symbioticEntity`, booléen optionnel, sans migration. Les effets sont
  calculés (`src/domain/calculations/circle-of-spores.ts`) et ignorés hors Cercle des spores.
- **Activation** : le bouton « Utiliser » de l'option (carte Forme sauvage et panneau de détail)
  passe par `applyResourceOption`. Il dépense la Forme sauvage et accorde les PV temporaires : on
  garde les plus élevés, ils ne se cumulent pas. Le bouton est désactivé pendant l'Entité.
- **Dégâts supplémentaires** : nouveau champ générique `WeaponAttack.extraDamage` (dés et type
  propres, sans modificateur), ajouté aux attaques d'arme au corps à corps et aux attaques à mains
  nues, mais pas à distance. Affichage « 1d6+2 contondant + 1d6 nécrotique ». Dans l'attaque
  guidée ([0062](0062-guided-attack.md)), « Lancer » lance tous les dés. En saisie, les dés de
  l'arme sont demandés d'abord, puis chaque dé supplémentaire. Les dés sont doublés sur un
  critique. Le **total de tous les dégâts** est le chiffre mis en avant (c'est lui que le joueur
  annonce), avec la répartition par type en dessous (« 4 contondant + 5 nécrotique ») et les dés
  supplémentaires dans le détail du calcul. Avant le dernier dé, les dégâts de l'arme ne sont
  qu'un sous-total discret. Le tout est inscrit dans l'historique.
- **Fin** :
  - bouton « Mettre fin » ;
  - PV temporaires à 0 (`reconcileSymbioticEntity`, appliqué à chaque action du mode jeu) ;
  - repos court ou long.

  La fin à la Forme sauvage suivante viendra avec la Forme sauvage (#161).

- **Halo de spores** : rappel permanent sous la carte Forme sauvage, avec le dé, le DD et le
  doublement pendant l'Entité. L'application ne lance pas les réactions.
- **Affichage** : panneau vert de l'Entité active avec ses PV temporaires restants, pastille
  « Symbiose » dans le résumé du haut, ligne d'historique.

## Conséquences

- `extraDamage` servira à d'autres dégâts additionnels (Frappe divine, attaque sournoise…).
