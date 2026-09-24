# 0039 — Cartes de la liste des personnages

**Statut** : Acceptée

## Contexte

La liste des personnages affichait des cartes neutres : nom, niveau, classe, puis deux médaillons
circulaires « PV » et « CA » sans rapport visuel avec le mode jeu, et un lien vers la fiche
signalé par une icône d'œil. Le thème choisi pour chaque personnage
([0013](0013-per-character-visual-theme.md)) ne s'appliquait qu'à ses pages. L'utilisateur a
comparé deux maquettes Design (médaillons réduits, icônes + barre de PV) et retenu la seconde,
sans les PV temporaires.

## Décision

- **Chaque carte prend le thème de son personnage** : elle est enveloppée dans
  `CharacterThemeScope`, comme les pages du personnage. Fond, bordure, badge de niveau, bouton
  « Jouer » et couleurs des PV suivent sa palette ; un personnage sans thème garde la palette
  neutre.
- **CA et PV comme le résumé du mode jeu** ([0031](0031-combat-tab-and-sticky-summary.md)) :
  bouclier « CA 18 », cœur « PV 31 / 38 », puis une fine barre de PV. Le cœur et la barre prennent
  les seuils de couleur de l'anneau de PV (plus de la moitié, plus du quart, en dessous). Pas de
  PV temporaires : peu utiles depuis la liste.
- **Identité** : nom en Spectral, classe — sous-classe · race, badge de niveau aux couleurs du
  thème ; la concentration en cours s'affiche sur une ligne dédiée.
- **Actions** : « Jouer » en bouton principal, « Modifier », et « Supprimer » en icône avec la
  confirmation existante. Le lien « Jouer » est étiré sur toute la carte (un seul arrêt de
  tabulation) : cliquer n'importe où ouvre le mode jeu, les deux autres actions restent
  au-dessus.

## Conséquences

- Aucune donnée nouvelle : tout est calculé ou déjà stocké.
- Un futur thème s'applique automatiquement aux cartes, sans changement de la liste.
