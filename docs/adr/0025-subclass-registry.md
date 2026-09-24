# 0025 — Registre des sous-classes (domaines divins)

**Statut** : Acceptée

## Contexte

Le registre des classes ([0022](0022-computed-class-values-and-resources.md)) calcule les
emplacements de sorts et la réserve de Canalisation divine. Mais ce que la sous-classe accorde
d'office restait saisi à la main dans la fiche, et donc facile à oublier ou à mal saisir :

- **Sorts de domaine toujours préparés** : ils étaient saisis comme tags. Voir l'invisibilité
  manquait sur la fiche de référence.
- **Options de Canalisation divine** : Renvoi des morts-vivants et Sanctuaire du Crépuscule
  manquaient, le HUD ne les proposait donc pas.
- **Maîtrises** : l'armure lourde et les armes de guerre du Crépuscule étaient à cocher à la main.

Tout cela se déduit pourtant de la classe, de la sous-classe et du niveau.

## Décision

- **Registre des sous-classes** (`src/domain/subclass.ts`), rattachées à leur classe
  (`CharacterClassDefinition.subclasses`). On y trouve uniquement des noms, des niveaux et des
  maîtrises, sans texte de règle. Le registre démarre avec le **Domaine du Crépuscule** (Chaudron de
  Tasha) :
  - les sorts toujours préparés aux niveaux 1, 3, 5, 7 et 9 ;
  - la maîtrise de l'armure lourde et des armes de guerre ;
  - l'option Sanctuaire du Crépuscule au niveau 2.

  Ajouter un domaine consiste à ajouter une entrée.

- **`Character.subclassId`** désigne la sous-classe connue au sein de `classId`. Il est
  indépendant du libellé libre `subclass`, se choisit dans la configuration et se déduit du libellé
  à la normalisation (« Domaine du Crépuscule », « Twilight »…).
- **La classe accorde aussi** ses maîtrises (Clerc : armures légères et intermédiaires, boucliers,
  armes courantes) et ses options de ressources (Renvoi des morts-vivants au niveau 2).
- **Sorts identifiés par leur nom** : les sorts ne sont pas fournis par l'app
  ([0004](0004-json-import-export-open5e-schema.md)) et leurs ids sont choisis à l'import. Un sort de
  la bibliothèque correspond à une référence du registre si son nom contient l'un de ses alias
  (français ou anglais), sans tenir compte des accents ni de la casse. Un sort absent de la
  bibliothèque est signalé dans l'onglet Notes.
- **Fonctions de calcul** (`src/domain/calculations/class-features.ts`) :
  - `computeAlwaysPreparedSpells` : sorts toujours préparés au niveau actuel ;
  - `effectiveArmorProficiencies` et `effectiveWeaponProficiencies` : maîtrises cochées sur la
    fiche, plus celles de la classe et de la sous-classe. Elles alimentent les avertissements de CA
    et les jets d'attaque ;
  - `computeClassResourceOptions` : options accordées au niveau actuel.
- **Les saisies manuelles restent possibles** : les tags de sorts et les capacités liées à une
  ressource s'ajoutent aux valeurs calculées. Une capacité liée qui porte le même nom qu'une option
  des règles n'est pas proposée deux fois.

- **Format stocké des personnages en version 3** ([0023](0023-stored-format-migrations.md)) : les
  personnages déjà enregistrés en version 2 reçoivent leur `subclassId` à la première lecture. La
  normalisation étant idempotente, elle ne touche à rien d'autre sur une fiche au format courant.

## Conséquences

- Pour un Clerc du Crépuscule, le HUD propose d'office Renvoi des morts-vivants et Sanctuaire du
  Crépuscule, et les sorts de domaine sont disponibles sans aucune saisie. Monter de niveau ajoute
  les suivants.
- En configuration, les maîtrises accordées par les règles apparaissent cochées et verrouillées,
  avec leur source.
- La reconnaissance par nom dépend des noms de la bibliothèque : un sort renommé sans nom français
  ni anglais reconnaissable n'est pas retrouvé, ce que l'onglet Notes signale.
- Seul le Domaine du Crépuscule est enregistré pour l'instant.
