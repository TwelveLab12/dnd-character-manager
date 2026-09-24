# 0028 — Registre des dons (bonus de PV par niveau)

**Statut** : Acceptée

## Contexte

Les PV max sont calculés ([0027](0027-computed-max-hit-points.md)), mais certains dons s'y ajoutent
à chaque niveau. Le cas type est **Robuste** (Tough, règles 2014) : les PV max augmentent de deux
fois le niveau à l'acquisition du don, puis de 2 à chaque niveau suivant, soit +2 par niveau au
total.

Les dons n'étaient jusqu'ici que des capacités en texte libre : leurs effets ne pouvaient pas être
appliqués.

## Décision

- **Registre des dons** (`src/domain/feat.ts`), sur le modèle des races, classes et sous-classes.
  Il ne contient que la mécanique modélisée (`hitPointsPerLevel`…) et des alias de reconnaissance,
  sans texte de règle. Il démarre avec :
  - **Robuste** : +2 PV par niveau ;
  - **Lanceur de sorts de bataille** : reconnu, sans effet calculé pour l'instant.

  Un don absent du registre reste une capacité saisie.

- **`Character.featIds`** : dons connus du personnage, cochés dans la configuration (onglet Général,
  « Dons »).
- **PV max** : chaque niveau reçoit la somme des bonus par niveau des dons, après le plancher de 1.
  Le bonus est rétroactif : il s'applique à tous les niveaux, comme le veut la règle.
- **Format stocké des personnages en version 6** ([0023](0023-stored-format-migrations.md)) : quand
  `featIds` est absent, les dons connus sont détectés dans le nom des capacités (ex : « Lanceur de
  sorts de bataille (War Caster) »). Une fiche qui porte déjà `featIds`, même vide, n'est jamais
  réécrite : c'est un choix du joueur. L'import JSON applique la même normalisation.

## Conséquences

- Cocher Robuste ajoute 2 PV max par niveau, y compris aux niveaux passés et à venir.
- La description d'un don reste dans l'onglet Capacités, et son effet calculé apparaît dans l'onglet
  Notes.
- Les bonus raciaux de PV (nain des collines…) suivront le même principe quand la race sera ajoutée
  au registre.
