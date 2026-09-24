# 0017 — Classe d'armure calculée selon les règles 5e 2014

**Statut** : Acceptée

## Contexte

La CA était un nombre saisi à la main (`Character.armorClass`), recopié de la feuille source. Rien
ne la reliait à l'équipement : changer d'armure, prendre un bouclier ou lancer Bouclier de la foi
obligeait à recalculer de tête et à ressaisir la valeur, avec un risque d'oubli en pleine partie.

## Décision

La CA n'est plus stockée : `computeArmorClass` (`src/domain/calculations/armor-class.ts`) la
calcule avec les règles 5e **2014**.

- **Armure :** un objet d'inventaire équipé porte `armor` (catégorie `light` / `medium` /
  `heavy` / `shield` + `baseArmorClass`).
- **Part de Dex :** sans armure, 10 + mod Dex. En armure légère, Dex complète. En armure
  intermédiaire, Dex plafonnée à +2 (+3 avec `mediumArmorMaster`). En armure lourde, pas de Dex.
  Le bouclier ajoute sa valeur.
- **Bonus magiques :** `armorClassBonus` sur tout objet équipé (armure +1, anneau de protection).
- **Effets (`ArmorClassEffect`) :** un effet se déclenche de l'une de deux façons.
  - `concentration` : actif tant que `concentration.spellId` désigne ce sort. Le marqueur de
    concentration du mode jeu permet désormais de choisir le sort concentré.
  - `manual` : activé par un switch en mode jeu, pour les sorts sans concentration comme Bouclier.
- **Avertissements seulement :** en 2014, la maîtrise d'armure (`armorProficiencies`) ne change
  pas la CA. Une armure non maîtrisée ou une Force sous le minimum d'une armure lourde affichent un
  avertissement, sans modifier la CA ni la vitesse.
- **Suppression de `armorClass` :** le champ disparaît du type et du schéma d'import. Un ancien
  JSON qui le contient s'importe toujours, la clé est ignorée.

## Conséquences

- La CA suit automatiquement l'équipement, la Dextérité effective (bonus racial inclus) et les
  sorts actifs. Le détail du calcul est affiché (« Cuirasse 14 + Dex 2 + Bouclier 2 »).
- Les personnages existants perdent leur CA saisie : ils retombent sur 10 + Dex jusqu'à ce que
  l'armure soit renseignée dans l'Inventaire.
- Hors périmètre, à traiter dans un ADR ultérieur si besoin : Défense sans armure (Moine,
  Barbare), Armure du mage et autres formules alternatives sans armure, réduction automatique de la
  vitesse.
