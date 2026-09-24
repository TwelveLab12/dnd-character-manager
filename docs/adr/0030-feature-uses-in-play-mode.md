# 0030 — Capacités à utilisations mises en avant en mode jeu

**Statut** : Acceptée

## Contexte

Les capacités qui ont leur propre compteur d'utilisations (`usesMax`, ex : Yeux de la nuit du
domaine du Crépuscule) étaient noyées dans la liste de l'onglet Capacités, au même niveau que les
traits passifs, avec un petit compteur − / +. Ce sont pourtant les seules capacités de cet onglet
qu'on manipule en partie. La bande des ressources du bandeau de combat
([0024](0024-hud-resources-band.md)) ne montrait que les emplacements de sorts et les réserves de
classe.

## Décision

- **Capacité à utilisations** : `usesMax` > 0 et pas de `resourceId`. Une capacité liée à une
  ressource de classe (ex : Renvoi des morts-vivants → Canalisation divine) puise dans la réserve
  commune et reste gérée par la carte de cette réserve.
- **Une carte par capacité à utilisations**, dans le même langage visuel que la carte de réserve
  de classe : un médaillon par utilisation jusqu'à 5 (le toucher dépense ou récupère), un
  compteur − / + au-delà, le moment de recharge, un bouton « Utiliser ».
- **Bandeau de combat** : ces cartes s'ajoutent à la bande des ressources, après les emplacements
  de sorts et les réserves de classe, sans description pour rester compactes.
- **Onglet Capacités** : les mêmes cartes, avec leur description, dans une section « À utiliser »
  en tête. Les autres capacités sont regroupées par origine (champ `source`), dans l'ordre de la
  fiche, description repliée. Un bouton crayon ouvre la configuration sur l'onglet Capacités
  (`?tab=features`, voir [0029](0029-character-purse-and-play-mode-inventory.md)).

## Conséquences

- Pas de changement du format stocké : tout est déduit des champs existants.
- Un personnage avec beaucoup de capacités à utilisations allonge la bande des ressources ; si
  cela devient gênant, un choix « afficher dans le bandeau » par capacité pourra être ajouté.
