# 0070 — Forme sauvage

**Statut** : Acceptée

## Contexte

La Forme sauvage n'était qu'un compteur de deux utilisations. Un joueur (druide) a signalé que se
transformer ne changeait rien à la fiche. Règles 2014 (Manuel des joueurs) :

- **Transformation** : une action, dans une bête déjà vue. Au niveau 2, FP 1/4 au plus, sans
  vitesse de vol ni de nage ; au niveau 4, FP 1/2 sans vol ; au niveau 8, FP 1.
- **Durée** : la moitié du niveau de druide, en heures. Le retour se fait en action bonus, à 0 PV
  de bête, ou à la mort ou l'inconscience.
- **Ce que la bête remplace** : Force, Dextérité, Constitution, CA, PV, vitesses et attaques.
- **Ce que le druide garde** : Intelligence, Sagesse, Charisme, et ses maîtrises de compétences et
  de sauvegardes. Si la bête a la même maîtrise avec un meilleur bonus, on prend le sien.
- **PV** : ceux de la bête. À 0, le druide reprend sa forme, avec les PV qu'il avait, et le surplus
  de dégâts s'y applique.
- **Sorts** : impossible d'en lancer, mais la concentration en cours continue.

Aucun profil de bête n'est fourni, pour les droits (comme les sorts,
[0004](0004-json-import-export-open5e-schema.md)).

## Décision

- **Formes enregistrées** : `Character.wildShapeForms`, saisies par le joueur depuis le profil :
  nom, FP, For/Dex/Con, CA, PV max, vitesses (marche, nage, vol, escalade), attaques et notes.
  - Une attaque porte un bonus au toucher, des dés, un modificateur de dégâts, un type et un effet.
  - Éditeur dans l'onglet Capacités de la configuration, sous la réserve de Forme sauvage.
  - Import JSON (bouton « Importer » de la section) : un tableau de formes ou
    `{ wildShapeForms: [...] }`, validé ligne par ligne comme les autres imports. Les identifiants
    absents sont dérivés du nom, pour qu'un réimport mette à jour au lieu de dupliquer. Aucun
    fichier de bêtes n'est livré dans le dépôt : il est préparé à part pour le joueur.
  - Les limites du niveau (FP, vol, nage) sont des **avertissements**, jamais un blocage : le MJ
    peut en décider autrement.
- **Forme active** : `Character.wildShape = { formId, hitPoints }`, les PV de la bête. Les PV du
  druide ne bougent pas.
- **Effets calculés** (`wild-shape-form.ts`, sans dépendance vers les autres calculs de combat) :
  - `playAbilityScores` : For/Dex/Con de la bête, pour l'initiative et l'onglet
    Caractéristiques. Les jets et compétences y gardent les maîtrises du druide ; le meilleur bonus
    de la bête est rappelé, pas calculé ;
  - CA : celle de la bête, plus les effets actifs (sorts). L'équipement se fond dans la forme ;
  - vitesse : celle de la bête, épuisement compris ([0066](0066-exhaustion.md)) ;
  - attaques : `computeWeaponAttacks` renvoie celles de la bête (identifiant `beast:<id>`).
    L'attaque guidée ([0062](0062-guided-attack.md)) les utilise telles quelles, avec leur bonus
    du profil. Les armes prêtes disparaissent.
- **PV en jeu** (`wild-shape.ts`) :
  - l'anneau, les boutons ±1 et le résumé affichent les PV de la bête (« PV · Loup ») ;
  - dégâts : PV temporaires du druide d'abord, puis PV de la bête. À 0, retour à la forme normale
    et surplus sur le druide, jets contre la mort compris ;
  - soins : vers la bête, plafonnés à son maximum.
- **Choix de la forme** : une liste complète sur la carte devenait illisible dès une vingtaine de
  bêtes. La carte ne montre que les formes **favorites** (`BeastForm.favorite`, au plus 3), en
  pastilles « Devenir » en un geste. Le bouton « Toutes les formes (N) » ouvre le panneau de détail
  du mode jeu : recherche par nom, filtre par FP, et une carte par bête (CA, PV, vitesses, attaques
  avec bonus et dégâts, traits, avertissements). Une étoile y met la forme en accès rapide ; le même
  réglage existe dans la configuration.
- **Transformation** : bouton « Devenir » d'une forme. Elle dépense une
  utilisation, met fin à l'Entité symbiotique ([0069](0069-circle-of-spores.md)) et à Gourdin
  magique ([0068](0068-shillelagh.md)), l'arme se fondant dans la forme.
- **Retour** : « Reprendre ma forme ». Automatique :
  - au repos long ;
  - au repos court quand la forme ne dure qu'une heure (niveaux 2-3).
- **Sorts** : le bouton « Lancer » affiche « En Forme sauvage », désactivé.
- **Historique** : forme prise ou quittée, et PV de la bête.

## Conséquences

- Le Cercle de la lune (FP plus élevés, Forme sauvage en action bonus) n'est pas dans le registre :
  ses limites seraient une variante de `wildShapeLimits`.
- Les compétences et sauvegardes propres à la bête ne sont pas saisies : elles restent dans les
  notes de la forme.
