# 0048 — Races : PV par niveau et vitesse en armure lourde

**Statut** : Acceptée

## Contexte

Le registre des races ([0009](0009-generic-race-ability-bonuses.md)) ne portait que des bonus de
caractéristiques et une vitesse ([0026](0026-computed-saves-speed-initiative.md)). Le Nain des
collines (Murrik) a deux règles de plus qui changent des valeurs calculées : la Robustesse naine
(+1 PV max par niveau), et une vitesse que l'armure lourde ne réduit pas, même sans la Force
requise.

## Décision

`RaceDefinition` gagne deux champs optionnels :

- `hitPointsPerLevel` : ajouté aux PV max à chaque niveau, comme le don Robuste. Il apparaît dans
  les sources de bonus (`bonusSources`), avant les dons, avec le nom de la race. Le détail par
  niveau de la configuration indique désormais « bonus » plutôt que « dons ».
- `ignoresHeavyArmorSpeedPenalty` : la pénalité de 3 m en armure lourde sans la Force requise
  n'est pas appliquée.

Le Nain des collines est ajouté avec ces deux règles : +2 Constitution, +1 Sagesse, vitesse
7,5 m.

Comme les PV max d'une classe hors registre sont saisis à la main, le bonus de race ne s'y ajoute
pas : il est déjà compté dans la valeur saisie.

## Conséquences

Une autre race avec un effet de ce type (ex : Nain des montagnes et sa vitesse en armure lourde)
s'ajoute par une entrée dans le registre. Les autres traits raciaux (vision dans le noir,
résistances…) restent des capacités décrites sur la fiche.
