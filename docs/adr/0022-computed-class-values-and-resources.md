# 0022 — Valeurs de classe calculées et ressources de classe

**Statut** : Acceptée

## Contexte

La classe n'était qu'un libellé libre (`Character.class` : « Clerc », « Cleric »…). L'app ne pouvait
donc rien en déduire. Deux conséquences :

- **Emplacements de sorts** : les totaux étaient stockés tels quels (`spellSlots: { level, total,
used }[]`). Ils étaient pré-remplis une seule fois par un bouton « Générer (lanceur complet) »,
  puis figés : une montée de niveau ne les changeait pas.
- **Canalisation divine** : il n'y avait pas de réserve. Chaque option (Renvoi des morts-vivants,
  Sanctuaire du Crépuscule…) avait son propre compteur saisi à la main, alors que les règles les
  font puiser dans une réserve commune dont la taille dépend du niveau.

C'est le même problème que celui déjà résolu pour la CA ([0017](0017-computed-armor-class.md)) et
les attaques ([0018](0018-computed-weapon-attacks.md)).

## Décision

**Règle générale : une valeur qui se déduit de paramètres connus (classe, niveau,
caractéristiques…) est le résultat d'une fonction du domaine, jamais une donnée stockée.** Seul ce
que le joueur consomme en partie est stocké. Une surcharge stockée n'est admise qu'en exception
explicite, sur le modèle de `spellSaveDCOverride`. On n'en ajoute pas par anticipation.

- **Registre des classes** (`src/domain/character-class.ts`), sur le modèle des races
  ([0009](0009-generic-race-ability-bonuses.md)). Chaque classe a :
  - un id et un nom ;
  - des alias reconnus dans le libellé libre ;
  - sa progression d'incantation et sa caractéristique d'incantation ;
  - ses ressources de classe.

  Le registre couvre au départ les lanceurs complets : Barde, Clerc, Druide, Ensorceleur et
  Magicien. Il ne contient que de la mécanique de jeu, aucun texte du SRD.

- **`Character.classId`** désigne la classe connue. Il est indépendant du libellé `class`, comme
  `raceSelection` l'est de `race`, et se choisit dans l'onglet Général de la configuration. Une
  classe hors registre ne bénéficie d'aucun calcul de classe.
- **Fonctions de calcul** :
  - `computeSpellSlots` : totaux issus de la table officielle selon la progression et le niveau,
    avec les emplacements utilisés ;
  - `computeClassResources` : maximum de chaque ressource selon le niveau, avec les utilisations
    dépensées ;
  - `resolveSpellcasting` : caractéristique déduite de la classe, DD et bonus d'attaque calculés, les
    surcharges existantes restant prioritaires.
- **Canalisation divine** (règles 2014) : 1 utilisation au niveau 2, 2 au niveau 6, 3 au niveau 18.
  Elle se récupère au repos court ou long.
- **Seule la consommation est stockée** :
  - `spellSlotsUsed` : emplacements utilisés par niveau de sort ;
  - `classResourcesUsed` : utilisations dépensées par ressource.

  Les valeurs stockées sont bornées au maximum calculé : une baisse de niveau ne produit jamais un
  état incohérent.

- **Capacités liées à une ressource** : une capacité qui porte `CharacterFeature.resourceId` (ex :
  Sanctuaire du Crépuscule) puise dans la réserve commune et n'a plus de compteur propre.
- **Repos** : un repos long restaure aussi tout ce qui se récupère au repos court (capacités et
  ressources). Auparavant, il ne restaurait que les capacités marquées « repos long ».

## Conséquences

- Monter de niveau met automatiquement à jour les emplacements et la Canalisation divine.
- L'onglet Notes liste ces règles appliquées : incantation, emplacements, Canalisation divine.
- Les demi-lanceurs (Paladin, Rôdeur), la magie de pacte (Occultiste) et le multiclassage ne sont
  pas encore modélisés. Un personnage de ces classes n'a plus d'emplacements calculés tant que sa
  classe n'est pas ajoutée au registre.
- Les données existantes sont converties sans perte : voir [0023](0023-stored-format-migrations.md).
