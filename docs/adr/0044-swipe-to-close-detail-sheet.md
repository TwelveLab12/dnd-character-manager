# 0044 — Fermer les panneaux de détail en glissant vers le bas

**Statut** : Acceptée

## Contexte

Les panneaux de détail ([0041](0041-spell-detail-sheet.md), [0042](0042-combat-tab-detail-sheet.md),
[0043](0043-features-and-items-detail-sheet.md)) montrent une barre de préhension, mais on ne
pouvait pas les fermer en les faisant glisser. L'ADR 0041 envisageait `vaul`, la librairie sur
laquelle repose le Drawer de shadcn. L'adopter voulait dire changer de primitive pour tous les
panneaux et ajouter une dépendance.

## Décision

- **Un geste maison**, dans `DetailSheet` (`useSwipeToClose`), sur le `Sheet` Radix existant. On
  n'ajoute pas de dépendance.
- **Zone du geste** : la barre de préhension et l'en-tête (surtitre, titre, tags).
  - `touch-none` sur cette zone : le navigateur ne fait pas défiler la page et ne la recharge pas
    pendant le geste.
  - Le bouton ✕ et les liens gardent leur clic.
- **Pendant le glissement**, le panneau suit le doigt : un `translateY` est posé en style inline,
  sans rendu React.
- **Au lâcher**, le panneau se ferme dans deux cas : au-delà de 120 px, ou pour un geste rapide
  (≥ 0,5 px/ms à partir de 30 px). Sinon, il revient en place en 200 ms.
- **La fermeture ne saute pas.** Elle passe par `onOpenChange(false)`. L'animation de sortie de
  tw-animate (`exit`) ne définit qu'une image de fin, `to` : elle part donc de la position glissée.

## Conséquences

- On ferme le panneau d'un geste du pouce, comme dans les applications natives.
- Le contenu défilable du panneau ne déclenche pas le geste : on glisse depuis le haut du panneau.
  Suivre aussi un glissement commencé dans le texte, quand il est en haut de son défilement,
  demanderait de gérer les événements tactiles bruts ; c'est laissé de côté.
- `docs/dependencies.md` est inchangé.
