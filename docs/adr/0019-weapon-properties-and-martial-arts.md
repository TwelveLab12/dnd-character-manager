# 0019 — Propriétés d'armes (deux mains, lancer) et Arts martiaux

**Statut** : Acceptée

## Contexte

L'[ADR 0018](0018-computed-weapon-attacks.md) ne modélisait que les propriétés d'armes qui
changent les chiffres : portée, finesse et polyvalence. Il manquait des propriétés utiles en
partie : deux mains, lancer, et le cas du Moine. Pour le Moine, ce n'est pas une propriété d'arme
mais la capacité de classe Arts martiaux, qui modifie la caractéristique et le dé de ses armes.

## Décision

Toujours selon les règles 5e **2014** :

- **Deux mains** (`weapon.twoHanded`) : aucun effet sur les chiffres. Si un bouclier est équipé en
  même temps, un avertissement s'affiche. Avec un bouclier équipé, les dégâts à deux mains d'une
  arme polyvalente ne sont plus affichés.
- **Lancer** (`weapon.thrown`, portées normale et longue **en mètres**, cohérentes avec la
  vitesse) : réservé aux armes de corps à corps. L'attaque lancée garde les mêmes chiffres ; la
  portée s'affiche en étiquette.
- **Arts martiaux** : interrupteur `Character.martialArts`. Ils sont actifs seulement sans armure
  ni bouclier équipés ; sinon, un avertissement s'affiche.
  - **Armes de moine** : détectées d'office pour les armes courantes de corps à corps pas à deux
    mains. Une case `weapon.monkWeapon` couvre le coutelas.
  - **Effets sur ces armes** : elles utilisent la meilleure de For/Dex. Le dé d'Arts martiaux (d4,
    puis d6 au niveau 5, d8 au 11, d10 au 17) remplace celui de l'arme s'il est meilleur en
    moyenne. Elles comptent comme maîtrisées.
  - **Mains nues** : une attaque est ajoutée automatiquement, avec le dé d'Arts martiaux et des
    dégâts contondants.

## Conséquences

- **Mode jeu** : les attaques affichent des étiquettes (« Deux mains », « Lancer 6/18 m », « Arts
  martiaux ») et les avertissements correspondants.
- **Niveau utilisé pour le dé d'Arts martiaux** : c'est le niveau du personnage. Le multiclassage
  n'étant pas modélisé, un moine multiclassé aurait un dé faux.
- **Toujours hors périmètre** : allonge, chargement, munitions, légère et combat à deux armes,
  styles de combat, attaques de sorts, Ki et déluge de coups.
