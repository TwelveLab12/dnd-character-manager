// Pages audited by e2e/a11y.spec.ts. Add every new route in the PR that creates it: like a RGAA
// audit sample, the list must cover each page template (home, list, detail, form, error…).
// Not covered yet: /characters/[id] and /characters/[id]/edit need a character in localStorage
// (TwelveLab12/dnd-character-manager#182).
export const ROUTES: string[] = ["/", "/spells", "/changelog", "/offline"];
