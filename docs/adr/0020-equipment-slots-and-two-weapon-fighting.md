# 0020 — Emplacements d'équipement et combat à deux armes

**Statut** : Acceptée

## Contexte

« Équipé » était un simple booléen par objet. On pouvait donc porter deux armures, deux armes en
main principale, ou une arme à deux mains avec un bouclier : les calculs de CA
([0017](0017-computed-armor-class.md)) et d'attaques ([0018](0018-computed-weapon-attacks.md),
[0019](0019-weapon-properties-and-martial-arts.md)) se contentaient d'avertir. La main secondaire
n'existait pas, alors qu'en 2014 le combat à deux armes change les dégâts.

## Décision

- **Emplacements.** `equipItem` (`src/domain/equipment.ts`) équipe un objet et déséquipe
  automatiquement ce qui occupe déjà ses emplacements :
  - le corps : une seule armure ;
  - la main principale : une arme ;
  - la main secondaire : une arme ou un bouclier ;
  - une arme à deux mains occupe les deux mains.

  Les objets sans armure ni arme (anneau, cape…) n'occupent rien.

- **Main d'une arme.** Elle est stockée dans `InventoryItem.hand` (`"off"`, absente = principale).
  La main secondaire n'est permise que pour une arme de corps à corps, pas à deux mains, et
  **légère** (`weapon.light`), sauf avec le don **Ambidextre** (`Character.dualWielder`). Une
  demande non permise retombe en main principale.
- **Dégâts en main secondaire (action bonus).** Pas de mod de caractéristique positif, sauf avec
  le style **Combat à deux armes** (`Character.twoWeaponFightingStyle`). Un mod négatif et le
  bonus magique restent comptés. Une arme polyvalente n'affiche ses dégâts à deux mains que si la
  main secondaire est libre.
- **Équipement en mode jeu.** Il se change aussi depuis l'onglet Inventaire du mode jeu, avec le
  même composant et la même fonction qu'en configuration. C'est un premier pas vers un mode jeu
  plus paramétrable, qui fera l'objet d'une réflexion d'ensemble séparée.

## Conséquences

- **Plus de combinaisons invalides.** L'interface ne permet plus d'équiper une combinaison
  invalide. Les avertissements de CA et d'attaques restent pour les données importées ou
  antérieures.
- **Anciennes armes.** Elles n'ont pas la propriété « Légère » : il faut la cocher pour pouvoir
  les mettre en main secondaire.
- **Toujours hors périmètre :** le don Ambidextre donne aussi +1 CA quand on tient une arme dans
  chaque main (non calculé), et les autres styles de combat ne sont pas gérés.
