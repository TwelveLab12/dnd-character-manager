# 0067 — Lien de retour commun et onglet conservé entre jeu et configuration

**Statut** : Acceptée

## Contexte

- Le lien « Mes personnages » des pages secondaires était un petit texte souligné, collé au titre
  qu'il surmonte. Chaque page le recodait à sa façon (« Retour à la liste », « Retour aux
  personnages »).
- « Modifier » (fiche en mode jeu) et « Voir la fiche » (configuration) ouvraient toujours le premier
  onglet. Un joueur sur l'onglet Sorts qui voulait modifier un sort devait le rechercher, alors que
  les deux modes ont des onglets miroirs ([0016](0016-play-mode-read-only-view-tabs.md)).

## Décision

- **`BackLink`** (`src/features/shared/back-link.tsx`) : pastille « ‹ 👥 Mes personnages » (bordure,
  survol, focus visible), séparée du titre par une marge. Elle sert à la bibliothèque de sorts, à
  Nouveautés, à la configuration (avec la garde des modifications non enregistrées), à la fiche et
  à la page hors ligne, y compris pour les cas « personnage introuvable ».
- **Onglets miroirs** (`src/features/shared/character-tabs.ts`) :
  - Caractéristiques, Sorts, Inventaire et Capacités portent le même nom des deux côtés ;
  - Combat et Notes (mode jeu) correspondent à Général (configuration), où se règlent PV, CA et
    notes ; Général ouvre Combat.
- « Modifier » et « Voir la fiche » construisent leur lien depuis l'onglet affiché. Les onglets des
  deux pages sont contrôlés et lus depuis `?tab=` à l'arrivée.
- L'onglet affiché est reporté dans l'URL par `history.replaceState`, que Next.js prend en charge.
  Il n'y a pas de nouvelle entrée d'historique, et un rechargement ou un retour arrière retombent
  sur le même onglet. Le premier onglet n'ajoute pas de paramètre.
- Hors ligne, le service worker retrouve la page mise en cache malgré le paramètre (`ignoreSearch`,
  [0045](0045-offline-service-worker.md)).

## Conséquences

Un onglet ajouté d'un côté doit être déclaré dans `character-tabs.ts`, avec son miroir ou son repli.
