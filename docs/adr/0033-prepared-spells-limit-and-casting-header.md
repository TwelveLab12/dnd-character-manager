# 0033 — Limite de sorts préparés et en-tête d'incantation

**Statut** : Acceptée

## Contexte

[0032](0032-known-spells-picker-and-exclusive-preparation.md) a unifié la liste des sorts connus,
mais rien ne bornait le nombre de sorts préparés. En 5e 2014 (Basic Rules), un Clerc ou un Druide
prépare « mod. de Sagesse + niveau (minimum 1) » sorts, et un Magicien « mod. d'Intelligence +
niveau (minimum 1) ». Les sorts de domaine ou de cercle sont toujours préparés et ne comptent
pas, pas plus que les tours de magie. Le Barde et l'Ensorceleur ne préparent pas : ils utilisent
tous leurs sorts connus.

Le haut de l'onglet (incantation, emplacements) reposait sur des champs de saisie bruts : deux
champs d'override pour le DD et l'attaque, et un champ numérique « utilisés » par niveau
d'emplacement.

## Décision

- **Mode de préparation par classe** : `CharacterClassDefinition.spellcasting.preparation` vaut
  `"prepared"` (Clerc, Druide, Magicien) ou `"known"` (Barde, Ensorceleur). Une classe hors
  registre est traitée comme `"prepared"`, sans limite calculée.
- **Limite calculée** dans `resolveSpellcasting` (`preparedSpellsMax`) : mod. de caractéristique +
  niveau, minimum 1. Elle peut être forcée par `SpellcastingInfo.preparedSpellsMaxOverride`
  (don, règle maison). `countPreparedSpells` ne compte que les sorts connus de niveau 1+ marqués
  « préparé ».
- **Limite atteinte** : les switches « Préparé » des autres sorts sont désactivés. Si les données
  dépassent déjà la limite (niveau baissé, override réduit), la jauge passe en rouge, mais rien
  n'est retiré automatiquement.
- **Lanceur sans préparation** : les colonnes Préparé / Toujours préparé disparaissent, et
  `playAvailableSpellIds` rend disponibles tous ses sorts connus. La limite de « sorts connus »
  par niveau (table du Barde et de l'Ensorceleur) est reportée.
- **En-tête** : quatre tuiles (caractéristique, DD, attaque de sort, sorts préparés), chacune avec
  sa formule en légende. Les overrides s'éditent dans un popover (crayon). Une valeur forcée
  s'affiche en bleu avec la valeur calculée à côté.
- **Emplacements** : un jeton par emplacement. Toucher un jeton plein le dépense, toucher un jeton
  dépensé le rend.

## Conséquences

- Aucune migration : le nouveau champ d'override est optionnel.
- L'exclusivité de 0032 reste inchangée : passer un sort de « toujours préparé » à « préparé » est
  bloqué, lui aussi, quand la limite est atteinte.
- Les lanceurs de demi-progression (Paladin : Cha + moitié du niveau) devront préciser leur
  formule quand ils seront ajoutés au registre.
