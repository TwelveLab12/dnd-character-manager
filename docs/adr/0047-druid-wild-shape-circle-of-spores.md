# 0047 — Druide : réserve Forme sauvage et Cercle des spores

**Statut** : Acceptée

## Contexte

Myrelia est une druide de niveau 3 du Cercle des spores (Chaudron de Tasha). Le registre des règles
connaissait le Druide comme lanceur de sorts (emplacements, préparation, dé de vie, jets de
sauvegarde), mais sans ressource de classe, sans maîtrise d'armure ni sous-classe. Le Clerc sert
déjà de modèle : une réserve calculée (Canalisation divine, [0022](0022-computed-class-values-and-resources.md)),
des options qui la consomment, et une sous-classe qui accorde des sorts toujours préparés
([0025](0025-subclass-registry.md)).

## Décision

Même modèle que le Clerc, sans nouveau mécanisme :

- **Forme sauvage** devient une ressource de classe (`wild-shape`) : 2 utilisations dès le niveau
  2, récupérées au repos court (règles 2014). L'usage illimité de l'Archidruide (niveau 20) n'est
  pas modélisé.
- Le Druide accorde l'option « Forme de bête » (se transformer) et le Cercle des spores l'option
  « Entité symbiotique », qui consomme aussi une Forme sauvage. Comme pour les autres options des
  règles, leur texte vient d'une capacité de même nom sur la fiche ([0042](0042-combat-tab-detail-sheet.md)).
- Le Druide accorde les armures légères, intermédiaires et les boucliers. Ses armes sont une liste
  précise (gourdin, dague, cimeterre…), pas une catégorie : celles cochées sur la fiche font foi.
- Le **Cercle des spores** accorde ses sorts toujours préparés : Contact glacial (niveau 2),
  Cécité/Surdité et Préservation des morts (3), Animation des morts et Forme gazeuse (5),
  Flétrissement et Confusion (7), Brume mortelle et Contagion (9). Contact glacial est en réalité
  un tour de magie appris ; le ranger avec les sorts toujours préparés le rend disponible sans
  préparation, ce qui revient au même.
- Les identifiants de ressource deviennent une liste unique (`CLASS_RESOURCE_IDS`), reprise par le
  schéma d'import.

Non modélisé : les dégâts du Halo de spores qui augmentent avec le niveau (1d4, puis 1d6 au niveau
6…) et les utilisations d'Infestation fongique (niveau 6, modificateur de Sagesse). Ils restent
décrits dans les capacités de la fiche.

## Conséquences

Un druide voit sa réserve de Forme sauvage en mode jeu, avec ses options, et un druide du Cercle
des spores ses sorts de cercle. Une autre sous-classe de druide s'ajoute par une entrée dans le
registre.
