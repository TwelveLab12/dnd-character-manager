# 0041 — Panneau de détail des sorts

**Statut** : Acceptée

## Contexte

Aucun écran ne permettait de lire correctement un sort. En mode jeu, toucher le nom d'une carte
dépliait sa description ([0034](0034-play-mode-spell-casting-and-preparation.md)), mais rien ne
l'indiquait : pas de chevron, pas d'icône. La configuration (sorts connus) et la bibliothèque
n'affichaient aucun détail, alors que c'est là qu'on choisit ses sorts. La maquette du panneau a été
validée avant l'implémentation.

## Décision

- **Un seul composant partagé**, `SpellDetailSheet` (`src/features/shared/`). C'est un `Sheet`
  Radix ouvert par le bas :
  - il se ferme au clic en dehors, par ✕ ou par Échap ; un clic à l'intérieur ne le ferme pas,
    pour pouvoir faire défiler et agir ;
  - sur grand écran, il est centré et limité à `max-w-2xl`.

  Il montre, dans l'ordre :
  - le niveau et l'école ;
  - le nom ;
  - les tags : toujours préparé, concentration, rituel ;
  - l'incantation, la portée, la durée et les composantes, sur 2 colonnes (4 sur grand écran) ;
  - le matériel, la description et « Aux niveaux supérieurs ».

  Un seul panneau par écran, piloté par l'id du sort affiché.

- **Tout le bloc ouvre le panneau.** Un bouton transparent couvre la carte ou la ligne, et une
  icône ⓘ sert d'indice visuel. Les contrôles du bloc passent au-dessus (`relative z-10`) et gardent
  leur propre action : « Lancer », « Rompre », les switches de préparation, le domaine, la
  suppression. Le dépliage caché de la carte en mode jeu disparaît.

- **Le pied du panneau dépend de l'écran.**
  - En mode jeu, il permet de lancer le sort avec le même bouton et le même chevron que la carte
    (logique extraite dans `useSpellCasting`). Il affiche aussi les emplacements restants au niveau
    par défaut, et un avertissement quand le sort remplacerait une autre concentration. Le panneau
    se ferme une fois le sort lancé.
  - En configuration et dans la bibliothèque, le panneau est en lecture seule, sans pied : les
    réglages restent sur la ligne, pour éviter un doublon. Les classes et la source y sont ajoutées.

- **Thème.** Le panneau est rendu dans un portail, donc hors de `CharacterThemeScope`. Il repose
  lui-même `data-theme` avec le thème du personnage. La bibliothèque, sans personnage, garde la
  palette neutre.

- **Tags partagés.** `ConcentrationTag`, `RitualTag` et `AlwaysPreparedTag` passent dans
  `src/features/shared/spell-tags.tsx`.

## Conséquences

- Lire un sort se fait de la même façon partout, et le geste est visible.
- Les cartes du mode jeu ne s'allongent plus quand on lit un sort.
- En mode jeu, lire la description demande un geste de plus que l'ancien dépliage (ouvrir puis
  fermer), mais cette lecture inclut désormais le lancement.
- La fermeture par glissement vers le bas n'est pas implémentée. Elle demanderait `vaul` (Drawer
  shadcn) ; la barre de préhension n'est pour l'instant qu'un repère visuel.
- Les capacités, dons et objets pourront réutiliser le même principe, avec un contenu propre à
  leur type. Ce sera une décision séparée.
