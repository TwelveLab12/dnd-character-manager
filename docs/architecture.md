# Architecture — synthèse

Le dossier [`docs/adr/`](adr) est le **journal** des décisions : une par fichier, jamais réécrite
([0001](adr/0001-record-architecture-decisions.md)). Ce document est la **vue à jour** : les règles qui s'appliquent aujourd'hui, ce qui a
changé en route, et un index de tous les ADR par thème.

- Pour travailler sur le code, lire les règles ci-dessous. Elles tiennent en quelques minutes.
- Pour comprendre _pourquoi_ une règle existe, suivre le lien vers son ADR.
- Un test (`src/docs/architecture-doc.test.ts`) échoue si un ADR manque dans l'index ou si un lien
  est cassé. Un nouvel ADR se range donc ici dans la même PR.

## Règles actives

### Données et stockage

1. **Composants et stores ne touchent jamais `localStorage`.** Tout passe par un repository
   asynchrone, instancié à un seul endroit (`repository-provider.tsx`). Seules les préférences
   propres à l'appareil, comme la dernière entrée « Nouveautés » vue, y échappent. [0002](adr/0002-repository-pattern-localstorage-v1.md) [0058](adr/0058-changelog-page.md)
2. **Un store Zustand par ressource, construit par une factory qui reçoit son repository.** Il se
   teste avec un repository en mémoire, sans React. [0003](adr/0003-zustand-stores-over-repositories.md)
3. **Tout format stocké est versionné, et une évolution migre les données au lieu de les
   perdre.** Une seule normalisation, idempotente, sert au stockage comme à l'import. Un champ
   optionnel dont la valeur par défaut se calcule à la lecture évite une migration. [0023](adr/0023-stored-format-migrations.md) [0029](adr/0029-character-purse-and-play-mode-inventory.md)
4. **Un import valide chaque ligne avec Zod et montre un aperçu avant d'écrire.** Une sauvegarde
   complète, qui est notre propre export, se valide d'un bloc. [0004](adr/0004-json-import-export-open5e-schema.md) [0008](adr/0008-generalized-import-export-and-backup.md)
5. **Pas de compte ni de serveur de données en v1.** Le rendu reste en mode Next.js standard, pour
   ne pas avoir à défaire un export statique le jour où une API arrive. [0005](adr/0005-no-auth-no-backend-v1-scope.md)

### Moteur de règles

6. **Une valeur qui se déduit de paramètres connus est calculée par une fonction pure du domaine,
   jamais stockée.** Seul ce que le joueur consomme en partie est stocké. Une surcharge stockée est
   une exception explicite, jamais ajoutée par anticipation. [0022](adr/0022-computed-class-values-and-resources.md) Appliquée à la classe
   d'armure [0017](adr/0017-computed-armor-class.md), aux attaques [0018](adr/0018-computed-weapon-attacks.md), aux sauvegardes, à la vitesse et à l'initiative [0026](adr/0026-computed-saves-speed-initiative.md),
   aux PV max [0027](adr/0027-computed-max-hit-points.md).
7. **Races, classes, sous-classes et dons sont des registres déclaratifs.** Ajouter une option,
   c'est ajouter une entrée. Un registre ne contient que de la mécanique, des noms et des alias,
   jamais de texte de règle. [0009](adr/0009-generic-race-ability-bonuses.md) [0022](adr/0022-computed-class-values-and-resources.md) [0025](adr/0025-subclass-registry.md) [0028](adr/0028-feat-registry.md)
8. **Les calculs suivent les règles de la 5e édition de 2014.** [0017](adr/0017-computed-armor-class.md)
9. **Un repos est une fonction pure unique, appelée par tous les écrans.** [0010](adr/0010-active-rest-mechanic.md)
10. **Une règle appliquée automatiquement se lit en clair dans l'onglet Notes**, pour que le joueur
    comprenne d'où vient chaque chiffre. [0021](adr/0021-combat-hud-always-visible.md)

### Contenu et droits

11. **Aucun texte protégé n'est commité.** Le dépôt est public : les sorts s'importent à
    l'exécution, et les registres ne portent que de la mécanique. [0004](adr/0004-json-import-export-open5e-schema.md) [0022](adr/0022-computed-class-values-and-resources.md) [0025](adr/0025-subclass-registry.md)

### Interface

12. **Deux modes, deux modèles de persistance.** En mode jeu, chaque action est enregistrée tout
    de suite. En mode configuration, on modifie un brouillon puis on enregistre. Chaque mode a ses
    propres composants (`*-view-tab.tsx` côté jeu), sans prop `readOnly` qui basculerait un même
    composant d'un mode à l'autre. [0012](adr/0012-play-mode-vs-configuration-mode.md) [0016](adr/0016-play-mode-read-only-view-tabs.md)
13. **Les onglets des deux modes sont des miroirs, déclarés dans `character-tabs.ts`.** Un onglet
    ajouté d'un côté y déclare son miroir ou son repli. [0067](adr/0067-back-link-and-mirror-tabs.md)
14. **Toute action du mode jeu passe par `withCurrent` (`use-play-actions.ts`).** Elle relit la
    fiche au moment de l'action, ce qui évite les mises à jour perdues, et elle est journalisée
    automatiquement dans l'historique. [0012](adr/0012-play-mode-vs-configuration-mode.md) [0061](adr/0061-activity-log.md)
15. **Les informations vitales (CA, PV, concentration) restent visibles au-dessus des onglets**,
    dans un résumé sans contrôle. Les contrôles sont dans l'onglet Combat. [0021](adr/0021-combat-hud-always-visible.md) [0031](adr/0031-combat-tab-and-sticky-summary.md)
16. **Un thème visuel est une palette propre à un personnage.** Il se pose par `data-theme` sur un
    wrapper, se déclare dans un registre et ne va jamais dans le layout racine. Les couleurs
    sémantiques (succès, avertissement, danger) gardent leur sens, même si un thème recalibre leur
    valeur. [0013](adr/0013-per-character-visual-theme.md) [0015](adr/0015-selune-night-palette.md)
17. **Chaque page place le bouton plein écran dans son en-tête.** Un test parcourt toutes les
    pages. [0063](adr/0063-fullscreen-on-every-page.md)
18. **Les primitives d'interface viennent de shadcn/ui sur Radix, jamais sur Base UI.** Le CLI
    bascule sur Base UI par défaut : toujours l'appeler avec `-b radix`. [0007](adr/0007-ui-stack-radix-shadcn-tailwind.md)
19. **L'application fonctionne hors ligne grâce à un service worker maison, versionné à chaque
    déploiement.** Fichiers hashés : cache d'abord. Navigations : réseau d'abord, avec repli sur le
    cache. [0045](adr/0045-offline-service-worker.md) [0064](adr/0064-install-prompt.md)

### Processus

20. **Une décision structurante donne un ADR, qui n'est jamais réécrit.** Une décision reconsidérée
    donne un nouvel ADR, résumé dans la section suivante. [0001](adr/0001-record-architecture-decisions.md)
21. **Toute PR qui change ce qu'un joueur voit ou peut faire ajoute son entrée « Nouveautés ».**
    [0058](adr/0058-changelog-page.md)

## Ce qui a changé en route

Les ADR d'origine restent tels quels. Voici, pour chacun, ce qui n'est plus vrai et ce qui l'est
encore.

| Décision d'origine                                                   | Reconsidérée par                                                                                                                                            | Ce qui a changé                                                                                                                                                                     | Ce qui reste valable                                                     |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [0010](adr/0010-active-rest-mechanic.md) Repos actif                 | [0059](adr/0059-hit-dice.md) [0065](adr/0065-rest-resets.md)                                                                                                | Les dés de vie sont modélisés : `applyShortRest(character, hitDieRolls)` les dépense. Les repos remettent aussi à zéro la concentration, les PV temporaires et les effets de CA.    | Des fonctions pures uniques, dans `rest.ts`.                             |
| [0013](adr/0013-per-character-visual-theme.md) Thème par personnage  | [0015](adr/0015-selune-night-palette.md)                                                                                                                    | Un thème peut recalibrer les couleurs sémantiques, à sens constant.                                                                                                                 | Thème par `data-theme` scopé, déclaré dans un registre.                  |
| [0016](adr/0016-play-mode-read-only-view-tabs.md) Vues lecture seule | [0021](adr/0021-combat-hud-always-visible.md) [0029](adr/0029-character-purse-and-play-mode-inventory.md) [0031](adr/0031-combat-tab-and-sticky-summary.md) | Les onglets du mode jeu ne sont plus ceux de la configuration (Combat et Notes remplacent Général). « Lecture seule » n'est plus strict : bourse et inventaire se modifient en jeu. | Un composant dédié par mode, qui réutilise les calculs du domaine.       |
| [0021](adr/0021-combat-hud-always-visible.md) HUD toujours visible   | [0031](adr/0031-combat-tab-and-sticky-summary.md)                                                                                                           | Le HUD devient l'onglet Combat. Un résumé en lecture seule reste collé au-dessus des onglets.                                                                                       | Le contenu du HUD, et les règles appliquées listées dans l'onglet Notes. |

## Index des ADR par thème

### Fondations et processus

- [0001](adr/0001-record-architecture-decisions.md) — Consigner les décisions d'architecture
- [0005](adr/0005-no-auth-no-backend-v1-scope.md) — Scope v1 : pas d'authentification, pas de backend
- [0006](adr/0006-vercel-subdomain-deployment.md) — Déploiement Vercel sur un sous-domaine du domaine existant
- [0007](adr/0007-ui-stack-radix-shadcn-tailwind.md) — Stack UI : Radix UI + shadcn/ui + Tailwind CSS
- [0058](adr/0058-changelog-page.md) — Page « Nouveautés » pour informer les joueurs
- [0073](adr/0073-architecture-summary.md) — Synthèse d'architecture et index des ADR par thème

### Données, stockage et échanges

- [0002](adr/0002-repository-pattern-localstorage-v1.md) — Repository pattern avec implémentation localStorage en v1
- [0003](adr/0003-zustand-stores-over-repositories.md) — Zustand pour la réactivité UI au-dessus des repositories
- [0004](adr/0004-json-import-export-open5e-schema.md) — Import/export JSON versionné, schéma de sorts aligné open5e/SRD
- [0008](adr/0008-generalized-import-export-and-backup.md) — Import/export généralisé et sauvegarde complète
- [0023](adr/0023-stored-format-migrations.md) — Migration du format stocké
- [0072](adr/0072-demo-data.md) — Personnages de démonstration

### Hors ligne et installation

- [0045](adr/0045-offline-service-worker.md) — Application installable et hors ligne (service worker maison)
- [0064](adr/0064-install-prompt.md) — Invitation à installer l'application

### Moteur de règles

- [0009](adr/0009-generic-race-ability-bonuses.md) — Bonus raciaux de caractéristiques, modélisés génériquement
- [0010](adr/0010-active-rest-mechanic.md) — Le repos devient une mécanique active, pas seulement descriptive
- [0017](adr/0017-computed-armor-class.md) — Classe d'armure calculée selon les règles 5e 2014
- [0018](adr/0018-computed-weapon-attacks.md) — Attaques d'armes calculées par arme équipée
- [0022](adr/0022-computed-class-values-and-resources.md) — Valeurs de classe calculées et ressources de classe
- [0026](adr/0026-computed-saves-speed-initiative.md) — Jets de sauvegarde, vitesse et initiative calculés
- [0027](adr/0027-computed-max-hit-points.md) — PV max calculés (valeur fixe ou dés lancés)
- [0028](adr/0028-feat-registry.md) — Registre des dons (bonus de PV par niveau)
- [0048](adr/0048-race-hit-points-and-heavy-armor-speed.md) — Races : PV par niveau et vitesse en armure lourde
- [0050](adr/0050-speed-extra-bonus.md) — Bonus de vitesse saisi, en plus de la vitesse de la race
- [0051](adr/0051-race-change-keeps-effective-scores.md) — Changer de race sans changer les scores réels
- [0059](adr/0059-hit-dice.md) — Dés de vie : dépense au repos court, récupération au repos long
- [0060](adr/0060-death-saves.md) — Jets de sauvegarde contre la mort et état stabilisé
- [0065](adr/0065-rest-resets.md) — Repos : concentration, PV temporaires et effets de CA
- [0066](adr/0066-exhaustion.md) — Épuisement

### Équipement et inventaire

- [0019](adr/0019-weapon-properties-and-martial-arts.md) — Propriétés d'armes (deux mains, lancer) et Arts martiaux
- [0020](adr/0020-equipment-slots-and-two-weapon-fighting.md) — Emplacements d'équipement et combat à deux armes
- [0029](adr/0029-character-purse-and-play-mode-inventory.md) — Bourse du personnage et inventaire modifiable en mode jeu
- [0054](adr/0054-ready-weapons.md) — Armes prêtes à dégainer, en plus des armes en main
- [0056](adr/0056-item-value.md) — Valeur marchande des objets
- [0057](adr/0057-weapon-grip.md) — Prise d'une arme en main : principale, secondaire, deux mains

### Classes, sous-classes et sorts

- [0011](adr/0011-spell-domain-tag-per-character.md) — Le tag de domaine de sort est porté par le personnage, pas par le sort
- [0025](adr/0025-subclass-registry.md) — Registre des sous-classes (domaines divins)
- [0032](adr/0032-known-spells-picker-and-exclusive-preparation.md) — Sorts connus : sélecteur dédié et préparation exclusive
- [0033](adr/0033-prepared-spells-limit-and-casting-header.md) — Limite de sorts préparés et en-tête d'incantation
- [0034](adr/0034-play-mode-spell-casting-and-preparation.md) — Lancer et préparer les sorts depuis le mode jeu
- [0047](adr/0047-druid-wild-shape-circle-of-spores.md) — Druide : réserve Forme sauvage et Cercle des spores
- [0052](adr/0052-monk-class.md) — Classe Moine : Ki, Arts martiaux, Défense et Déplacement sans armure
- [0053](adr/0053-barbarian-class.md) — Classe Barbare et bonus de vitesse de classe généralisé
- [0055](adr/0055-barbarian-rage-state.md) — État « en rage » du Barbare
- [0068](adr/0068-shillelagh.md) — Gourdin magique
- [0069](adr/0069-circle-of-spores.md) — Entité symbiotique et Halo de spores
- [0070](adr/0070-wild-shape.md) — Forme sauvage

### Mode jeu

- [0012](adr/0012-play-mode-vs-configuration-mode.md) — Séparation mode jeu / mode configuration, persistance immédiate vs brouillon
- [0016](adr/0016-play-mode-read-only-view-tabs.md) — Vues lecture seule séparées pour le mode jeu, plutôt qu'un prop `readOnly` générique
- [0021](adr/0021-combat-hud-always-visible.md) — HUD de combat toujours visible en mode jeu
- [0024](adr/0024-hud-resources-band.md) — Bloc « Ressources » du HUD de combat
- [0030](adr/0030-feature-uses-in-play-mode.md) — Capacités à utilisations mises en avant en mode jeu
- [0031](adr/0031-combat-tab-and-sticky-summary.md) — Onglet « Combat » et résumé fixe en mode jeu
- [0061](adr/0061-activity-log.md) — Historique des actions du mode jeu
- [0062](adr/0062-guided-attack.md) — Attaque guidée : jets d'attaque et de dégâts expliqués
- [0067](adr/0067-back-link-and-mirror-tabs.md) — Lien de retour commun et onglet conservé entre jeu et configuration
- [0071](adr/0071-adventurer-journal.md) — Journal de l'aventurier

### Mode configuration

- [0035](adr/0035-general-tab-configuration-redesign.md) — Refonte de l'onglet Général de la configuration
- [0036](adr/0036-inventory-configuration-redesign.md) — Refonte de l'onglet Inventaire de la configuration
- [0037](adr/0037-abilities-configuration-redesign.md) — Refonte de l'onglet Caractéristiques de la configuration
- [0038](adr/0038-features-configuration-redesign.md) — Refonte de l'onglet Capacités de la configuration

### Interface et identité visuelle

- [0013](adr/0013-per-character-visual-theme.md) — Thème visuel par personnage via `data-theme` scopé
- [0014](adr/0014-typography-and-dark-default.md) — Système typographique (Spectral) et base sombre par défaut
- [0015](adr/0015-selune-night-palette.md) — Palette Séluné révisée en identité nocturne
- [0039](adr/0039-character-list-cards.md) — Cartes de la liste des personnages
- [0040](adr/0040-forge-naine-palette.md) — Palette « Forge naine » (Murrik, nain barbare)
- [0041](adr/0041-spell-detail-sheet.md) — Panneau de détail des sorts
- [0042](adr/0042-combat-tab-detail-sheet.md) — Panneau de détail dans l'onglet Combat
- [0043](adr/0043-features-and-items-detail-sheet.md) — Panneau de détail pour les capacités, dons et objets
- [0044](adr/0044-swipe-to-close-detail-sheet.md) — Fermer les panneaux de détail en glissant vers le bas
- [0046](adr/0046-ombreflore-palette.md) — Palette « Ombreflore » (Myrelia, druide du cercle des spores)
- [0049](adr/0049-ki-infernal-palette.md) — Palette « Ki infernal » (Mordaï, moine tieffelin)
- [0063](adr/0063-fullscreen-on-every-page.md) — Bouton plein écran sur toutes les pages
