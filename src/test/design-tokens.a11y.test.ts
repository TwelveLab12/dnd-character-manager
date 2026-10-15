// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseColor, readThemes } from "./contrast";

// Design-token contrast, checked where colours are defined instead of page by page.
// WCAG 1.4.3 / RGAA 3.2: text ≥ 4.5:1. WCAG 1.4.11 / RGAA 3.3: focus indicator ≥ 3:1.
const css = fs.readFileSync(path.resolve("src/app/globals.css"), "utf8");
const themes = readThemes(css);

type Pair = { fg: string; bg: string; min: number };

// Every `--x-foreground` is text meant to sit on `--x`, plus the pairs used across the UI.
// Add the project's own pairs below (token names without `--`, e.g. a custom palette defined in
// `@theme`: { fg: "color-danger", bg: "color-paper", min: 4.5 }). Missing tokens are ignored.
function pairsFor(tokens: Map<string, string>): Pair[] {
  const pairs: Pair[] = [...tokens.keys()]
    .filter((name) => name.endsWith("-foreground") && tokens.has(name.slice(0, -11)))
    .map((name) => ({ fg: name, bg: name.slice(0, -11), min: 4.5 }));
  const extra: Pair[] = [
    { fg: "foreground", bg: "background", min: 4.5 },
    { fg: "muted-foreground", bg: "background", min: 4.5 },
    { fg: "destructive", bg: "background", min: 4.5 },
    // Focus indicator and form field borders: non-text contrast (WCAG 1.4.11, RGAA 3.3).
    { fg: "ring", bg: "background", min: 3 },
  ];
  return [...pairs, ...extra.filter((p) => tokens.has(p.fg) && tokens.has(p.bg))];
}

describe("design tokens contrast", () => {
  it("finds colour pairs to check", () => {
    expect(themes.size).toBeGreaterThan(0);
  });

  for (const [theme, tokens] of themes) {
    for (const { fg, bg, min } of pairsFor(tokens)) {
      const [fgColor, bgColor] = [
        parseColor(tokens.get(fg) ?? ""),
        parseColor(tokens.get(bg) ?? ""),
      ];
      // Translucent or unsupported values can't be judged here: the e2e axe check covers them.
      it.skipIf(!fgColor || !bgColor)(`${theme} --${fg} on --${bg} ≥ ${min}:1`, () => {
        if (!fgColor || !bgColor) return;
        // No rounding: WCAG thresholds are strict (4.49:1 fails).
        expect(contrastRatio(fgColor, bgColor)).toBeGreaterThanOrEqual(min);
      });
    }
  }
});
