# 0031 — Onglet « Combat » et résumé fixe en mode jeu

**Statut** : Acceptée

## Contexte

Le HUD de combat ([0021](0021-combat-hud-always-visible.md)) est affiché au-dessus des onglets,
quel que soit l'onglet ouvert. Il a grandi à chaque évolution : attaques, emplacements de sorts,
réserves de classe ([0024](0024-hud-resources-band.md)), capacités à utilisations
([0030](0030-feature-uses-in-play-mode.md)). Les onglets se retrouvent loin sous la ligne de
flottaison, et chaque changement d'onglet oblige à redescendre.

## Décision

Reconsidère 0021 :

- **Le HUD devient l'onglet « Combat »**, premier onglet, ouvert par défaut. Son contenu ne
  change pas.
- **Notes passe en dernier.** Ordre : Combat · Caractéristiques · Sorts · Inventaire · Capacités
  · Notes.
- **Un résumé en lecture seule reste au-dessus des onglets** (`combat-summary.tsx`), collé en haut
  de l'écran au défilement : CA (en couleur « info » si un effet de CA est actif), PV actuels /
  max et PV temporaires, et le sort de concentration quand elle est active. Il ne porte aucun
  contrôle : tout se modifie dans l'onglet Combat.

## Conséquences

- Les autres onglets sont accessibles sans défilement, et la CA, les PV et la concentration
  restent visibles partout.
- Répondre à « quelle est ta CA ? » reste immédiat ; infliger des dégâts ou lancer un repos demande
  d'ouvrir l'onglet Combat.
- La barre d'onglets défile horizontalement sur les écrans étroits (6 onglets).
