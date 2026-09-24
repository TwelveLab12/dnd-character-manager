# 0037 — Refonte de l'onglet Caractéristiques de la configuration

**Statut** : Acceptée

## Contexte

L'onglet Caractéristiques de la configuration alignait six lignes « score + modificateur +
interrupteur Sauv. » puis une liste plate de 18 interrupteurs de compétences. Les jets de
sauvegarde accordés par la classe y étaient verrouillés (interrupteur désactivé), alors que
l'utilisateur veut que tout ce que les règles accordent reste modifiable par personnage, comme les
maîtrises d'armure et d'armes ([0035](0035-general-tab-configuration-redesign.md)). La refonte
suit une maquette Design validée par l'utilisateur.

## Décision

- **Une carte par caractéristique**, en grille (3 colonnes, 2 sur mobile) :
  - le score de base se règle avec des boutons − / + (bornés à 1–30) ou se tape ;
  - le **modificateur** est le grand chiffre : c'est la valeur de base de tous les usages
    (tests, compétences, sorts), le jet de sauvegarde n'en est qu'un ;
  - une ligne dorée « +1 race → 17 » n'apparaît que s'il y a un bonus de race ;
  - en bas, un bloc « Jet de sauvegarde » avec un bouton **Maîtrise** (pastille et total). Le
    bloc est poussé en bas de la carte pour rester aligné d'une carte à l'autre.
- **Jets de sauvegarde de classe retirables** : le nouveau champ optionnel
  `removedSavingThrowProficiencies` stocke les exceptions, les règles restent la valeur par
  défaut. `effectiveSavingThrowProficiencies` en tient compte, en configuration comme en mode jeu.
  Le bascule réutilise `toggleProficiency`.
- **Pas de légende qui répète l'état** : aucune mention sous une maîtrise active ; seule une
  maîtrise de classe retirée affiche « Retirée · Clerc ».
- **Compétences groupées par caractéristique**, en deux colonnes équilibrées, avec la pastille
  de maîtrise et le total en or comme en mode jeu. Toute la ligne est un bouton ; le nombre de
  compétences maîtrisées s'affiche dans l'en-tête.
- Le bonus de maîtrise s'affiche une fois, à côté du titre.
- La pastille de maîtrise (`ProficiencyDot`) est partagée avec le mode jeu.

## Conséquences

- L'expertise (double maîtrise d'une compétence) reste hors du périmètre : elle demandera un
  nouveau champ, dans une décision ultérieure.
- Aucune aide à la répartition des scores (achat de points, tableau standard) pour l'instant.
