# 0011 — Le tag de domaine de sort est porté par le personnage, pas par le sort

**Statut** : Acceptée

## Contexte

La refonte de l'espace sort (mode jeu) doit permettre de filtrer/afficher les sorts « de
domaine » (ex : sorts toujours disponibles d'un Clerc de Séluné) sans consommer une préparation.
`Spell` (`src/domain/spell.ts`) a un champ `classes: string[]` mais aucune notion de domaine —
et ça ne peut pas en avoir une de façon fiable : un même sort importé (SRD/open5e) peut être
partagé par plusieurs classes/domaines, et le domaine effectif d'un sort dépend de la
sous-classe du personnage qui l'a choisi, pas du sort lui-même.

## Décision

Modéliser l'association personnage↔sort dans un nouveau type
`CharacterSpellTag` (`src/domain/spell-tag.ts`) :

```ts
interface CharacterSpellTag {
  spellId: string;
  domain?: string; // libre, ex: "Domaine de la Lune"
  alwaysPrepared: boolean; // disponible sans consommer de préparation
}
```

porté par `Character.spellTags: CharacterSpellTag[]`, plutôt que d'ajouter un champ `domain` sur
`Spell`. Un tag ne peut concerner qu'un sort déjà dans `knownSpellIds` — contrainte d'UI
uniquement (l'éditeur dans `spells-tab.tsx` ne propose que les sorts connus), pas une validation
Zod cross-champ.

`src/domain/calculations/spell-availability.ts` expose `playAvailableSpellIds` (union
`preparedSpellIds` ∪ sorts `alwaysPrepared`, dédupliquée) et `spellDomainTags` (domaines distincts
non vides) pour alimenter le mode jeu.

## Conséquences

Le domaine d'un sort est propre à _ce_ personnage : deux personnages qui connaissent le même sort
peuvent lui donner des domaines différents (ou aucun), ce qui correspond à la réalité de règle.
En contrepartie, il faut nettoyer `spellTags` partout où `knownSpellIds` perd une entrée (comme
c'était déjà le cas pour `preparedSpellIds`) pour éviter qu'un sort « toujours préparé » orphelin
ne reste disponible en jeu après avoir été retiré des sorts connus.
