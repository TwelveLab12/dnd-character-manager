# 0065 — Repos : concentration, PV temporaires et effets de CA

**Statut** : Acceptée

## Contexte

Les repos restauraient PV, dés de vie, emplacements, capacités et ressources de classe, et
mettaient fin à la rage. Plusieurs états survivaient pourtant à tort (règles 2014) :

- la concentration, alors qu'un repos long comprend au moins 6 h de sommeil (être inconscient y met
  fin) et qu'un repos court dure 1 h, plus que la plupart des sorts de concentration ;
- les PV temporaires, qui durent jusqu'à épuisement ou jusqu'à la fin d'un repos long ;
- les effets de CA activés à la main (Armure du mage : 8 h…), qui ne survivent pas à la nuit.

## Décision

- **Repos long** :
  - fin de la concentration ;
  - PV temporaires à 0 ;
  - effets de CA manuels désactivés. Les effets liés à un sort de concentration suivent déjà la
    concentration ;
  - la confirmation liste ce qui prend fin (concentration et sort, PV temporaires, effets) avant de
    valider.
- **Repos court** :
  - fin de la concentration par défaut ;
  - une case **« Garder la concentration »**, décochée par défaut et visible seulement si le
    personnage est concentré, couvre les sorts plus longs qu'une heure (Maléfice ou Marque du
    chasseur lancés à haut niveau…) ;
  - PV temporaires et effets de CA sont conservés.
- Ces changements apparaissent dans l'historique comme les autres effets des repos
  ([0061](0061-activity-log.md)).

## Conséquences

Un effet de CA manuel qui durerait vraiment au-delà d'une nuit se réactive à la main. L'entrée
« Nouveautés » le rappelle. Restent à modéliser : l'épuisement (−1 niveau au repos long), la
Récupération arcanique et la Récupération naturelle (emplacements au repos court).
