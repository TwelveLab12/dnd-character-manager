/**
 * Nouveautés de l'application, pour les joueurs (docs/adr/0058) : une entrée par évolution
 * fonctionnelle livrée, la plus récente en premier. Toute PR qui change ce qu'un joueur voit ou
 * peut faire ajoute son entrée ici.
 */
export interface ChangelogEntry {
  /** Identifiant stable et unique : sert à savoir si l'entrée a déjà été vue. */
  id: string;
  /** Date de mise en ligne, « AAAA-MM-JJ ». */
  date: string;
  title: string;
  /** Ce qui change, du point de vue du joueur. */
  changes: string[];
  /** Ce que le joueur doit éventuellement faire après la mise à jour. */
  action?: string;
}

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    id: "2026-09-27-changelog",
    date: "2026-09-27",
    title: "Page « Nouveautés »",
    changes: [
      "Cette page liste les évolutions de l’application. Une pastille sur le bouton « Nouveautés » de l’accueil signale ce que vous n’avez pas encore vu.",
    ],
  },
  {
    id: "2026-09-27-weapon-grip",
    date: "2026-09-27",
    title: "Prise d’une arme en main",
    changes: [
      "Une arme en main se tient en main principale, en main secondaire ou à deux mains, au choix sous « En main » dans l’inventaire.",
      "Une arme polyvalente (épée longue, bâton, lance…) tenue à deux mains utilise son dé à deux mains et libère le bouclier ou l’arme secondaire.",
      "L’onglet Combat n’affiche plus que les dégâts de la prise choisie. Une arme prête garde ses deux valeurs.",
      "« Secondaire » reste visible, grisée avec sa raison, quand l’arme ne peut pas être tenue en main secondaire.",
    ],
    action:
      "Vos armes polyvalentes équipées sont en main principale : choisissez « Deux mains » pour celles que votre personnage tient à deux mains.",
  },
  {
    id: "2026-09-25-weapons-rage-value",
    date: "2026-09-25",
    title: "Armes prêtes, Rage et valeur des objets",
    changes: [
      "Une arme peut être rangée dans le sac, prête à dégainer (à la ceinture) ou en main. Les armes prêtes apparaissent en combat, à part.",
      "Une arme prête épuisée (quantité 0) n’apparaît plus dans les attaques.",
      "Barbare : état « En rage », avec son bonus aux dégâts appliqué aux attaques concernées.",
      "Valeur marchande des objets (po, pa, pc…) dans l’inventaire.",
    ],
  },
  {
    id: "2026-09-25-races-classes",
    date: "2026-09-25",
    title: "Nouvelles races, classes et thèmes",
    changes: [
      "Races : Demi-elfe, Nain des collines, Tieffelin.",
      "Classes : Moine, Barbare. Druide : réserve de Forme sauvage et Cercle des spores.",
      "Nouveaux thèmes visuels : « Ombreflore », « Ki infernal ».",
    ],
  },
  {
    id: "2026-09-25-install-offline",
    date: "2026-09-25",
    title: "Installable et hors ligne",
    changes: [
      "L’application s’installe sur l’écran d’accueil (téléphone, tablette, ordinateur).",
      "Elle fonctionne sans connexion une fois ouverte au moins une fois.",
    ],
  },
  {
    id: "2026-09-25-detail-sheets",
    date: "2026-09-25",
    title: "Panneaux de détail",
    changes: [
      "Toucher un sort, une capacité, un don, un objet ou une attaque ouvre son détail complet.",
      "Les panneaux se ferment en glissant vers le bas.",
    ],
  },
  {
    id: "2026-09-24-play-mode",
    date: "2026-09-24",
    title: "Mode jeu et configuration repensés",
    changes: [
      "Onglet « Combat » avec un résumé toujours visible : PV, CA, ressources, attaques.",
      "Lancer et préparer ses sorts depuis l’onglet Sorts, emplacements en jetons, limite de sorts préparés.",
      "Bourse et quantités modifiables depuis l’inventaire du mode jeu.",
      "Bouton plein écran. Onglets de configuration redessinés. Thème « Forge naine ».",
    ],
  },
  {
    id: "2026-09-24-computed-values",
    date: "2026-09-24",
    title: "Valeurs calculées",
    changes: [
      "Classe d’armure, attaques d’armes, jets de sauvegarde, vitesse, initiative et PV max sont calculés d’après les règles 5e (2014).",
      "Emplacements d’équipement et combat à deux armes, propriétés d’armes (deux mains, lancer, armes de moine).",
      "Emplacements de sorts et Canalisation divine calculés selon la classe ; dons et sous-classes connus.",
    ],
  },
  {
    id: "2026-09-23-launch",
    date: "2026-09-23",
    title: "Lancement",
    changes: [
      "Gestion de plusieurs personnages, fiche complète en onglets et mode jeu (PV, repos, concentration, sorts).",
      "Bibliothèque de sorts à importer, import et export des personnages et sauvegarde complète.",
      "Thème visuel par personnage.",
    ],
  },
];

/** Identifiant de la nouveauté la plus récente. */
export const LATEST_CHANGELOG_ID = CHANGELOG[0]?.id;
