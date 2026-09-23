# 0010 — Le repos devient une mécanique active, pas seulement descriptive

**Statut** : Acceptée

## Contexte

`CharacterFeature.recharge` (`"shortRest" | "longRest" | "other"`) existe depuis le premier
modèle de `CharacterFeature`, mais n'était lu nulle part : rien ne réinitialisait
`usesCurrent` au moment d'un repos. Le seul bouton existant, « Repos long » dans
`spells-tab.tsx`, se contentait de vider les emplacements de sorts (`spellSlots[].used = 0`).
Sans logique de repos centralisée, la refonte du mode jeu (PV/repos/capacités manipulables
rapidement) aurait fini par dupliquer une réinitialisation ad hoc dans chaque écran qui a besoin
de déclencher un repos.

## Décision

Centraliser toute la logique de repos dans `src/domain/calculations/rest.ts`, sous forme de
fonctions pures `applyShortRest(character)` / `applyLongRest(character): Partial<Character>` :

- **Repos long** : PV courants restaurés au maximum (les PV temporaires ne sont pas remboursés —
  ils sont censés disparaître avant le prochain repos), tous les emplacements de sorts vidés,
  `usesCurrent = usesMax` pour toute capacité avec `recharge: "longRest"`.
- **Repos court** : uniquement `usesCurrent = usesMax` pour les capacités `recharge: "shortRest"`
  — ne touche ni aux PV ni aux emplacements de sorts.

Ces fonctions sont l'unique implémentation, appelée à la fois par le mode configuration (boutons
« Repos court »/« Repos long » dans `spells-tab.tsx`) et, à terme, par le mode jeu — un seul
comportement testé, plusieurs appelants.

Pas de dés de vie modélisés : le domaine n'a aucune notion de dé de vie/soin au repos court par
dépense de dé, donc `applyShortRest` ne restaure pas de PV. Extension future possible si le besoin
apparaît.

## Conséquences

Le champ `recharge`, jusque-là de la métadonnée cosmétique, a maintenant un effet observable :
toute capacité qui veut être réinitialisée automatiquement doit avoir `usesMax` renseigné (une
capacité sans `usesMax` est ignorée, elle n'a rien à réinitialiser). Le bouton « Repos long »
existant change de comportement (il restaure aussi les PV et les capacités, plus seulement les
emplacements de sorts) — c'est un changement de comportement volontaire, pas une régression :
c'était l'intention du bouton depuis le début, seule l'implémentation était incomplète.
