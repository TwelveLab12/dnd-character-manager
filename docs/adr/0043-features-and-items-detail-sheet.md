# 0043 — Panneau de détail pour les capacités, dons et objets

**Statut** : Acceptée

## Contexte

Après les sorts ([0041](0041-spell-detail-sheet.md)) et l'onglet Combat
([0042](0042-combat-tab-detail-sheet.md)), deux listes du mode jeu n'avaient pas encore le
panneau de détail :

- l'onglet Capacités, où les dons et les autres capacités sans compteur se dépliaient chacun à sa
  place ;
- l'onglet Inventaire, où la description d'un objet était tassée sur une seule ligne, à côté du
  poids.

Les dons sont des capacités de la fiche (origine « Don ») : le registre des dons ne contient que
leur mécanique, sans texte ([0028](0028-feat-registry.md)).

## Décision

- **Un seul panneau pour tout le mode jeu.** Le panneau de l'onglet Combat devient
  `PlayDetailSheet`. Il couvre quatre types de blocs : capacité (don compris), option de
  ressource de classe, attaque d'arme et objet d'inventaire.

- **Onglet Capacités.** Les lignes dépliables des capacités sans compteur, dons compris, ouvrent
  désormais le panneau. On utilise ainsi le même geste partout. Le contenu du panneau dépend de
  la capacité :
  - une capacité liée à une ressource de classe affiche la réserve et un bouton « Utiliser » ;
  - les autres sont en lecture seule.

  Les cartes des capacités à utilisations gardent leur description affichée directement.

- **Onglet Inventaire.** Toute la ligne d'un objet ouvre le panneau. Les boutons d'équipement et
  de quantité restent au-dessus et gardent leur action. Le panneau affiche :
  - le type : objet, arme (catégorie, portée), armure (catégorie) ou bouclier ;
  - les valeurs clés : dégâts et type, ou CA et Force minimale, puis la quantité et le poids ;
  - l'attaque calculée, si l'arme est équipée ;
  - la description.

  Il n'a pas de pied : les réglages restent sur la ligne.

- **Description absente.** Le panneau renvoie vers l'onglet de configuration où elle se saisit :
  Capacités ou Inventaire.

## Conséquences

- En mode jeu, toute capacité, tout don et tout objet se lit en touchant son bloc.
- La description d'un objet n'est plus coupée dans la liste. En contrepartie, elle n'est plus
  visible sans ouvrir le panneau : la ligne n'affiche plus que le poids.
- Lire une capacité demande désormais d'ouvrir puis de fermer le panneau, au lieu de la déplier
  sur place.
