# 0002 — Repository pattern avec implémentation localStorage en v1

**Statut** : Acceptée

## Contexte

L'application n'a pas de backend en v1 (voir [0005](0005-no-auth-no-backend-v1-scope.md)) : les
personnages et les sorts vivent dans le navigateur. On sait cependant qu'une implémentation base de
données/API viendra un jour, et on ne veut pas que ce changement force à réécrire la couche
domaine et l'UI.

## Décision

Toute lecture/écriture de données passe par des interfaces de repository définies dans
`src/repositories/contracts/` (`CharacterRepository`, `SpellRepository`), avec des méthodes
**asynchrones** dès le départ même si l'implémentation v1 (`src/repositories/local-storage/`) est
synchrone en interne. Les repositories sont injectés via `RepositoryProvider` (Context React), pas
importés directement par les composants ou les stores Zustand — voir
[0003](0003-zustand-stores-over-repositories.md).

`LocalStorageClient` centralise l'accès à `localStorage` : préfixe de clé versionné
(`dnd-character-manager:v1:...`), enveloppe `{ schemaVersion, data }` pour permettre des migrations
futures, parsing JSON défensif (fallback sur une valeur vide si les données sont corrompues), garde
SSR (aucun accès à `window` au niveau module).

Un seul blob JSON par ressource (`characters`, `spells`) plutôt qu'une clé par entité : la
volumétrie (quelques personnages, au plus quelques centaines de sorts) ne justifie pas la
complexité d'un stockage plus granulaire.

## Conséquences

Ajouter une implémentation `ApiCharacterRepository`/`ApiSpellRepository` plus tard ne touchera que
`src/repositories/` et le point d'instanciation dans `RepositoryProvider` — rien dans `src/domain/`,
`src/stores/` ou `src/features/` ne devrait changer. En contrepartie, les contrats async ajoutent un
peu de cérémonie (`await`) même pour des opérations synchrones en v1.
