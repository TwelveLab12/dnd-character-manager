# 0005 — Scope v1 : pas d'authentification, pas de backend

**Statut** : Acceptée

## Contexte

L'application sert un seul utilisateur (Bruno) dans un premier temps, avec ses données stockées
localement dans son navigateur. Ajouter une authentification et un backend dès la v1 augmenterait
significativement la surface du projet sans bénéfice immédiat.

## Décision

V1 : aucune authentification, aucune route API, aucune base de données. Toute la donnée dynamique
vit dans `localStorage` derrière les repositories ([0002](0002-repository-pattern-localstorage-v1.md)).
Le rendu reste toutefois en mode Next.js standard (pas `output: "export"`) : partir en export
statique maintenant serait un choix à défaire dès qu'une implémentation API/DB ajoutera des routes
serveur, alors que rester en mode standard ne coûte rien tant qu'aucune route serveur n'existe.

## Conséquences

Périmètre v1 volontairement réduit et rapide à livrer. Une future v2 multi-utilisateurs/BDD
nécessitera d'ajouter l'authentification et une implémentation `Api*Repository`
([0002](0002-repository-pattern-localstorage-v1.md)) — un nouvel ADR documentera ce changement le
moment venu plutôt que de modifier celui-ci.
