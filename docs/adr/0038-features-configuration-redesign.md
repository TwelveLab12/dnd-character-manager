# 0038 — Refonte de l'onglet Capacités de la configuration

**Statut** : Acceptée

## Contexte

L'onglet Capacités de la configuration affichait chaque capacité sous forme de formulaire complet
(nom, source, description, ressource consommée, utilisations max, utilisations restantes,
récupération), toujours déplié et dans l'ordre d'ajout. La réserve de Canalisation divine et ses
options accordées par les règles n'y apparaissaient pas, alors qu'elles s'affichent en mode jeu.
La refonte suit une maquette Design validée par l'utilisateur et reprend le modèle de l'Inventaire
([0036](0036-inventory-configuration-redesign.md)).

## Décision

- **Une carte par réserve de classe** (ex : Canalisation divine) en tête d'onglet : maximum
  calculé, prochain palier (« 2 au niveau 6 »), récupération, et les options qui la dépensent.
  - Les options accordées par les règles (Renvoi des morts-vivants, Sanctuaire du Crépuscule) se
    retirent et se rétablissent par personnage : le nouveau champ optionnel
    `removedClassResourceOptions` stocke leurs ids. `computeClassResourceOptions` en tient compte
    (mode jeu, onglet Notes) ; `ruleClassResourceOptions` garde la liste complète pour la
    configuration. C'est la même règle que pour les maîtrises et les jets de sauvegarde : ce que
    les règles accordent reste modifiable.
  - Les capacités de la fiche liées à la réserve y sont listées aussi.
- **Capacités groupées par source**, par ordre alphabétique, « Sans source » en dernier, et
  triées par nom dans chaque groupe (`compareNames`, partagé avec l'Inventaire).
- **Une ligne résumée par capacité** (nom, début de description, badge du compteur ou de la
  réserve), un seul panneau déplié à la fois, avec :
  - nom et source, avec des suggestions en un clic (classe, sous-classe, race, « Don ») ;
  - description ;
  - un sélecteur d'utilisations : sans compteur, compteur propre (maximum en − / +,
    récupération), ou une réserve de classe.
- **« Utilisations restantes » quitte la configuration** : c'est un état de partie, géré en mode
  jeu, comme les PV actuels ([0035](0035-general-tab-configuration-redesign.md)). Changer le
  maximum garde une réserve pleine pleine et borne sinon les utilisations restantes.
- **Pendant l'édition, la capacité dépliée garde sa place** : son nom et sa source à l'ouverture
  servent au tri et au groupe jusqu'à ce qu'on la replie. Sans cela, elle changeait de place ou
  de groupe à chaque frappe et perdait le focus. Le même correctif s'applique à l'Inventaire.

## Conséquences

- Un champ optionnel de plus dans le modèle, rétrocompatible.
- L'ordre et le groupe affichés ne se mettent à jour qu'au repli de la capacité ou de l'objet
  modifié.
