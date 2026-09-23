# 0003 — Zustand pour la réactivité UI au-dessus des repositories

**Statut** : Acceptée

## Contexte

Les repositories ([0002](0002-repository-pattern-localstorage-v1.md)) exposent des méthodes
impératives (promesses), mais l'UI a besoin de réactivité : créer un personnage depuis un écran doit
mettre à jour la liste affichée ailleurs sans rechargement manuel.

## Décision

Un store [Zustand](https://github.com/pmndrs/zustand) par ressource (`src/stores/`), créé par une
factory qui reçoit le repository en paramètre (`createCharacterStore(repository)`) plutôt que
d'importer le repository directement — le store reste ainsi testable en isolation avec un
repository en mémoire factice, sans monter de composant React ni de Context.

Alternative écartée : Context + `useReducer` maison, qui évite une dépendance mais réintroduit
sensiblement le même boilerplate pour un résultat équivalent.

## Conséquences

Nouvelle dépendance (~1 Ko) assumée pour un pattern standard et bien documenté dans l'écosystème
React/Next. Les composants consomment le store via son hook (`useCharacterStore`), jamais le
repository directement.
