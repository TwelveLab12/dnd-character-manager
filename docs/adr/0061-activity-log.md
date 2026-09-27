# 0061 — Historique des actions du mode jeu

**Statut** : Acceptée

## Contexte

Les joueurs veulent retrouver ce qui s'est passé pendant une partie : PV perdus ce tour-ci, sort
lancé, Canalisation divine déjà utilisée… Seules cinq actions du mode jeu affichaient un toast, et
un toast disparaît. Contraintes : ne rien oublier, ne pas noyer l'historique sous les petites
actions (boutons ±1 PV, champs enregistrés à chaque frappe), et ne pas saturer le localStorage
(environ 5 Mo, partagé avec les fiches et les sorts).

## Décision

- **Capture centralisée** : toutes les actions du mode jeu passent par `withCurrent`
  (`use-play-actions.ts`). On y compare la fiche avant et après l'action (`describeChanges`,
  src/domain/calculations/activity-changes.ts) : PV, PV temporaires, dés de vie, état et jets
  contre la mort, concentration, rage, effets de CA, emplacements, sorts préparés, ressources de
  classe, capacités, quantités, emplacement des objets, bourse. Une action future est donc journalisée
  sans code supplémentaire. Les réglages de la configuration ne sont pas suivis.
- **Contexte** : une action peut ajouter un titre et des détails (`ActivityIntent`) : sort lancé,
  repos avec les dés lancés, jet contre la mort et son issue, stabilisation, rage, annulation d'un
  lancement. Une action avec contexte est toujours inscrite, même sans changement (tour de magie).
- **Figé** : libellés et valeurs sont écrits au moment de l'action. Changer les règles ou renommer un
  objet ne réécrit pas le passé.
- **Regroupement** : une entrée sans contexte fusionne avec la précédente si elle porte sur les
  mêmes valeurs à moins de 60 s d'écart (« −3 PV » au lieu de trois lignes). Une fusion revenue au
  point de départ disparaît.
- **Stockage** : `ActivityLogRepository` (docs/adr/0002), une clé localStorage par personnage
  (`activity:<id>`) et une clé de réglages (`activity-settings`). Les fiches ne sont pas alourdies, et
  l'historique n'est lu qu'au besoin. Supprimer un personnage supprime son historique (`onRemove` du
  store des personnages). L'historique reste hors des exports et des sauvegardes.
- **Purge** :
  - conservation réglable (7, 30 ou 90 jours, ou illimitée ; 30 par défaut), appliquée à chaque
    écriture, au chargement et au changement de réglage ;
  - plafond de 1 000 entrées par personnage (quelques centaines de Ko au pire) ;
  - « Vider » manuel avec confirmation ;
  - si le stockage est plein, seule la moitié la plus récente est gardée. Une écriture qui échoue
    ne bloque jamais l'action de jeu.
- **Écritures en file** (store Zustand) : des clics rapprochés s'enregistrent dans l'ordre, chacun sur
  l'historique à jour.
- **Interface** :
  - un bouton horloge dans l'en-tête du mode jeu, présent sur tous les onglets ;
  - il ouvre un panneau à droite à partir de 640 px, par le bas en dessous, qui se ferme en glissant
    ([0044](0044-swipe-to-close-detail-sheet.md)) ;
  - entrées groupées par jour, filtres par catégorie, avant → après avec l'écart chiffré ;
  - durée de conservation, taille occupée et « Vider » en pied de panneau.

## Conséquences

Annuler une action depuis l'historique reste possible plus tard : les entrées gardent les valeurs
avant et après. L'historique est propre à l'appareil, comme les autres données en v1.
