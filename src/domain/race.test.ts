import { describe, expect, it } from "vitest";
import { findRaceDefinition } from "./race";

describe("findRaceDefinition", () => {
  it("finds a known race by id", () => {
    expect(findRaceDefinition("humain-variant")?.name).toBe("Humain variant");
  });

  it("returns undefined for an unknown id", () => {
    expect(findRaceDefinition("inconnue")).toBeUndefined();
  });
});
