# 0072 — Personnages de démonstration

**Statut** : Acceptée

## Contexte

L'application stocke tout dans le `localStorage`. Un premier visiteur arrive donc sur une liste
vide et doit créer un personnage complet avant de voir quoi que ce soit : HUD de combat, valeurs
calculées, sorts, journal. C'est un frein pour un joueur curieux comme pour un recruteur qui ouvre
le lien depuis le portfolio.

Il existe une sauvegarde réelle de la table : quatre personnages de niveau 3 (clerc du Crépuscule,
barbare totem de l'ours, moine de la Main ouverte, druide du Cercle des spores) et 162 sorts. Mais
les descriptions de ses sorts reprennent le texte officiel du Manuel des joueurs, que l'ADR 0004
interdit de redistribuer, et les notes contiennent les prénoms des joueurs.

## Décision

- **Un fichier statique** `public/demo/demo-backup.json`, au format sauvegarde (ADR 0008), dérivé
  une fois de la sauvegarde réelle :
  - chaque description de sort est remplacée par un résumé original d'une ou deux phrases ; les
    données mécaniques (niveau, école, portée, durée, composantes, concentration, rituel, classes)
    sont conservées ;
  - les lignes « Joueur : » et « Joueuse : » sont retirées des notes ;
  - tous les identifiants de personnages et de sorts sont préfixés par `demo-`, et toutes les
    références (sorts connus et préparés, étiquettes de sorts, effets de CA liés à une
    concentration) sont réécrites en conséquence.
- **Même pipeline que l'import manuel** (`src/features/character-list/demo-data.ts`) :
  `parseCharacterImportEntries`/`previewCharacterImport` et leurs équivalents pour les sorts, puis
  `upsertMany`. La démo suit donc les migrations de schéma sans traitement particulier.
- **Deux points d'entrée** : un bouton « Charger les personnages de démo » dans la liste vide, et
  le paramètre `/?demo=1`. Ce dernier n'agit qu'après le premier chargement, et seulement si aucun
  personnage n'existe. Il est retiré de l'URL dans tous les cas.

## Conséquences

- Le préfixe `demo-` garantit que la démo ne remplace jamais un personnage ou un texte de sort du
  joueur, même s'il possède les mêmes personnages réels. Les personnages de démo se suppriment
  comme les autres.
- Des tests vérifient que le fichier s'importe sans ligne invalide, que tous ses identifiants sont
  préfixés et qu'aucune référence ne pointe vers un sort absent. Une évolution de schéma qui casse
  la démo fait donc échouer la CI.
- Le fichier est figé : ajouter une capacité aux personnages de démo demande de le régénérer ou de
  l'éditer à la main, en respectant les règles ci-dessus (rappelées dans `public/demo/README.md`).
