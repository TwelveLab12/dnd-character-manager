# 0074 — Stratégie accessibilité

**Statut** : Acceptée

## Contexte

L'application sert à la table, souvent sur téléphone, et le dépôt est public. Jusqu'ici,
l'accessibilité n'avait aucun contrôle outillé. Le premier passage des outils du module `a11y` de
claude-kit (#181) a relevé :

- l'absence de zone principale et de lien d'évitement ;
- le même titre d'onglet sur plusieurs pages ;
- un débordement horizontal de la bibliothèque de sorts sur tous les téléphones courants.

Aucun de ces défauts ne se voyait à l'usage habituel. Aucun outil ne couvre seul le sujet :
l'analyse statique ne voit pas le rendu, axe ne voit qu'une partie des critères sur le rendu, et ni
l'un ni l'autre ne remplace le clavier et le lecteur d'écran.

## Décision

Cible : **WCAG 2.2 AA**, avec le **RGAA 4.1.2** comme grille de lecture (critères cités dans les
issues et les PR) jusqu'à la sortie du RGAA 5, aligné sur WCAG 2.2.

Trois couches, aucune suffisante seule :

1. **Lint** : preset `strict` d'`eslint-plugin-jsx-a11y`, en erreur, bloquant dans `lint:ci`. Un
   `eslint-disable` jsx-a11y n'est admis qu'avec sa justification.
2. **Rendu** : axe-core dans Vitest (`*.a11y.test.tsx`) et dans Playwright (`e2e/a11y.spec.ts` sur
   les routes de `e2e/routes.ts` et la 404 : axe, reflow à 320 px, focus visible, structure),
   plus le contraste des tokens du design system. **Bloquant en CI** : les écarts relevés à
   l'adoption ont été corrigés dans la même PR, il n'y a pas de dette à tolérer
   (`a11yGate` du kit laissé à son défaut).
3. **Manuel** : checklist de `docs/accessibility.md` (clavier, zoom, lecteur d'écran), et revue de
   chaque diff d'interface par l'agent `a11y-reviewer` avant la PR.

Structure commune à toutes les pages :

- un seul `<main id="contenu">`, posé par `PageMain` dans chaque `page.tsx` ;
- un lien « Aller au contenu principal » en tête du layout ;
- un titre d'onglet propre à la page.

**Aucune déclaration d'accessibilité ni niveau de conformité publié** : aucun audit formel n'a été
fait, et un outil au vert n'est pas une conformité. À reconsidérer par un nouvel ADR après un audit
(outil Ara de la DINUM ou équivalent), ou si le projet devenait soumis à l'obligation légale.

## Conséquences

- Chaque PR d'interface passe les trois couches. Une nouvelle page rejoint `e2e/routes.ts` dans la
  PR qui la crée.
- Une non-conformité trouvée à la main devient une issue (type + label `accessibility`) et un
  « écart ouvert » de `docs/accessibility.md`, jusqu'à sa fermeture.
- La CI est plus longue, avec Chromium et le build de prod pour l'e2e, et une règle jsx-a11y peut
  bloquer un usage légitime : il se justifie alors dans le code.
- La fiche et l'édition de personnage, qui attendent un personnage en `localStorage`, ne sont pas
  encore dans les routes e2e (#182). Un test Vitest y vérifie en attendant la zone principale.
- Revoir cette décision à la sortie du RGAA 5.
