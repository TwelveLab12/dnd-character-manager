import { describe, expect, it } from "vitest";
import { characterPageUrls } from "./character-page-urls";

describe("characterPageUrls", () => {
  it("donne la page de jeu et la page de configuration de chaque personnage", () => {
    expect(characterPageUrls(["a", "b"])).toEqual([
      "/characters/a",
      "/characters/a/edit",
      "/characters/b",
      "/characters/b/edit",
    ]);
  });

  it("dédoublonne et encode les identifiants", () => {
    expect(characterPageUrls(["x y", "x y"])).toEqual([
      "/characters/x%20y",
      "/characters/x%20y/edit",
    ]);
  });

  it("renvoie une liste vide sans personnage", () => {
    expect(characterPageUrls([])).toEqual([]);
  });
});
