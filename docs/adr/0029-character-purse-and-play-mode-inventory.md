# 0029 — Bourse du personnage et inventaire modifiable en mode jeu

**Statut** : Acceptée

## Contexte

Le mode jeu affichait l'inventaire en lecture seule
([0016](0016-play-mode-read-only-view-tabs.md)), à l'exception de l'équipement des armes et
armures ([0020](0020-equipment-slots-and-two-weapon-fighting.md)). En partie, les deux changements
les plus fréquents sont la consommation d'objets (rations, flèches, potions) et les dépenses ou
gains d'argent. Le personnage n'avait pas de bourse.

## Décision

- **Bourse** : nouveau champ optionnel `currency` sur `Character`, avec les cinq monnaies de D&D
  5e (`platinum`, `gold`, `electrum`, `silver`, `copper` ; affichées pp, po, pe, pa, pc). Chaque
  montant est un entier ≥ 0. Une bourse absente vaut 0 pièce partout
  (`characterCurrency`, `src/domain/currency.ts`).
- **Pas de nouvelle version du format stocké** ([0023](0023-stored-format-migrations.md)) : le
  champ étant optionnel et sa valeur par défaut calculée à la lecture, les fiches existantes
  restent valides telles quelles. À l'import, une monnaie absente vaut 0 ; un montant négatif ou
  fractionnaire est rejeté.
- **Valeur totale** affichée en pièces d'or selon les taux du Manuel des joueurs : 1 pp = 10 po,
  1 pe = ½ po, 1 po = 10 pa = 100 pc. Aucune conversion automatique des pièces entre elles.
- **Mode jeu** : la bourse et la quantité des objets du sac se modifient directement et sont
  enregistrées tout de suite, comme les autres actions du mode jeu. Une quantité ne descend pas
  sous 0 et l'objet reste dans la liste. Les armes et armures gardent leur contrôle d'équipement,
  sans modification de quantité.
- **Accès direct à la configuration** : le bouton crayon de l'onglet ouvre
  `/characters/<id>/edit?tab=inventory`. La page de configuration lit `tab` et ouvre l'onglet
  correspondant (Général si la valeur est inconnue).

## Conséquences

- Le mode jeu n'est plus en lecture seule pour l'inventaire. Les autres onglets de configuration
  restent à rendre modifiables en jeu au cas par cas.
- La conversion automatique des pièces (« faire la monnaie ») est reportée à plus tard.
- Le paramètre `tab` peut servir aux autres onglets du mode jeu sans changement de la page de
  configuration.
