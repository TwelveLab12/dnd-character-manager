# 0068 — Gourdin magique

**Statut** : Acceptée

## Contexte

Un joueur (druide) a remarqué que lancer Gourdin magique ne changeait rien à la fiche : les sorts
ne portaient aucun effet mécanique. Règles 2014 (Manuel des joueurs) : tour de magie lancé en
action bonus sur un gourdin ou un bâton tenu en main, pour 1 minute, sans concentration. La
caractéristique d'incantation remplace la Force aux jets d'attaque et de dégâts, le dé de dégâts
devient un d8 et l'arme est magique. Le sort prend fin s'il est relancé ou si l'arme est lâchée.

## Décision

- **Stockage** : `Character.shillelagh = { itemId }`, optionnel et sans migration. Relancer le sort
  le déplace sur l'autre arme.
- **Reconnaissance** : par le nom, comme les sorts de sous-classe
  ([0025](0025-subclass-registry.md)). Le sort « gourdin magique » / « shillelagh » ; l'arme :
  arme de corps à corps dont le nom contient gourdin, bâton, club ou quarterstaff. Les objets de
  l'inventaire sont saisis librement, il n'y a pas d'identifiant d'arme officiel.
- **Effet** (`computeWeaponAttack`) : tant que l'arme est en main, caractéristique d'incantation
  (Sagesse par défaut) au toucher et aux dégâts, dé 1d8 quelle que soit la prise (le bâton à deux
  mains ne passe pas à plus). « Pourquoi ? » explique le terme, une note rappelle que l'arme est
  magique. La Rage ne s'ajoute pas : elle exige une attaque avec la Force.
- **Activation** : en lançant le sort depuis l'onglet Sorts (sur l'arme en main principale
  d'abord ; sans arme, le toast explique quoi faire), ou par un bouton dans le panneau de l'arme
  si le personnage connaît ou a préparé le sort. Impossible en rage.
- **Fin** : bouton « Mettre fin », arme qui quitte la main (`reconcileShillelagh`, appliqué à
  chaque action du mode jeu comme la réconciliation des jets contre la mort), repos court ou long
  (1 minute). « Annuler » sur le toast de lancement rétablit l'état d'avant.
- **Historique** : ligne « Gourdin magique : non → Bâton ».

## Conséquences

- Premier sort à effet mécanique automatique. Les suivants (Entité symbiotique, Forme sauvage)
  suivent le même modèle : un état actif stocké, des effets calculés, une fin explicite.
- Une arme au nom inhabituel (« Bourdon ») n'est pas reconnue : il faut la renommer.
