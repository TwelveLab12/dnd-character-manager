# 0063 — Bouton plein écran sur toutes les pages

**Statut** : Acceptée

## Contexte

Le bouton plein écran n'existait que dans l'en-tête de la fiche en mode jeu. Or le plein écran
(API Fullscreen, sur `document.documentElement`) persiste pendant la navigation côté client. Un
joueur entré en plein écran depuis une fiche arrivait donc sur l'accueil, la bibliothèque de sorts
ou la configuration sans moyen d'en sortir, sauf à revenir sur une fiche ou à passer par le
navigateur.

## Décision

- `FullscreenToggle` passe dans `src/features/shared/`. Il figure dans l'en-tête de **chaque page**,
  avec les autres actions en haut à droite : accueil, bibliothèque de sorts, Nouveautés,
  configuration d'un personnage, fiche en mode jeu, page hors ligne.
- Un bouton flottant global (coin de l'écran, dans le layout racine) a été écarté : sur téléphone,
  il recouvrirait le contenu au défilement et doublerait les actions d'en-tête.
- Comme avant, le bouton ne s'affiche pas quand le navigateur ne permet pas le plein écran (Safari
  sur iPhone).
- Un test parcourt toutes les pages et vérifie que chacune permet de quitter le plein écran.

## Conséquences

Toute nouvelle page doit placer `FullscreenToggle` dans son en-tête et s'ajouter au test
`fullscreen-toggle-pages.test.tsx`.
