# 0042 — Panneau de détail dans l'onglet Combat

**Statut** : Acceptée

## Contexte

Le panneau de détail des sorts ([0041](0041-spell-detail-sheet.md)) n'existait que dans les écrans
de sorts. Dans l'onglet Combat, on ne pouvait pas relire ce que fait une option de Canalisation
divine, une capacité à utilisations (ex : Yeux de la nuit) ou une arme sans quitter l'onglet. De
plus, toute la ligne d'une option de Canalisation divine était un bouton « Utiliser » : un simple
toucher dépensait la réserve.

## Décision

- **Coque commune.** `DetailSheet` (`src/features/shared/detail-sheet.tsx`) sort du panneau de
  sort. Elle regroupe :
  - l'ouverture par le bas, la fermeture en dehors, par ✕ ou Échap ;
  - le thème reposé sur le contenu, et la largeur limitée sur grand écran ;
  - des briques réutilisables : `DetailStats`, `DetailText`, `UsePips`, `DetailsHint` ;
  - `useLastDefined`, qui garde le contenu affiché pendant l'animation de fermeture.

  `SpellDetailSheet` s'appuie désormais sur cette coque, sans changement visible.

- **Onglet Combat.** `CombatDetailSheet` est un seul panneau, piloté par le bloc ouvert. Trois
  types de blocs l'ouvrent :
  - **Option d'une ressource de classe** (Canalisation divine) : la ligne ouvre le détail. Un
    bouton « Utiliser » séparé dépense la réserve, ce qui évite de la dépenser par erreur. Le pied
    du panneau montre la réserve restante et le même bouton « Utiliser ».
  - **Capacité à utilisations** : toute la carte ouvre le détail. Les médaillons, le compteur et
    « Utiliser » passent au-dessus et gardent leur action. Le pied montre les utilisations
    restantes et le bouton « Utiliser ».
  - **Attaque d'arme** : la ligne ouvre le détail, avec le bonus au toucher, les dégâts, le type,
    la caractéristique, les propriétés, un avertissement si l'arme n'est pas maîtrisée et la
    description de l'objet. Le panneau est en lecture seule.

  Utiliser depuis le panneau ferme le panneau.

- **Descriptions.** Le registre des règles ne reproduit aucun texte
  ([0028](0028-feat-registry.md)). La description d'une option accordée par les règles vient donc
  d'une capacité de la fiche qui porte le même nom. Quand il n'y a pas de description, le panneau
  le dit et renvoie vers Configuration → Capacités.

- **Hors onglet Combat**, les cartes de capacités à utilisations de l'onglet Capacités restent
  telles quelles : leur description y est déjà affichée.

## Conséquences

- Lire puis utiliser une capacité se fait sans quitter l'onglet Combat.
- La Canalisation divine ne se dépense plus par un toucher sur toute la ligne.
- Une option des règles sans capacité de même nom n'a pas de texte. L'utilisateur doit créer
  cette capacité lui-même, ce qu'un message lui indique.
- Les emplacements de sorts, la CA et les PV n'ont pas de panneau : ils n'ont pas de texte à
  afficher.
