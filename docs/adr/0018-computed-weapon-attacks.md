# 0018 — Attaques d'armes calculées par arme équipée

**Statut** : Acceptée

## Contexte

Les bonus d'attaque étaient deux nombres saisis à la main (`meleeAttackBonus`,
`rangedAttackBonus`). Ils ne disaient rien des dégâts et ne suivaient ni les caractéristiques, ni
le niveau, ni l'arme en main. Comme pour la CA ([0017](0017-computed-armor-class.md)), le joueur
devait tout recalculer de tête.

## Décision

Les deux champs sont supprimés. `computeWeaponAttacks` (`src/domain/calculations/weapon-attack.ts`)
produit une attaque par arme équipée, selon les règles 5e **2014**.

- **Arme :** un objet d'inventaire porte `weapon`, avec la catégorie courante ou de guerre, la
  portée (corps à corps ou distance), les dés de dégâts « NdM », un dé polyvalent optionnel, le
  type de dégâts, la finesse et un bonus magique.
- **Caractéristique :** Force au corps à corps, Dextérité à distance, la meilleure des deux avec
  finesse. Le bonus racial est inclus.
- **Jet d'attaque** = mod + bonus de maîtrise + bonus magique. Le bonus de maîtrise ne compte que
  si la catégorie de l'arme est maîtrisée (`weaponProficiencies`, cochées par catégorie).
- **Dégâts** = dés + mod + bonus magique.
- **Priorité aux propriétés qui changent les chiffres.** Seules la portée, la finesse et la
  polyvalence sont modélisées dans cette première version.
- **Tolérance à l'import :** le format des dés n'est pas validé strictement, pour qu'une faute de
  frappe ne bloque pas l'import d'une sauvegarde. L'interface signale le format invalide à la
  saisie. Un ancien JSON avec les bonus saisis s'importe toujours, les clés sont ignorées.

## Conséquences

- Chaque arme équipée affiche son bonus d'attaque et ses dégâts, recalculés quand le niveau, les
  caractéristiques ou l'équipement changent.
- Les personnages existants perdent leurs bonus saisis. Leurs armes doivent être renseignées dans
  l'Inventaire.
- Hors périmètre pour l'instant :
  - les autres propriétés : deux mains, lancer, allonge, chargement, munitions, légère et combat à
    deux armes ;
  - les armes de moine et les Arts martiaux ;
  - les styles de combat, les sorts qui modifient les attaques, les attaques de sorts ;
  - la maîtrise d'une arme précise hors catégorie (ex. épée longue pour un elfe).
