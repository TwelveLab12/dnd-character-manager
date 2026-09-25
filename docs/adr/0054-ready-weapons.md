# 0054 — Armes prêtes à dégainer, en plus des armes en main

**Statut** : Acceptée

## Contexte

Équiper une arme voulait dire « en main » : une arme par main, une arme à deux mains occupe les deux
([0020](0020-equipment-slots-and-two-weapon-fighting.md)). L'onglet Combat ne listait que ces armes.
Murrik, barbare avec une épée à deux mains, porte aussi deux hachettes de jet : elles n'apparaissaient
nulle part en combat. L'utilisateur voulait pouvoir « équiper » les deux.

En règles 2014, lancer la hachette en action bonus après une attaque à l'épée n'est pas permis
(le combat à deux armes exige deux armes légères de corps à corps en main). En revanche, lâcher une
main de l'épée est gratuit et dégainer une arme est une interaction gratuite (une par tour) : une
hachette à la ceinture est donc bien utilisable d'un tour à l'autre. Le vrai manque était un état
« prête » distinct de « en main ». Trois options ont été comparées (plusieurs armes équipées avec
avertissement, état « prête », état « prête » plus règle de table d'attaque en action bonus) ;
l'utilisateur a retenu l'état « prête », sur maquette (sélecteur segmenté, variante A).

## Décision

- Une arme a un **emplacement** : **Sac** (rangée), **Prête** (à la ceinture, à dégainer) ou **En
  main** (principale ou secondaire ; « Deux mains » pour une arme à deux mains). Les mains restent
  exclusives (`equipItem`) : mettre une arme en main fait passer ce qu'elle déloge en « Prête ». Les
  armes prêtes sont en nombre libre.
- Stockage : un seul champ optionnel, `InventoryItem.stowed` (rangée dans le sac). Une arme non
  équipée et non rangée est prête : les armes jusque-là « non équipées » deviennent prêtes sans
  migration, comme l'utilisateur l'a souhaité. Équiper une arme efface `stowed`.
- **Onglet Combat** : quand des armes prêtes existent, les attaques se groupent en « En main » et
  « Prêtes · à dégainer » (« 1 gratuite par tour »). Les armes prêtes ont une bordure pointillée et
  une teinte neutre ; leurs chiffres sont calculés comme en main principale. Sans arme prête,
  l'affichage ne change pas.
- **Onglet Inventaire du mode jeu** : un sélecteur segmenté Sac · Prête · En main par arme, avec le
  choix de la main pour une arme qui peut aller en main secondaire, et une ligne qui explique l'état.
  Armures et boucliers gardent leur interrupteur.
- Aucune attaque en action bonus n'est ajoutée : elle reste réservée au combat à deux armes.

## Conséquences

La configuration (onglet Inventaire) garde pour l'instant son menu « Non équipée / Main
principale / Main secondaire », où « Non équipée » équivaut à « Prête » ; elle adoptera le même
sélecteur dans un second temps. Une règle de table (ex : lancer en action bonus) pourra s'ajouter
par arme sans changer ce modèle.
