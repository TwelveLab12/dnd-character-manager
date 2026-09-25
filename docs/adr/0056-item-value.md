# 0056 — Valeur marchande des objets

**Statut** : Acceptée

## Contexte

Un objet de l'inventaire avait un nom, une quantité, un poids et une description, mais pas de
valeur. L'utilisateur voulait un champ dédié. Parmi les options proposées, il a retenu un montant
avec sa pièce, plus la valeur totale de l'inventaire.

## Décision

- `InventoryItem.value` (optionnel) : `{ amount, coin }`, une valeur **à l'unité** dans la pièce
  où le Manuel donne les prix (50 po, 2 pa, 1 pc…), avec les pièces de la bourse
  ([0029](0029-character-purse-and-play-mode-inventory.md)). Un montant vide retire la valeur.
- **Saisie** dans la configuration (onglet Inventaire), sur la ligne commune à tous les types
  d'objets : un montant et une liste de pièces, po par défaut.
- **Affichage** : sur la ligne de l'objet (configuration et mode jeu), dans son panneau de
  détail, et en valeur totale de l'inventaire en po dans l'en-tête (valeur unitaire × quantité,
  convertie comme la bourse). Le total n'apparaît que si au moins un objet a une valeur.

## Conséquences

La valeur totale peut être fractionnaire (5 torches à 1 pc = 0,05 po). La vente ou l'achat
d'objets depuis la bourse n'est pas modélisé.
