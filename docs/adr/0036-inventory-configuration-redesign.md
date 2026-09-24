# 0036 — Refonte de l'onglet Inventaire de la configuration

**Statut** : Acceptée

## Contexte

L'onglet Inventaire de la configuration affichait chaque objet sous forme d'un formulaire complet
(nom, quantité, poids, type, CA, dégâts, propriétés, description), déplié en permanence. Avec une
dizaine d'objets, la page devenait longue et difficile à parcourir, et les champs d'une arme
côtoyaient ceux d'une corde. La refonte suit une maquette Design validée par l'utilisateur et
reprend les codes de l'Inventaire du mode jeu ([0029](0029-character-purse-and-play-mode-inventory.md)).

## Décision

- **La bourse** est un composant partagé avec le mode jeu (`src/features/shared/purse.tsx`) : un
  jeton par pièce et le total converti en po.
- **Deux groupes**, comme en mode jeu : « Armes & armures » (objets avec des propriétés d'arme ou
  d'armure) et « Sac ». Chaque groupe affiche son poids.
- **Ordre alphabétique par défaut** dans chaque groupe, en configuration comme en mode jeu
  (`sortInventoryByName`) : sans tenir compte des majuscules ni des accents ; un objet encore sans
  nom va à la fin. Le tri se fait à l'affichage : le stockage garde l'ordre d'ajout et aucun ordre
  manuel n'est enregistré pour l'instant. Un réordonnancement par glisser-déposer est prévu plus
  tard ; il demandera alors de stocker un ordre choisi.
- **Une ligne résumée par objet** : icône du type, nom, résumé (« Arme courante · 1d6 contondant ·
  2 kg »), contrôle d'équipement pour les armes et armures, quantité pour le sac.
- **Un seul objet déplié à la fois** pour l'édition. Le panneau garde les champs communs (nom,
  quantité, poids, description) et n'affiche que ceux du type choisi :
  - un sélecteur de type (Objet, Arme, Armure, Bouclier). Changer de type déséquipe l'objet :
    son emplacement ne vaut plus pour le nouveau type ;
  - arme : catégorie, portée, dés et type de dégâts, dés polyvalents, bonus magique, propriétés en
    jetons (Finesse, Légère, Deux mains, Lancer avec ses portées, Arme de moine), et l'attaque
    calculée pour le personnage ;
  - armure : catégorie, CA de base (qui suit la catégorie tant qu'elle n'a pas été modifiée),
    bonus magique, Force minimale pour une armure lourde ; bouclier : son bonus et son bonus
    magique ;
  - objet simple : bonus de CA et équipement (anneau, cape…).
- **Ajout typé** : trois boutons (Arme, Armure, Objet) créent l'objet déjà typé et déplié.
- La suppression se fait depuis le panneau déplié, pas depuis la ligne, pour éviter les clics
  accidentels.

## Conséquences

- Le modèle de données ne change pas.
- `Purse`, `QuantityStepper` et `SegmentedControl` sont partagés entre les onglets et les modes.
- Comparer deux objets en les modifiant n'est plus possible côte à côte : c'est un choix de
  lisibilité, validé sur la maquette.
