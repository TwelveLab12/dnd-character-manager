import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHARACTER_THEMES, isKnownThemeId } from "./theme-registry";

describe("CHARACTER_THEMES", () => {
  const css = readFileSync("src/app/globals.css", "utf8");

  it.each(CHARACTER_THEMES.map((theme) => theme.id))(
    "le thème %s a son bloc de tokens dans globals.css",
    (id) => {
      expect(css).toContain(`[data-theme="${id}"] {`);
    },
  );

  it("reconnaît les thèmes du registre", () => {
    expect(isKnownThemeId("forge-naine")).toBe(true);
    expect(isKnownThemeId("ombreflore")).toBe(true);
    expect(isKnownThemeId("ki-infernal")).toBe(true);
  });
});
