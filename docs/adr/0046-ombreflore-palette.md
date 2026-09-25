# 0046 — Palette « Ombreflore » (Myrelia, druide du cercle des spores)

**Statut** : Acceptée

## Contexte

Un troisième personnage, Myrelia Ombreflore, a été importé depuis sa fiche : demi-elfe druide du
cercle des spores, idéal « le cycle avant tout », lien « esprit de la forêt », « le regard vert
d'une clairière après l'averse », une crinière rousse et brune striée de vert, piquée de feuilles
et d'épines, « elle sent la pluie et les fleurs ». Les palettes existantes sont Séluné, lunaire
([0015](0015-selune-night-palette.md)), et Forge naine, chaude
([0040](0040-forge-naine-palette.md)).

## Décision

Ajoute un thème `ombreflore` (« Ombreflore (Spores, Druide) ») suivant le mécanisme de
[0013](0013-per-character-visual-theme.md) : une entrée dans `theme-registry.ts` et un bloc
`[data-theme="ombreflore"]` dans `globals.css`.

Palette sombre et végétale :

| Rôle                    | Couleur   | Nom       |
| ----------------------- | --------- | --------- |
| fond                    | `#0E1511` | sous-bois |
| carte / secondaire      | `#16201A` | mousse    |
| popover                 | `#1F2B23` | feuillage |
| texte                   | `#EAF0E6` | brume     |
| texte atténué, bordures | `#9BAB9F` | lichen    |
| primaire (maîtrise…)    | `#C792D8` | orchidée  |
| accent, info, focus     | `#7FC4C0` | pluie     |
| danger                  | `#CC5B6B` | baie      |
| succès                  | `#8CC06A` | fougère   |
| avertissement           | `#D9A650` | ambre     |

Le vert porte l'ambiance (fonds, texte atténué) mais pas la primaire : il est réservé au succès
(fougère), pour que « maîtrisé » et « PV en bonne santé » ne se confondent pas. La primaire est
l'orchidée, la fleur d'ombre du nom, qui évoque aussi les spores. La pluie, bleu-vert froid, garde
le rôle de la lueur de Séluné (concentration, focus). Les tokens sémantiques sont recalibrés pour
ce fond, comme en 0015.

## Conséquences

Trois identités sont disponibles. Le test du registre vérifie que chaque thème a son bloc de
tokens dans `globals.css`.
