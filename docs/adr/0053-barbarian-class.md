# 0053 — Classe Barbare et bonus de vitesse de classe généralisé

**Statut** : Acceptée

## Contexte

Murrik, nain des collines barbare de niveau 3, était saisi avec une classe en texte libre : PV max
saisis, jets de sauvegarde cochés, effet de CA manuel « Défense sans armure (Con) » (+3) et une
capacité « Rage » avec son propre compteur. Le Moine ([0052](0052-monk-class.md)) a introduit la
Défense sans armure et un bonus de vitesse de classe, `unarmoredMovement`, perdu avec une armure
ou un bouclier.

## Décision

Le Barbare rejoint le registre des classes (règles 2014) :

- dé de vie d12, jets de sauvegarde Force et Constitution, armures légères et intermédiaires,
  boucliers, armes courantes et de guerre ;
- **Rage** : ressource de classe (`rage`), 2 au niveau 1, 3 au 3, 4 au 6, 5 au 12, 6 au 17,
  récupérées au repos long. Les rages illimitées du niveau 20 ne sont pas modélisées. Le bonus aux
  dégâts et les résistances de la Rage ne sont pas appliqués aux attaques : l'app ne suit pas
  encore l'état « en rage » ;
- **Défense sans armure** avec la Constitution, bouclier permis (mécanisme de 0052) ;
- sous-classe **Voie du guerrier totémique**, sans effet calculé (l'esprit totem reste décrit).

Le bonus de vitesse de classe est généralisé : `unarmoredMovement` devient `movementBonus`
(`name`, `metersAtLevel`, `lostWith`). Le Déplacement sans armure du Moine est perdu avec une armure
ou un bouclier (`armorOrShield`), le **Déplacement rapide** du Barbare (+3 m dès le niveau 5)
seulement en armure lourde (`heavyArmor`).

Deux ajustements de la bascule depuis le texte libre (`changeClass`) :

- une sous-classe saisie avec une précision entre parenthèses est reconnue (« Voie du guerrier
  totémique (Ours) ») ;
- le libellé saisi de la sous-classe est conservé, pour ne pas perdre cette précision.
- l'encart indique l'écart entre les PV max calculés et ceux saisis (« 44 (38 saisis) ») : un don
  comme Robuste, ignoré tant que les PV étaient saisis à la main, s'applique après la bascule.

## Conséquences

Murrik passe aux règles du Barbare en un clic : CA, PV (Robustesse naine comprise) et jets de
sauvegarde sont calculés, avec une réserve de Rage en mode jeu. Le suivi de l'état « en rage »
(bonus aux dégâts, résistances) reste à décider.
