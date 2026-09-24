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

  it("does not link a feature that only names the pool itself", () => {
    const legacy = legacyCleric();
    const normalized = normalizeLegacyCharacter({
      ...legacy,
      features: [
        {
          id: "pool",
          name: "Canalisation Divine",
          source: "Clerc",
          description: "",
          usesMax: 1,
          usesCurrent: 1,
          recharge: "shortRest",
        },
        ...(legacy.features as unknown[]),
      ],
    }) as Record<string, unknown>;
    const [pool, sanctuary] = normalized.features as Record<string, unknown>[];
    expect(pool).not.toHaveProperty("resourceId");
    expect(pool).toMatchObject({ usesMax: 1 });
    expect(sanctuary).toMatchObject({ resourceId: "channel-divinity" });
  });

  it("never re-links features of a character already in the current format", () => {
    const current = makeTestCharacter({
      classId: "clerc",
      features: [
        {
          id: "pool",
          name: "Canalisation divine (réserve)",
          source: "Clerc",
          description: "",
        },
        { id: "turn", name: "Renvoi des morts-vivants", source: "Clerc", description: "" },
      ],
    });
    expect(normalizeLegacyCharacter(current)).toEqual(current);
  });

  it("derives subclassId from the free subclass label within the known class", () => {
    expect(
      normalizeLegacyCharacter({
        ...makeTestCharacter({ classId: "clerc" }),
        subclass: "Domaine du Crépuscule",
      }),
    ).toMatchObject({ subclassId: "crepuscule" });
    expect(
      normalizeLegacyCharacter({ ...makeTestCharacter(), subclass: "Domaine du Crépuscule" }),
    ).not.toHaveProperty("subclassId");
  });

  it("converts the stored initiative total into an extra bonus beyond Dexterity", () => {
    const base = legacyCleric();
    // Dex 10 (+0) : un total de -1 n'est pas explicable par la Dextérité → bonus -1 conservé.
    expect(normalizeLegacyCharacter({ ...base, initiativeBonus: -1 })).toMatchObject({
      initiativeExtraBonus: -1,
    });
    const plain = normalizeLegacyCharacter({ ...base, initiativeBonus: 0 }) as Record<
      string,
      unknown
    >;
    expect(plain).not.toHaveProperty("initiativeBonus");
    expect(plain).not.toHaveProperty("initiativeExtraBonus");
  });

  it("drops the stored speed for a known race, keeps it as baseSpeed otherwise", () => {
    const base = legacyCleric();
    const known = normalizeLegacyCharacter({
      ...base,
      speed: 9,
      raceSelection: { raceId: "humain-variant", abilityBonusChoices: [] },
    }) as Record<string, unknown>;
    expect(known).not.toHaveProperty("speed");
    expect(known).not.toHaveProperty("baseSpeed");
    expect(normalizeLegacyCharacter({ ...base, speed: 7.5 })).toMatchObject({ baseSpeed: 7.5 });
  });

  it("keeps only the saving throws not granted by the class", () => {
    expect(
      normalizeLegacyCharacter({
        ...legacyCleric(),
        savingThrowProficiencies: ["wisdom", "charisma", "constitution"],
      }),
    ).toMatchObject({ savingThrowProficiencies: ["constitution"] });
  });
});
