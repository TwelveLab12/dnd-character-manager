import { describe, expect, it } from "vitest";
import { characterFeats, findFeatDefinitionInLabel } from "./feat";

describe("findFeatDefinitionInLabel", () => {
  it.each([
    ["Lanceur de sorts de bataille (War Caster)", "lanceur-de-sorts-de-bataille"],
    ["War Caster", "lanceur-de-sorts-de-bataille"],
    ["Robuste", "robuste"],
    ["Tough", "robuste"],
  ])("%s → %s", (label, id) => {
    expect(findFeatDefinitionInLabel(label)?.id).toBe(id);
  });

  it("returns nothing for an unknown feat", () => {
    expect(findFeatDefinitionInLabel("Vigilant")).toBeUndefined();
  });
});

describe("characterFeats", () => {
  it("keeps only registered feats", () => {
    expect(characterFeats(["robuste", "inconnu"]).map((feat) => feat.id)).toEqual(["robuste"]);
    expect(characterFeats(undefined)).toEqual([]);
  });
});
