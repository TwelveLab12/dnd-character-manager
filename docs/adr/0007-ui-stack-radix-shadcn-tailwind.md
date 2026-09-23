# 0007 — Stack UI : Radix UI + shadcn/ui + Tailwind CSS

**Statut** : Acceptée

## Contexte

Le projet a besoin de composants d'interface accessibles (dialogs, menus déroulants, cases à
cocher, onglets) sans réinventer la gestion clavier/focus/ARIA, tout en gardant un contrôle total
sur le code généré (pas une dépendance boîte noire). C'était un choix de stack posé dès le départ
du projet, avant même le premier commit.

## Décision

**Radix UI** comme couche de primitives headless (comportement/accessibilité), **shadcn/ui**
comme générateur qui copie le code des composants dans `src/components/ui/` (pas un package
installé — le code est à nous, modifiable), **Tailwind CSS v4** pour le style (config via `@theme`
dans `globals.css`, pas de `tailwind.config.js`).

**Piège récurrent à surveiller** : le CLI `shadcn` a changé son préréglage par défaut vers **Base
UI** (`@base-ui/react`) plutôt que Radix. Toute initialisation ou ajout de composant doit forcer
Radix explicitement :

```bash
pnpm dlx shadcn@latest init -b radix -p nova -y
pnpm dlx shadcn@latest add <composant> -y
```

Vérification après coup : `package.json` doit lister `radix-ui`, jamais `@base-ui/react` ;
`components.json` → `"style"` doit commencer par `radix-` (ex : `radix-nova`). Ce même choix est
repris dans le template [ts-project-template](https://github.com/TwelveLab12/ts-project-template)
et documenté dans son `CLAUDE.md`.

## Conséquences

Composants entièrement modifiables (pas de surcouche à contourner), mais nécessite cette
vérification manuelle à chaque init/ajout tant que le CLI shadcn ne redeviendra pas Radix par
défaut — ou tant qu'on n'aura pas automatisé la vérification (ex : script `postinstall` ou check
CI dédié, non fait à ce jour).
