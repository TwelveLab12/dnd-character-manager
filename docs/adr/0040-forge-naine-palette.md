# 0040 — Palette « Forge naine » (Murrik, nain barbare)

**Statut** : Acceptée

## Contexte

Un deuxième personnage, Murrik Ronin, a été importé depuis sa fiche : nain des collines, barbare
de la voie du totem de l'ours, forgeron, « le regard gris et dur comme du granit », vêtu de cuir
bouilli et de fourrure, « il sent la bière et le feu de bois ». Seule la palette Séluné
([0015](0015-selune-night-palette.md)), pensée pour une clerc lunaire, existait.

## Décision

Ajoute un thème `forge-naine` (« Forge naine (Ours, Barbare) ») suivant le mécanisme de
[0013](0013-per-character-visual-theme.md) : une entrée dans `theme-registry.ts` et un bloc
`[data-theme="forge-naine"]` dans `globals.css`.

Palette sombre et chaude, en miroir de Séluné (nuit froide + or) :

| Rôle                    | Couleur   | Nom      |
| ----------------------- | --------- | -------- |
| fond                    | `#14100D` | suie     |
| carte / secondaire      | `#1F1914` | cuir     |
| popover                 | `#2A211A` | fourrure |
| texte                   | `#EFE4D4` | os       |
| texte atténué, bordures | `#A8998A` | cendre   |
| primaire (maîtrise…)    | `#E8913A` | braise   |
| accent, info, focus     | `#9FB0BB` | granit   |
| danger                  | `#C8483F` | sang     |
| succès                  | `#7FA35A` | lichen   |
| avertissement           | `#D8C26A` | laiton   |

Comme pour Séluné, les tokens sémantiques sont recalibrés pour ce fond (principe de 0015). La
braise joue le rôle de l'or de Séluné (valeurs maîtrisées, sorts toujours préparés) ; le granit,
froid, garde le rôle de la lueur (concentration, focus) pour rester distinct de la braise.
L'avertissement passe au laiton, jaune, pour ne pas se confondre avec la braise orangée.

Un test vérifie désormais que chaque thème du registre a son bloc de tokens dans `globals.css`.

## Conséquences

Chaque personnage peut choisir entre deux identités. Le fond de page (« bureau », défini sur
`body`) reste indépendant du thème du personnage.
