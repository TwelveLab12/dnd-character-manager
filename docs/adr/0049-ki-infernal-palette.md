# 0049 — Palette « Ki infernal » (Mordaï, moine tieffelin)

**Statut** : Acceptée

## Contexte

Un quatrième personnage, Mordaï, a été importé depuis sa fiche : tieffelin, moine de la voie de la
main ouverte, « fidèle en amitié, modeste, positif, et calme en apparence », mais « méfiant et très
susceptible », idéal « Justice/Égalité ». Les palettes existantes sont Séluné (nuit et or,
[0015](0015-selune-night-palette.md)), Forge naine (suie et braise,
[0040](0040-forge-naine-palette.md)) et Ombreflore (sous-bois et orchidée,
[0046](0046-ombreflore-palette.md)).

## Décision

Ajoute un thème `ki-infernal` (« Ki infernal (Main ouverte, Moine) ») suivant le mécanisme de
[0013](0013-per-character-visual-theme.md) : une entrée dans `theme-registry.ts` et un bloc
`[data-theme="ki-infernal"]` dans `globals.css`.

Le contraste du personnage porte la palette : un fond infernal (encre pourpre, laque) et une
primaire calme (jade, le ki).

| Rôle                    | Couleur   | Nom       |
| ----------------------- | --------- | --------- |
| fond                    | `#150C10` | abîme     |
| carte / secondaire      | `#21131A` | laque     |
| popover                 | `#2C1A23` | velours   |
| texte                   | `#F2E8E3` | parchemin |
| texte atténué, bordures | `#B09AA3` | fumée     |
| primaire (maîtrise…)    | `#5ECFAE` | jade      |
| accent, info, focus     | `#B9A3E3` | encens    |
| danger                  | `#E04A5F` | sang      |
| succès                  | `#A6C95B` | bambou    |
| avertissement           | `#E2B24F` | ambre     |

Le jade est un vert : le succès passe à un vert plus jaune (bambou) pour que « maîtrisé » et « PV
en bonne santé » restent distincts. L'encens, lavande froide, garde le rôle de la lueur de Séluné
(concentration, focus). Les tokens sémantiques sont recalibrés pour ce fond, comme en 0015.

## Conséquences

Quatre identités sont disponibles. Le test du registre vérifie que chaque thème a son bloc de
tokens dans `globals.css`.
