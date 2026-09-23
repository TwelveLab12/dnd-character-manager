# 0015 — Palette Séluné révisée en identité nocturne

**Statut** : Acceptée

## Contexte

La première version de la palette Séluné ([0013](0013-per-character-visual-theme.md)) était
pastel claire (nacré/lavande pâle en fond, indigo profond en primaire). L'utilisateur a ensuite
fourni une référence visuelle complète ("Yomi Tsuki") beaucoup plus aboutie : une identité
nocturne sombre — fond nuit (`#0E1120`), texte nacré (`#EDEBF5`), accent or (`#D6B25F`), accent
lueur bleu-lavande (`#8FA9FF`), vert (`#5FA98C`) et sang (`#BE4E60`) pour succès/danger.

## Décision

Remplace entièrement les valeurs du bloc `[data-theme="selune"]` dans `globals.css` par cette
palette nocturne, en hex/rgba tels quels (pas de conversion vers `oklch()`, pour rester fidèle
pixel-pour-pixel à la référence déjà approuvée — CSS accepte de mélanger les deux notations dans
la même feuille sans problème).

**Point qui reconsidère 0013** : la règle « les tokens sémantiques `success`/`warning`/`info`/
`destructive` ne sont jamais redéfinis par un thème » est nuancée. Pour ce thème sombre, ces
tokens _sont_ recalibrés (vert/sang/lueur au lieu des valeurs par défaut) : les valeurs par défaut
sont calibrées pour la base neutre grise de l'app (elle-même sombre depuis
[0014](0014-typography-and-dark-default.md)), pas nécessairement les mieux ajustées en contraste
pour le ton de nuit très saturé de bleu de Séluné. Le sens reste constant (rouge = danger, vert =
succès), seules les valeurs exactes changent — exactement le principe que `.dark` appliquait déjà
par rapport à `:root` avant que la base sombre ne devienne la valeur par défaut. Un token
`warning` a dû être choisi (cuivre `#C98A4B`), absent de la référence, distinct de l'or utilisé
comme `primary`.

## Conséquences

La palette Séluné est maintenant visuellement alignée sur la référence approuvée par l'utilisateur.
Toute future palette sombre pourra suivre le même principe (recalibrer les tokens sémantiques pour
son propre fond plutôt que les hériter tels quels) ; une future palette _claire_, elle, devrait
plutôt suivre la règle initiale de 0013 (tokens sémantiques hérités sans recalibrage), les deux
étant compatibles : le vrai critère est le contraste avec le fond du thème, pas une règle figée
« toujours identique » ou « toujours différent ».
