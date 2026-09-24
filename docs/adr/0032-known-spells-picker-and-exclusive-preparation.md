# 0032 — Sorts connus : sélecteur dédié et préparation exclusive

**Statut** : Acceptée

## Contexte

L'onglet Sorts de la configuration affichait deux listes :

- toute la bibliothèque, avec deux switches « Connu » et « Préparé » ;
- les sorts connus, avec un domaine et un switch « Toujours préparé ».

Les mêmes sorts apparaissaient donc deux fois. Un sort pouvait aussi être à la fois préparé et
toujours préparé, ce qui n'a pas de sens. Enfin, avec une bibliothèque importante, cocher
« Connu » dans une longue table n'était pas pratique. Les tours de magie devaient en plus être
« préparés » pour apparaître en mode jeu, alors qu'en 5e 2014 un tour de magie connu est toujours
disponible.

## Décision

- **Une seule liste, celle des sorts connus.** Chaque ligne porte le domaine, « Préparé »,
  « Toujours préparé » et le retrait. Les sorts sont groupés par niveau.
- **Préparé et toujours préparé s'excluent.** Le modèle stocké ne change pas
  (`preparedSpellIds` et `spellTags[].alwaysPrepared`). C'est le domaine qui garantit
  l'exclusivité, dans `src/domain/calculations/spell-preparation.ts`
  (`setSpellPreparation`, `spellPreparationState`).
  - Passer un sort préparé en toujours préparé est immédiat.
  - Le sens inverse demande une confirmation, parce qu'il retire un statut qui ne coûte pas de
    préparation.
  - Si d'anciennes données portent les deux états, « toujours préparé » l'emporte.
- **L'ajout de sorts connus est un mécanisme isolé**, `KnownSpellsPicker` : un panneau latéral
  avec une recherche, des filtres par niveau, un filtre sur la classe (actif par défaut) et une
  sélection multiple.
  - Il ne connaît pas le personnage. Il reçoit la bibliothèque, les sorts déjà connus et une
    classe, puis remonte la sélection.
  - Il pourra donc être réutilisé en mode jeu.
  - Le filtre de classe compare `Spell.classes`, un libellé libre (« Clerc », « Cleric »), aux
    alias des classes connues (`spellBelongsToClass`).
- **Les tours de magie n'ont pas de switch de préparation.** `playAvailableSpellIds` ajoute les
  tours de magie connus aux sorts disponibles en jeu.

## Conséquences

- Aucune migration : les données existantes restent valides, et les incohérences héritées sont
  corrigées à la première modification du sort.
- Retirer un sort connu retire aussi son état préparé et son tag, comme le faisait le switch
  « Connu ».
- Un sort importé sans classe n'apparaît qu'une fois le filtre de classe désactivé.
