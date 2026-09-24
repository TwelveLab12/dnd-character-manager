# 0035 — Refonte de l'onglet Général de la configuration

**Statut** : Acceptée

## Contexte

L'onglet Général empilait des champs sans hiérarchie. La classe, la sous-classe et la race
existaient chacune deux fois : un champ texte libre (le libellé affiché dans la liste et en mode
jeu) et une liste « règles appliquées » (l'id qui pilote les calculs). Les dons et options de
combat étaient éparpillés entre les sections PV, CA et attaques. Les PV actuels et temporaires se
saisissaient ici alors qu'ils se gèrent déjà en mode jeu. La refonte suit une maquette Design
validée par l'utilisateur.

## Décision

- **Une seule liste par classe, sous-classe et race.** Elle propose les entrées du registre et
  « Autre (saisie libre)… ».
  - Choisir une entrée du registre règle l'id (`classId`, `subclassId`, `raceSelection`) et
    recopie son nom dans le libellé (`class`, `subclass`, `race`). Changer de classe efface la
    sous-classe.
  - « Autre » retire l'id et fait apparaître le libellé en texte libre. Pour une race hors
    registre, la vitesse de base se saisit à côté.
  - Une pastille indique « Règles appliquées » ou « Texte libre ».
  - Le modèle de données ne change pas : libellé et id restent deux champs, seule l'interface les
    synchronise.
- **Identité en tête** : le nom en grand, le niveau avec des boutons − / + (bornés à 1–20).
- **Bonus raciaux en jetons** : les six caractéristiques, avec le score effectif. Pour un bonus au
  choix, les jetons se cliquent ; au-delà du nombre permis, le choix le plus ancien cède sa place.
  Les bonus fixes sont affichés sans être modifiables.
- **Quatre tuiles de résumé** (PV max, CA, Initiative, Vitesse), avec le détail du calcul ; chacune
  est un lien vers la section qui la règle.
- **PV max** : un sélecteur « Valeur fixe / Dés lancés » et une case par niveau, où se saisit le
  résultat du dé.
- **Maîtrises d'armure et d'armes en jetons.** Celles accordées par la classe ou la sous-classe
  sont verrouillées, avec leur source.
- **Dons, styles et bonus réunis dans une section** : les dons du registre, Maître des armures
  intermédiaires, Ambidextre, le style Combat à deux armes, Arts martiaux et le bonus d'initiative
  hors Dextérité.
- **Thème en cartes** avec un aperçu de trois couleurs (`swatches` dans le registre des thèmes).
- **PV actuels et temporaires retirés de la configuration** : ils ne se modifient plus qu'en mode
  jeu.

## Conséquences

- Plus de doublon libellé / règles à maintenir à la main. En contrepartie, un libellé enrichi
  (ex : « Humain variant (Illuskien) ») est remplacé par le nom du registre si l'on choisit de
  nouveau l'entrée dans la liste.
- Les sections sont découpées en fichiers (`identity-section.tsx`, `hit-points-section.tsx`,
  `general-section.tsx` pour les primitives partagées).
- Les autres onglets de configuration seront revus un par un, chacun après sa propre maquette.
