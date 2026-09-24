# 0023 — Migration du format stocké

**Statut** : Acceptée

## Contexte

`LocalStorageClient` ([0002](0002-repository-pattern-localstorage-v1.md)) enveloppe les données
dans `{ schemaVersion, data }`, mais ignorait purement et simplement une version différente : il
renvoyait la valeur par défaut, une liste vide. Faire évoluer le format des personnages
([0022](0022-computed-class-values-and-resources.md)) aurait donc effacé tous les personnages
enregistrés dans le navigateur.

Le même problème existe à l'import : une sauvegarde ou une fiche JSON écrite avant l'évolution
doit rester importable.

## Décision

- **Version par ressource.** Chaque `LocalStorageClient` déclare sa version de format et une
  fonction de migration optionnelle. Les cas :
  - donnée de la version courante : lue telle quelle ;
  - donnée d'une version antérieure : migrée à la lecture, puis réécrite au format courant ;
  - donnée d'une version plus récente, ou migration absente : ignorée, comme avant, puisqu'on ne
    peut pas l'interpréter.
- **Les personnages passent en version 2.** La version 1 correspond au format d'origine. Le
  `v1` de la clé `dnd-character-manager:v1:characters` est l'espace de nommage d'origine, pas la
  version du format : il ne change pas.
- **Une seule normalisation**, `normalizeLegacyCharacter` (`src/domain/migrations/`), pour le
  stockage comme pour l'import. Elle travaille sur des données brutes et elle est idempotente : un
  personnage déjà au format courant ressort inchangé. Elle fait trois choses :
  - `class` libre → `classId` connu, si le libellé est reconnu ;
  - `spellSlots[].used` → `spellSlotsUsed`, les totaux stockés disparaissent ;
  - pour un Clerc, les capacités reconnues comme de la Canalisation divine sont liées à la
    ressource commune, et la consommation relevée est reprise.
- **Import** : `characterSchema` applique cette normalisation avant la validation Zod
  (`z.preprocess`). Les imports de fiches et de sauvegardes complètes acceptent ainsi l'ancien et
  le nouveau format.

## Conséquences

- Une évolution future du format ajoute une étape de migration au lieu de risquer une perte de
  données.
- L'export produit toujours le format courant.
- La reconnaissance des capacités de Canalisation divine se fait par nom (« Canalisation divine »,
  « Channel Divinity », « Renvoi des morts-vivants », « Sanctuaire du Crépuscule »…). Une capacité
  au nom non reconnu garde son compteur propre ; on peut la lier à la main dans la configuration.
