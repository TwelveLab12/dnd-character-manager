// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseColor } from "@/test/contrast";
import { CHARACTER_THEMES } from "./theme-registry";

// Le test des tokens du kit (src/test/design-tokens.a11y.test.ts) ne lit que `:root`, `.dark` et
// `@theme` : les palettes de personnage, scopées par `[data-theme="<id>"]`, sont vérifiées ici.
// Indicateur de focus (WCAG 1.4.11, RGAA 3.3 et 10.7) : l'anneau global du bloc claude-kit
// (`outline` sur `--ring`) doit contraster à 3:1 avec les surfaces sur lesquelles il est dessiné.
// Les surfaces translucides (`bg-background/60`, `bg-primary/10`…) dépendent de ce qui est
// dessous : elles sont mesurées en pixels, voir le commentaire au-dessus du bloc claude-kit.
const FOCUS_CONTRAST = 3;
const SURFACES = ["background", "card", "popover"];

const css = readFileSync("src/app/globals.css", "utf8");

function themeTokens(id: string): Map<string, string> {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = new RegExp(`\\[data-theme="${escaped}"\\]\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
  const tokens = new Map<string, string>();
  for (const [, name = "", value = ""] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(name, value.trim());
  }
  return tokens;
}

describe("contraste de l'anneau de focus des thèmes de personnage", () => {
  for (const { id } of CHARACTER_THEMES) {
    const tokens = themeTokens(id);

    for (const surface of SURFACES) {
      it(`${id} : --ring sur --${surface} ≥ ${FOCUS_CONTRAST}:1`, () => {
        // Un token absent ou translucide fait échouer le test au lieu de le sauter : un anneau
        // translucide est justement le défaut à éviter.
        const ring = parseColor(tokens.get("ring") ?? "");
        const background = parseColor(tokens.get(surface) ?? "");
        expect(ring, `--ring du thème ${id}, opaque`).not.toBeNull();
        expect(background, `--${surface} du thème ${id}, opaque`).not.toBeNull();
        if (!ring || !background) return;
        // Pas d'arrondi : les seuils WCAG sont stricts (2,99:1 échoue).
        expect(contrastRatio(ring, background)).toBeGreaterThanOrEqual(FOCUS_CONTRAST);
      });
    }
  }
});
