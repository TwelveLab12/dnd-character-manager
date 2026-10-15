# Accessibilité : couverture RGAA et checklist de tests manuels

Ce document dit **ce que les outils vérifient, ce qu'ils ne voient pas, et comment tester le reste à
la main**, gratuitement. Ce n'est **pas une déclaration de conformité** : « aucune violation
détectée » ne veut pas dire « conforme ». La stratégie et le choix de publier ou non une déclaration
sont dans l'ADR de stratégie accessibilité (`docs/adr/`).

Référentiel : WCAG 2.2 AA, avec le RGAA 4.1.2 (aligné WCAG 2.1) comme grille de lecture jusqu'au
RGAA 5. Les nouveautés de WCAG 2.2 que le RGAA 4.1.2 ne couvre pas (focus non masqué, taille des
cibles, saisie redondante…) sont suivies par la checklist de `.claude/kit/a11y.md`.

## Ce qui est automatisé

| Couche                                              | Quand                            | Ce qu'elle voit                                                                                 | Ce qu'elle ne voit pas                                                                           |
| --------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Lint `jsx-a11y` (preset `strict`)                   | pré-commit, `lint:ci` (bloquant) | ARIA invalide, `alt` manquant, gestionnaires sans clavier, liens vides, `tabindex` positif      | le rendu : contraste, ordre de focus, landmarks calculés                                         |
| axe-core dans Vitest (`*.a11y.test.tsx`)            | `test`                           | structure et ARIA de chaque composant                                                           | contraste, mise en page, cibles (pas de moteur de rendu dans jsdom)                              |
| Contraste des tokens (`design-tokens.a11y.test.ts`) | `test`                           | chaque paire de couleurs du design system, clair et sombre                                      | l'opacité ajoutée par une classe, les couleurs écrites en dur                                    |
| axe-core + Playwright (`e2e/a11y.spec.ts`)          | `test:e2e`, CI                   | WCAG 2.2 AA et bonnes pratiques sur le rendu, reflow 320 px, focus visible, titres, `lang`, 404 | le texte des SVG, le lecteur d'écran, la pertinence des textes, les pages derrière une connexion |

Pages couvertes par les tests e2e : celles de `e2e/routes.ts`, plus la 404. _À compléter : pages
volontairement non couvertes (connexion requise…) et pourquoi._

## Couverture RGAA 4.1.2 par thématique

« Sur ce projet » : _applicable_, _non applicable_ (dire pourquoi, à revoir si ça change) ou _à
arbitrer_. Les mentions « à arbitrer » ne sont pas des défauts confirmés : ce sont des points où la
lecture du RGAA laisse une marge, à trancher en connaissance de cause.

| Thème                    | Automatique                                     | Lecture du code                                                                        | Test manuel                                                                   | Sur ce projet |
| ------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------- |
| 1. Images                | `alt-text`, axe `image-alt`                     | `alt` pertinents, décoratives en `alt=""`, SVG informatifs nommés                      | pertinence des alternatives (1.3)                                             | à évaluer     |
| 2. Cadres                | axe `frame-title`                               | `title` des `iframe`                                                                   | —                                                                             | à évaluer     |
| 3. Couleurs              | axe `color-contrast`, test des tokens           | pas d'information par la couleur seule                                                 | 3.1, contrastes au survol, au focus, dans les SVG                             | à évaluer     |
| 4. Multimédia            | —                                               | sous-titres, transcriptions, contrôles                                                 | lecture des médias                                                            | à évaluer     |
| 5. Tableaux              | axe (en-têtes de cellules)                      | `<th>`, `scope`, `caption`                                                             | en-têtes annoncés au lecteur d'écran                                          | à évaluer     |
| 6. Liens                 | `anchor-is-valid`, axe `link-name`              | intitulés explicites, liens à icône nommés                                             | intitulés compris hors contexte, nouvelle fenêtre signalée                    | à évaluer     |
| 7. Scripts               | règles de gestionnaires, axe `aria-*`           | composants natifs ou primitives de la bibliothèque UI, focus rendu, messages de statut | composants au clavier et au lecteur d'écran                                   | à évaluer     |
| 8. Éléments obligatoires | axe `html-has-lang`, `document-title`           | `lang`, un titre par route                                                             | pertinence des titres (8.6), validité HTML (8.2), changements de langue (8.7) | à évaluer     |
| 9. Structuration         | axe `heading-order`, `landmark-*`, `list`       | plan des titres, repères, listes                                                       | plan et repères au lecteur d'écran                                            | à évaluer     |
| 10. Présentation         | axe `target-size`, reflow 320 px, focus visible | focus global, `prefers-reduced-motion`, cibles                                         | zoom 200 % (10.4), espacement du texte (10.12)                                | à évaluer     |
| 11. Formulaires          | axe `label`                                     | labels, erreurs reliées et annoncées, saisie conservée                                 | parcours complet avec erreurs                                                 | à évaluer     |
| 12. Navigation           | axe `bypass`, `skip-link`                       | lien d'évitement, navigations nommées                                                  | ordre de tabulation (12.8), pièges (12.9)                                     | à évaluer     |
| 13. Consultation         | —                                               | pas de limite de temps ni d'ouverture sans action                                      | orientation (13.9), contenus au survol                                        | à évaluer     |

## Checklist de tests manuels

À faire au fil des évolutions, surtout après un changement de structure, de navigation ou de
composant interactif. Outils gratuits : [NVDA](https://www.nvaccess.org/) (Windows) ou VoiceOver
(macOS/iOS), les DevTools de Firefox et Chrome,
[Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/), le
[validateur HTML du W3C](https://validator.w3.org/).

### 1. Clavier seul

Tab, Maj+Tab, Entrée, Espace, Échap, flèches.

- Le premier Tab affiche le lien d'évitement ; Entrée amène dans le contenu principal.
- Le focus est visible à chaque étape et jamais caché derrière un en-tête collant (Safari en
  priorité).
- L'ordre de tabulation suit l'ordre visuel ; aucun piège.
- Menus, modales, onglets : ouverture au clavier, Échap ferme **et rend le focus** au déclencheur.
- Zones défilantes (tableaux, code, schémas) : Tab les atteint, les flèches les font défiler.

### 2. Zoom et reflow

- Zoom 200 % puis 400 % (≈ 320 px de large) : pas de défilement horizontal de la page, rien de
  masqué ni de superposé.
- Firefox, « Zoom texte seul » : le texte reste lisible, rien ne se chevauche.
- Espacement du texte (bookmarklet « Text Spacing ») : aucune perte de contenu.

### 3. Lecteur d'écran

- Liste des titres : plan cohérent, du `h1` aux niveaux inférieurs.
- Repères : bannière, navigation(s) nommée(s), contenu principal, pied de page.
- Contrôles à icône : nom stable, état annoncé (développé, coché…).
- Listes annoncées comme listes ; tableaux avec en-têtes ; SVG informatifs décrits.
- Messages d'erreur et de statut annoncés sans déplacer le focus inutilement.

### 4. Contraste

À mesurer là où les outils ne voient pas : états de survol et de focus, texte et tracés des SVG,
couleurs avec transparence, toute nouvelle paire de couleurs (texte ≥ 4.5:1, grand texte et
éléments d'interface ≥ 3:1).

### 5. Mouvement réduit

DevTools › Rendering › « Emulate CSS media feature prefers-reduced-motion: reduce » : aucune
animation non essentielle, les ancres sautent sans défilement animé.

### 6. HTML

Passer le HTML rendu d'une page dans le validateur du W3C (RGAA 8.2).

## Ce que les outils ne voient pas

- Le texte et les tracés des SVG (contraste « à vérifier » pour axe).
- Le focus réel, l'usage au lecteur d'écran, l'usage tactile sur mobile.
- La pertinence des textes : intitulés de liens, alternatives, titres de pages.

## Écarts ouverts

_Aucun pour l'instant._ Chaque défaut trouvé à la main devient une issue (type + label
`accessibility`) listée ici tant qu'elle est ouverte.

## Tenir ce document à jour

- Remplir la colonne « Sur ce projet » au premier audit (`/claude-kit:a11y-audit`), puis à chaque
  changement qui la modifie (premier formulaire, premier média…).
- Retirer un écart quand son issue est fermée.
- À revoir à la publication du RGAA 5.
