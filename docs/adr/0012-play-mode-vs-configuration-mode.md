# 0012 — Séparation mode jeu / mode configuration, persistance immédiate vs brouillon

**Statut** : Acceptée

## Contexte

L'app n'avait qu'un seul mode d'usage : une fiche personnage entièrement éditable inline
(`CharacterSheet`, brouillon local + bouton « Enregistrer » global), sans distinction entre
« configurer complètement le personnage » et « manipuler les informations en cours de partie »
(PV, PV temporaires, repos, concentration, sorts disponibles). Ce pattern brouillon+Enregistrer
convient à une session d'édition réfléchie, mais est mal adapté au suivi en temps réel d'un combat
(risque d'oublier de cliquer « Enregistrer » après avoir encaissé des dégâts).

## Décision

Deux écrans distincts, deux modèles de persistance distincts :

- **Mode jeu** (`src/features/character-play/`, route `/characters/[characterId]`, **route par
  défaut**) : un dashboard, pas un formulaire à onglets. Chaque action (dégâts/soin/PV
  temporaires, repos court/long, bascule de concentration, ajustement d'utilisation de capacité)
  persiste **immédiatement** via `use-play-actions.ts`, qui relit l'état courant du store au
  moment de l'action (`characterStore.getState()`) plutôt qu'une valeur de rendu fermée — pour
  éviter qu'un double-clic rapide (ex : deux dégâts coup sur coup) ne perde une mise à jour à
  cause d'une closure périmée.
- **Mode configuration** (`src/features/character-sheet/`, nouvelle route
  `/characters/[characterId]/edit`) : strictement inchangé, garde le pattern brouillon + bouton
  « Enregistrer » existant.

La checkbox « Concentration active », auparavant isolée dans l'onglet Général de la
configuration, est retirée de cet écran : la concentration est maintenant un marqueur visible et
actionnable uniquement en mode jeu (`ConcentrationMarker`), plus cohérent avec son usage réel (un
état qui change pendant le combat, pas à la création du personnage).

## Conséquences

Deux features avec deux modèles mentaux différents à maintenir (dashboard temps réel vs formulaire
à brouillon), mais chacune reste simple dans son rôle — pas de mode conditionnel à l'intérieur d'un
même composant. Toute la logique métier de repos/PV/capacités vit dans `src/domain/calculations/`
(voir [0010](0010-active-rest-mechanic.md)) et est appelée par les deux écrans, donc pas de
duplication de règles malgré la duplication d'écrans. Un personnage sans PV/sorts/capacités
particuliers verra un mode jeu presque vide au premier lancement — attendu, rien à configurer tant
que le mode configuration n'a pas été rempli au moins une fois.
