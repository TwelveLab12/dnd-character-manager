# 0050 — Bonus de vitesse saisi, en plus de la vitesse de la race

**Statut** : Acceptée

## Contexte

La vitesse est calculée ([0026](0026-computed-saves-speed-initiative.md)) : celle de la race
connue, sinon une vitesse de base saisie pour une race hors registre. Mordaï, moine tieffelin,
avait une vitesse de base saisie de 12 m (9 m de tieffelin + 3 m de Déplacement sans armure). Avec
l'ajout du Tieffelin au registre, la vitesse de la race (9 m) remplace la valeur saisie : les 3 m du
moine étaient perdus. Le Moine n'est pas dans le registre des classes.

## Décision

Ajoute un champ optionnel `speedExtraBonus` (en mètres), sur le modèle de `initiativeExtraBonus` :
il s'ajoute à la vitesse de la race (ou de base), avant la pénalité d'armure lourde, et apparaît
comme « Bonus » dans le détail du calcul. Il se saisit dans la configuration, onglet Général, à
côté du bonus d'initiative hors Dextérité.

Comme la Défense sans armure, il est saisi à la main : il ne se retire pas tout seul quand le
personnage porte une armure.

## Conséquences

Toute source de vitesse non modélisée (Déplacement sans armure, Mobile, Déplacement rapide du
Barbare…) se reporte dans ce bonus, quelle que soit la race. Si le Moine entre un jour dans le
registre, son Déplacement sans armure pourra être calculé et ce bonus réservé aux autres sources.
