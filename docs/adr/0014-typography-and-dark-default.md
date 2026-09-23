# 0014 — Système typographique (Spectral) et base sombre par défaut

**Statut** : Acceptée

## Contexte

Retour utilisateur sur l'interface déployée : l'UI est jugée médiocre pour un usage quotidien, pas
assez professionnelle. Deux causes concrètes identifiées : Geist Sans était utilisée pour tout
(corps de texte comme titres), sans caractère distinctif pour les titres, et les classes de titre
(`text-2xl font-semibold tracking-tight` pour les h1, `text-lg font-medium` pour les h2) étaient
copiées-collées dans plus de 8 fichiers sans composant partagé — une dérive difficile à corriger
uniformément. Un bug latent a aussi été trouvé en creusant le sujet :
`--font-sans: var(--font-sans)` (`globals.css`) s'auto-référençait sans jamais pointer vers
`--font-geist-sans` produit par `next/font/google`, donc le corps de page retombait
silencieusement sur la pile système par défaut de Tailwind, jamais sur Geist Sans comme prévu.

## Décision

- **Police de titre** : `Spectral` (Google Font, serif littéraire chaleureuse, proche de
  Palatino/Iowan Old Style — référence visuelle fournie par l'utilisateur), chargée via
  `next/font/google` dans `layout.tsx`, exposée en token `--font-display` puis `--font-heading`
  dans `globals.css`. Appliquée uniquement aux h1/h2 (+ `CardTitle`, déjà câblé sur
  `font-heading`) — Geist Sans reste pour le corps de texte et les données chiffrées (PV,
  modificateurs), où la densité/lisibilité prime sur le caractère.
- Correction du bug `--font-sans` : pointe maintenant vers `var(--font-geist-sans)`, même patron
  que `--font-mono: var(--font-geist-mono)` juste à côté.
- Deux composants partagés pour arrêter la dérive copier-coller :
  `src/components/ui/page-title.tsx` (h1) et `src/components/ui/section-title.tsx` (h2), adoptés
  dans tous les titres existants de `character-list/`, `character-play/`, `character-sheet/`,
  `spell-library/`.
- **Base sombre par défaut** : `:root` adopte les valeurs qui étaient dans `.dark` (déjà
  cohérentes, jamais activées faute de `next-themes`/toggle) ; le sélecteur `.dark` est supprimé,
  devenu redondant. `--radius` passe de `0.625rem` à `0.75rem` pour des cartes plus généreuses,
  cohérent avec la nouvelle identité visuelle demandée (référence "Yomi Tsuki").

Cette base sombre neutre sert de fondation à la palette Séluné (nuit/or/lueur), traitée dans un
ADR séparé qui reconsidère [0013](0013-per-character-visual-theme.md) plutôt que de l'éditer
rétroactivement.

## Conséquences

L'app n'a plus de mode clair — c'était déjà de facto le cas (le mode clair `:root` d'origine
n'était qu'un point de départ shadcn jamais retravaillé), mais c'est maintenant un choix assumé
plutôt qu'un oubli. Toute classe `dark:` déjà présente dans les primitives shadcn générées
(`button.tsx`, `textarea.tsx`, etc.) devient inerte par construction : `@custom-variant dark`
reste défini mais rien ne pose jamais la classe `.dark`, donc ces classes ne se déclenchent
jamais — préférable à laisser Tailwind retomber sur son défaut `prefers-color-scheme`, qui aurait
introduit un comportement différent selon l'OS du visiteur. Ajouter un futur titre nécessite
d'utiliser `PageTitle`/`SectionTitle` plutôt qu'un `<h1>`/`<h2>` ad hoc — à surveiller en revue de
code pour ne pas réintroduire la dérive.
