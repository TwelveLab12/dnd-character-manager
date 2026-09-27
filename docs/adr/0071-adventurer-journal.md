# 0071 — Journal de l'aventurier

**Statut** : Acceptée

## Contexte

Les joueurs veulent noter en partie ce que le MJ leur révèle : noms, lieux, indices, rendez-vous.
Le champ `notes` de la fiche, un texte libre modifié en configuration, ne s'y prête pas. Il n'est
pas daté et n'est pas accessible en jeu.

Contraintes du joueur :

- rester simple et minimaliste ;
- séparer les notes par session de jeu ;
- dater une session du jour par défaut, avec une date modifiable après coup pour recopier des notes
  prises sur papier ;
- rien côté configuration, le mode jeu suffit.

La maquette validée a comparé un onglet dédié et un bouton d'en-tête. Le joueur a choisi le bouton,
jugé plus ergonomique : il ouvre le journal par-dessus l'onglet courant, sans quitter le Combat.

## Décision

- **Stockage** : `Character.journal`, un tableau de sessions `{ id, date, title?, notes, createdAt }`,
  optionnel et sans migration. Il voyage avec la fiche (export/import JSON, sauvegarde). La `date`
  est le jour local de la partie, `AAAA-MM-JJ`, pour éviter tout décalage de fuseau. Une note vaut
  `{ id, text, createdAt }`.
- **Calculs purs** dans `src/domain/journal.ts` : tri, numérotation, session du jour, ajout,
  modification et suppression.
- **Accès** : un bouton livre dans l'en-tête du mode jeu, avant l'historique
  ([0061](0061-activity-log.md)). Il ouvre le même type de panneau que l'historique : à droite sur
  un grand écran, par le bas sur téléphone. Un point doré signale une session du jour en cours.
- **Session du jour** : pas de bouton « démarrer ». La première note du jour crée la session datée
  du jour ; les notes suivantes s'y ajoutent.
- **Ordre** : du plus récent au plus ancien, à la demande du joueur, pour les sessions (par date de
  partie) comme pour les notes (par date de saisie). La zone de saisie est en haut de chaque
  session.
- **Numérotation** : par date de partie. Une session recopiée après coup se range à sa place et
  décale la numérotation des suivantes. Le numéro est calculé, jamais stocké.
- **Sessions passées** : repliées (date, titre, première note), dépliables pour ajouter, modifier
  ou supprimer des notes. « + Session » crée une session à une date libre, avec un titre
  facultatif. Le crayon d'une session modifie sa date et son titre, ou la supprime avec ses notes
  après confirmation.
- **Hors historique** : les modifications du journal ne sont pas inscrites dans l'historique des
  actions. Ce ne sont pas des actions de jeu.

## Conséquences

- Une note est une ligne courte, sans heure ni catégorie. Des étiquettes (PNJ, lieu, indice) ou une
  recherche pourront venir plus tard, sans changer le stockage des sessions.
- Le journal grossit la fiche en localStorage. Quelques centaines de notes restent négligeables
  face au quota.
- `useWideScreen` passe dans `src/features/shared/`, partagé par l'historique et le journal.
