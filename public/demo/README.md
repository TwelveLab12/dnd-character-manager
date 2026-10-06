# Données de démonstration

`demo-backup.json` est chargé par le bouton « Charger les personnages de démo » de la liste vide, ou
par le lien `/?demo=1`. Voir [docs/adr/0072](../../docs/adr/0072-demo-data.md).

Règles à respecter pour toute modification :

- **Aucun texte officiel** : les descriptions de sorts et de capacités sont des résumés originaux
  (ADR 0004).
- **Aucune donnée personnelle** : pas de prénom de joueur ou de joueuse dans les notes.
- **Identifiants préfixés `demo-`** pour les personnages et les sorts, références comprises, afin de
  ne jamais écraser les données d'un joueur. Les tests de `src/features/character-list/demo-data.test.ts`
  le vérifient.
