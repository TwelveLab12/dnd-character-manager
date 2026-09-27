# 0066 — Épuisement

**Statut** : Acceptée

## Contexte

L'épuisement n'était pas modélisé. Règles 2014 (Manuel des joueurs, annexe A) : six niveaux aux
effets cumulés.

1. Désavantage aux tests de caractéristique.
2. Vitesse divisée par 2.
3. Désavantage aux jets d'attaque et de sauvegarde.
4. PV max divisés par 2.
5. Vitesse à 0.
6. Mort.

Un repos long retire un niveau, à condition d'avoir mangé et bu.

## Décision

- **Stockage** : `Character.exhaustion` (0 à 6), optionnel et sans migration. Les effets sont
  calculés (`src/domain/calculations/exhaustion.ts`).
- **Effets appliqués** :
  - vitesse : un terme « Épuisement N » dans la décomposition de `computeSpeed` (moitié au niveau 2,
    tout au niveau 5), total jamais négatif ;
  - PV max : `computeMaxHitPoints` divise le total par 2 au niveau 4 et expose `baseTotal`, le
    total hors épuisement. Le passage d'une classe du registre à une classe libre enregistre ce
    total de base ;
  - changer le niveau (`setExhaustion`) ramène les PV actuels au nouveau maximum. Ils ne remontent
    pas quand l'épuisement baisse : il faut se soigner ;
  - mort : `dyingStatus` renvoie « Mort » au niveau 6, quels que soient les PV. Le panneau des jets
    contre la mort l'affiche, sans compteurs, et explique comment annuler une erreur ;
  - attaque guidée ([0062](0062-guided-attack.md)) : désavantage présélectionné dès le niveau 3,
    expliqué avant et après le jet ;
  - tests de caractéristique et sauvegardes : l'application ne les lance pas. L'onglet
    Caractéristiques affiche un rappel du désavantage.
- **Interface** : compteur « Épuisement − N + » sur la ligne des états de l'onglet Combat (avec la
  concentration et les repos), encadré ambre des effets actifs sous les PV (niveaux 1 à 5).
- **Repos long** ([0065](0065-rest-resets.md)) : un niveau de moins si la case « A mangé et bu »
  (cochée par défaut) le reste. La confirmation affiche « Épuisement : N → N−1 ». Les PV sont
  restaurés au maximum du nouveau niveau.
- **Historique** : le niveau est suivi comme les autres états ([0061](0061-activity-log.md)).

## Conséquences

Les sources d'épuisement (Frénésie du Berserker, marche forcée…) et Restauration supérieure restent
à la main du joueur, par le compteur. Les règles 2024 (−2 par niveau aux jets d20, −1,5 m de vitesse
par niveau) ne sont pas retenues.
