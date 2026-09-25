# 0052 — Classe Moine : Ki, Arts martiaux, Défense et Déplacement sans armure

**Statut** : Acceptée

## Contexte

Mordaï, moine tieffelin de niveau 3, était saisi avec une classe en texte libre. L'app compensait
à la main ce qu'elle ne calculait pas : PV max saisis, jets de sauvegarde cochés, interrupteur
« Arts martiaux », effet de CA manuel « Défense sans armure (Sag) » (+2), bonus de vitesse de +3 m
([0050](0050-speed-extra-bonus.md)) et une capacité « Ki » avec son propre compteur. Le calcul de
la CA ([0017](0017-computed-armor-class.md)) avait explicitement laissé la Défense sans armure de
côté.

## Décision

Le Moine rejoint le registre des classes (règles 2014), sur le modèle du Clerc et du Druide :

- dé de vie d8, jets de sauvegarde Force et Dextérité, armes courantes ;
- **Ki** : ressource de classe (`ki`), autant de points que le niveau de moine dès le niveau 2,
  récupérés au repos court. Options : Déluge de coups, Patience défensive, Déplacement du vent
  (niveau 2), Frappe étourdissante (niveau 5) ;
- sous-classe **Voie de la main ouverte**, sans effet calculé.

La définition de classe gagne trois règles optionnelles, réutilisables par d'autres classes :

- `martialArts` : les Arts martiaux sont accordés par la classe. Comme les autres valeurs des
  règles, ils restent désactivables par personnage : seul le retrait est stocké
  (`Character.martialArts === false`), l'interrupteur affiche alors « Retirés · Moine ». Pour une
  autre classe, l'interrupteur coché à la main fonctionne comme avant.
- `unarmoredDefense` : sans armure (et sans bouclier si la classe ne le permet pas), la CA ajoute
  le modificateur de la caractéristique indiquée (Sagesse pour le Moine), détaillé « Sag (Défense
  sans armure) ». Le Barbare (Constitution, bouclier permis) pourra la réutiliser.
- `unarmoredMovement` : sans armure ni bouclier, un bonus de vitesse selon le niveau (+3 m au
  niveau 2, puis +1,5 m aux niveaux 6, 10, 14 et 18).

**Bascule depuis le texte libre** (`changeClass`), sur le modèle de la race
([0051](0051-race-change-keeps-effective-scores.md)) : quand la classe saisie correspond à une
classe connue, un encart résume ses règles et propose « Appliquer les règles de la classe ». Pour
ne rien compter deux fois, la bascule retire ce que les règles calculent désormais : jets de
sauvegarde de la classe cochés à la main, PV max saisis, Arts martiaux cochés, effet de CA dont le
nom contient « Défense sans armure », part du bonus de vitesse couverte par le Déplacement sans
armure, et compteur propre d'une capacité qui porte le nom d'une ressource de classe (« Ki »). Une
sous-classe saisie en texte libre est reconnue au passage. L'inverse, d'une classe connue vers le
texte libre, reporte ces valeurs en saisie manuelle. Entre deux classes connues, seules la classe
et la sous-classe changent, comme avant.

## Conséquences

Un moine voit sa réserve de ki en mode jeu, sa CA et sa vitesse calculées selon ce qu'il porte.
L'avertissement « Arts martiaux inactifs » vaut aussi pour les Arts martiaux accordés par la
classe. La même bascule servira aux prochaines classes ajoutées (ex : Barbare pour Murrik).
