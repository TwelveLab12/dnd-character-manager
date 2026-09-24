import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { parseCharacterImportEntries, previewCharacterImport } from "./character-importer";

describe("previewCharacterImport", () => {
  it("classifies a brand new character", () => {
    const [row] = previewCharacterImport([makeTestCharacter({ id: "elara" })], []);
    expect(row).toMatchObject({ status: "new", label: "Test Character" });
  });

  it("classifies a same-id character with different content as an update", () => {
    const existing = makeTestCharacter({ id: "elara", level: 3 });
    const [row] = previewCharacterImport([{ ...existing, level: 5 }], [existing]);
    expect(row?.status).toBe("update");
    expect(row?.entity?.level).toBe(5);
  });

  it("generates a random id when absent, never colliding two same-named characters", () => {
    const [rowA] = previewCharacterImport([makeTestCharacter({ name: "Elara" })], []);
    const { id: _idA, ...withoutIdA } = rowA?.entity ?? makeTestCharacter();
    const [rowB] = previewCharacterImport([{ ...withoutIdA, name: "Elara" }], []);

    expect(rowA?.entity?.id).toBeDefined();
    expect(rowB?.entity?.id).toBeDefined();
    expect(rowA?.entity?.id).not.toBe(rowB?.entity?.id);
  });

  it("reports a humanized error for an invalid entry without blocking other rows", () => {
    const valid = makeTestCharacter({ id: "elara" });
    const invalid = { ...makeTestCharacter({ id: "broken" }), level: "not-a-number" };
    const [validRow, invalidRow] = previewCharacterImport([valid, invalid], []);

    expect(validRow?.status).toBe("new");
    expect(invalidRow?.status).toBe("invalid");
    expect(invalidRow?.errors?.[0]).toMatch(/level/);
  });

  it("still imports a legacy character with a stored armorClass, dropping the key", () => {
    const legacy = { ...makeTestCharacter({ id: "elara" }), armorClass: 17 };
    const [row] = previewCharacterImport([legacy], []);

    expect(row?.status).toBe("new");
    expect(row?.entity).not.toHaveProperty("armorClass");
  });

  it("imports equipped armor and armor class effects", () => {
    const character = makeTestCharacter({
      id: "elara",
      inventory: [
        {
          id: "chain-mail",
          name: "Cotte de mailles",
          quantity: 1,
          equipped: true,
          armor: { category: "heavy", baseArmorClass: 16, strengthRequirement: 13 },
        },
      ],
      armorProficiencies: ["light", "medium", "heavy", "shield"],
      armorClassEffects: [
        {
          id: "shield-of-faith",
          name: "Bouclier de la foi",
          bonus: 2,
          trigger: { type: "concentration", spellId: "shield-of-faith" },
        },
      ],
    });
    const [row] = previewCharacterImport([character], []);

    expect(row?.status).toBe("new");
    expect(row?.entity?.inventory[0]?.armor?.baseArmorClass).toBe(16);
    expect(row?.entity?.armorClassEffects?.[0]?.trigger.type).toBe("concentration");
  });
});

describe("parseCharacterImportEntries", () => {
  it("accepts a { characters: [...] } wrapper", () => {
    const result = parseCharacterImportEntries(JSON.stringify({ characters: [{ name: "A" }] }));
    expect(result).toEqual({ ok: true, entries: [{ name: "A" }] });
  });
});
