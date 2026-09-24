import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { normalizeLegacyCharacter } from "./normalize-legacy-character";

/** Personnage au format d'origine (v1) : emplacements stockés, pas de classId, compteurs de
 * Canalisation divine par capacité. */
function legacyCleric(overrides: Record<string, unknown> = {}) {
  const {
    classId: _classId,
    spellSlotsUsed: _used,
    classResourcesUsed: _res,
    ...current
  } = makeTestCharacter({ class: "Clerc", level: 3 });
  return {
    ...current,
    spellSlots: [
      { level: 1, total: 4, used: 3 },
      { level: 2, total: 2, used: 0 },
    ],
    features: [
      {
        id: "sanctuary",
        name: "Sanctuaire du Crépuscule",
        source: "Domaine du Crépuscule",
        description: "",
        usesMax: 1,
        usesCurrent: 0,
        recharge: "shortRest",
      },
      {
        id: "turn",
        name: "Renvoi des Morts-Vivants",
        source: "Clerc",
        description: "",
        usesMax: 1,
        usesCurrent: 0,
        recharge: "shortRest",
      },
      { id: "sight", name: "Vision dans le noir", source: "Race", description: "" },
    ],
    ...overrides,
  };
}

describe("normalizeLegacyCharacter", () => {
  it("derives classId from the free class label", () => {
    expect(normalizeLegacyCharacter(legacyCleric())).toMatchObject({ classId: "clerc" });
    expect(normalizeLegacyCharacter(legacyCleric({ class: "cleric" }))).toMatchObject({
      classId: "clerc",
    });
  });

  it("keeps only the used spell slots, dropping stored totals", () => {
    const normalized = normalizeLegacyCharacter(legacyCleric()) as Record<string, unknown>;
    expect(normalized.spellSlotsUsed).toEqual({ "1": 3 });
    expect(normalized).not.toHaveProperty("spellSlots");
  });

  it("links Channel Divinity features to the shared resource and carries over the usage", () => {
    const normalized = normalizeLegacyCharacter(legacyCleric()) as Record<string, unknown>;
    expect(normalized.features).toEqual([
      {
        id: "sanctuary",
        name: "Sanctuaire du Crépuscule",
        source: "Domaine du Crépuscule",
        description: "",
        resourceId: "channel-divinity",
      },
      {
        id: "turn",
        name: "Renvoi des Morts-Vivants",
        source: "Clerc",
        description: "",
        resourceId: "channel-divinity",
      },
      { id: "sight", name: "Vision dans le noir", source: "Race", description: "" },
    ]);
    expect(normalized.classResourcesUsed).toEqual({ "channel-divinity": 1 });
  });

  it("leaves features alone for a non-cleric", () => {
    const normalized = normalizeLegacyCharacter(legacyCleric({ class: "Guerrier" })) as Record<
      string,
      unknown
    >;
    expect(normalized).not.toHaveProperty("classId");
    expect((normalized.features as unknown[])[0]).toMatchObject({ usesMax: 1 });
  });

  it("is idempotent on the current format", () => {
    const current = makeTestCharacter({
      classId: "clerc",
      spellSlotsUsed: { "1": 1 },
      features: [
        {
          id: "turn",
          name: "Renvoi des morts-vivants",
          source: "Clerc",
          description: "",
          resourceId: "channel-divinity",
        },
      ],
    });
    expect(normalizeLegacyCharacter(current)).toEqual(current);
    expect(normalizeLegacyCharacter(normalizeLegacyCharacter(legacyCleric()))).toEqual(
      normalizeLegacyCharacter(legacyCleric()),
    );
  });
});
