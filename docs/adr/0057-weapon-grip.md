# 0057 — Prise d'une arme en main : principale, secondaire, deux mains

**Statut** : Acceptée

## Contexte

Depuis les armes prêtes ([0054](0054-ready-weapons.md)), le choix de la main n'apparaissait sous
« En main » que pour une arme autorisée en main secondaire : pour une épée longue, aucun choix
n'était visible. Surtout, une arme **polyvalente** (épée longue, bâton, lance…) n'avait pas d'état
« tenue à deux mains » ([0020](0020-equipment-slots-and-two-weapon-fighting.md)) : l'onglet Combat
affichait ses deux dégâts à la fois (« 1d8+3 · 1d10+3 à deux mains »), sans savoir lequel
s'appliquait, et un bouclier ou une arme secondaire pouvaient rester équipés pendant qu'elle était
tenue à deux mains. Le dégât affiché pouvait donc être faux.

## Décision

- `WeaponHand` gagne `"both"` : une arme polyvalente tenue à deux mains. Stockée dans
  `InventoryItem.hand` comme la main secondaire ; absente = main principale, sans migration.
- `weaponGrip` (src/domain/equipment.ts) donne la prise effective : une arme à deux mains est
  toujours à deux mains ; une prise que l'arme ne permet plus (polyvalence ou légèreté retirées dans
  l'éditeur) retombe en main principale.
- Une polyvalente à deux mains occupe les deux mains, comme une arme à deux mains : la prendre
  déloge bouclier et arme secondaire, et un bouclier équipé la déloge.
- Dégâts : une arme **en main** n'a que les dégâts de sa prise (dé polyvalent à deux mains, dé
  normal sinon) et porte l'étiquette « Deux mains » quand elle est tenue ainsi. Une arme **prête**,
  dont la prise n'est pas encore choisie, garde ses deux dégâts.
- Interface : sous « En main », un sélecteur segmenté **Principale · Secondaire · Deux mains**.
  « Secondaire » reste visible, grisée avec sa raison, quand l'arme ne le permet pas ; « Deux
  mains » n'apparaît que pour une arme polyvalente ; une arme à deux mains n'a pas de sélecteur.
  `SegmentedControl` accepte pour cela des options désactivées.

## Conséquences

Les armes polyvalentes déjà équipées passent en main principale et n'affichent plus que leur dé
normal jusqu'à ce que « Deux mains » soit choisi. Le choix se fait dans les deux onglets Inventaire
(configuration et mode jeu), qui partagent le même contrôle.
