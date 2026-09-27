# 0058 — Page « Nouveautés » pour informer les joueurs

**Statut** : Acceptée

## Contexte

Certaines évolutions changent ce que voit un joueur, ou lui demandent une action. Par exemple, avec
la prise d'une arme en main ([0057](0057-weapon-grip.md)), les armes polyvalentes équipées repassent
en main principale. Rien dans l'application ne prévenait les joueurs : l'historique ne vivait que
dans les commits et les tickets GitHub, que les joueurs ne lisent pas.

## Décision

- Une page **« Nouveautés »** (`/changelog`), accessible depuis l'accueil, liste les évolutions
  fonctionnelles, la plus récente en premier. Chaque entrée indique ce qui change et, si besoin,
  ce que le joueur doit faire (« À faire »).
- Les entrées sont écrites en français pour les joueurs, pas pour les développeurs, dans un fichier
  versionné (`src/features/changelog/changelog-entries.ts`). Chaque entrée a un identifiant stable
  et unique. Pas de CHANGELOG.md séparé : une seule source.
- **Pastille** sur le bouton « Nouveautés » tant que l'entrée la plus récente n'a pas été vue sur
  l'appareil. Ouvrir la page la marque vue ; les entrées ajoutées depuis la visite précédente
  portent « Nouveau ». À la première visite, aucune entrée n'est marquée « Nouveau ».
- La dernière entrée vue est une préférence d'affichage propre à l'appareil, pas une donnée de
  personnage. Elle est stockée directement dans localStorage
  (`dnd-character-manager:changelog-seen`), hors repositories
  ([0002](0002-repository-pattern-localstorage-v1.md)) et hors sauvegarde.
- La page est mise en cache pour le hors ligne, comme les autres pages statiques
  ([0045](0045-offline-service-worker.md)).
- **Workflow** : toute PR qui change ce qu'un joueur voit ou peut faire ajoute son entrée dans la
  même PR. Les PR purement techniques (refactor, CI, outillage, ADR) n'en ajoutent pas.
- L'historique repris au lancement de la page résume les évolutions depuis le début du projet.

## Conséquences

Une nouvelle entrée suffit pour que tous les joueurs voient la pastille au déploiement suivant.
Si l'application passe un jour à une API, la dernière entrée vue pourra suivre le compte de
l'utilisateur ; d'ici là, elle reste propre à chaque appareil.
