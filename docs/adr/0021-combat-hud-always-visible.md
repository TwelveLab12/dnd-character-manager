# 0021 — HUD de combat toujours visible en mode jeu

**Statut** : Acceptée

## Contexte

En mode jeu ([0012](0012-play-mode-vs-configuration-mode.md),
[0016](0016-play-mode-read-only-view-tabs.md)), seule la carte « Points de vie » restait visible
au-dessus des onglets. Les valeurs consultées à chaque tour étaient réparties dans les onglets :

- la CA, l'initiative, la vitesse et les attaques dans « Général » ;
- le DD de sauvegarde et le bonus d'attaque de sort dans « Sorts ».

Pendant une partie, il fallait donc changer d'onglet pour répondre à « quelle est ta CA ? ».

## Décision

- **Un HUD de combat unique** (`src/features/character-play/combat-hud.tsx`) remplace
  `HitPointsWidget`, entre l'en-tête et les onglets. Il est donc visible quel que soit l'onglet. Il
  regroupe :
  - la CA ;
  - les PV ;
  - l'initiative et la vitesse ;
  - le DD de sauvegarde et le bonus d'attaque de sort, seulement si `spellcasting` est défini ;
  - les attaques d'armes équipées ;
  - la concentration et les repos.

  Ces valeurs sont retirées de l'onglet « Sorts » pour éviter les doublons.

- **L'onglet « Général » est remplacé par « Notes »**, en première position et ouvert par défaut.
  La race et l'historique passent dans l'en-tête, sur la ligne de la classe. L'onglet Notes
  regroupe :
  - les **règles appliquées** automatiquement, en texte lisible (ex : « Bonus racial (Humain
    variant) : Constitution 14 → 15 (+1), Sagesse 15 → 16 (+1) ») ;
  - les **avertissements** de configuration (CA, attaques) ;
  - les **notes** libres du personnage.

- **La CA est l'information prioritaire.** Elle est affichée dans un bouclier dessiné, le plus
  grand élément du bloc. Un halo signale qu'un effet temporaire est actif. Les interrupteurs des
  effets de CA manuels sont des pastilles sous le bouclier.
- **Les PV sont un anneau.**
  - L'arc suit le ratio PV actuels / max, avec la couleur par seuil (> 50 %, > 25 %).
  - Les PV temporaires forment un arc extérieur.
  - Les PV actuels, éditables, sont au centre. Le max sert de libellé au-dessus.
  - Les boutons ‹ (perte) et › (gain) encadrent ce libellé.
- **Alignement par grille partagée.** Bouclier et anneau occupent les mêmes lignes d'une grille
  CSS, dans cet ordre :
  1. libellé ou contrôles ;
  2. visuel de même hauteur (140 px mobile, 188 px desktop) ;
  3. pastilles.

  Sur desktop, les tuiles occupent une 3e colonne centrée sur la ligne des visuels. Sur mobile,
  elles passent en rangée de 4 sous le détail de la CA.

- **En-tête.** Le niveau s'affiche en ligne (« niv. N »), comme sur la carte de la liste. L'accès
  au mode configuration s'appelle **« Modifier »** (crayon), sur la fiche comme sur la carte.
  L'icône engrenage reste réservée à un futur écran de paramètres de l'application.

Aucun nouveau calcul métier : le HUD réutilise `computeArmorClass`, `computeWeaponAttacks`,
`resolvedSpellSaveDC`, `resolvedSpellAttackBonus` et les formateurs de `src/features/shared/`.

## Conséquences

- Les valeurs de combat se lisent d'un coup d'œil, sans navigation. La contrepartie est un bloc
  permanent plus haut qu'avant au-dessus des onglets.
- L'onglet « Sorts » s'allège. L'onglet « Notes » devient le point d'entrée pour comprendre
  d'où viennent les valeurs calculées : chaque nouvelle règle automatique devra y être listée.
- Le HUD s'appuie sur les jetons de thème (`primary`, `info`, `success`, `warning`,
  `destructive`). Il suit donc le thème du personnage ([0013](0013-per-character-visual-theme.md))
  sans code spécifique.
