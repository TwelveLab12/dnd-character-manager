import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { parseCharacterImportEntries, previewCharacterImport } from "./character-importer";

describe("previewCharacterImport", () => {
  it("classifies a brand new character", () => {
    const [row] = previewCharacterImport([makeTestCharacter({ id: "yomi" })], []);
    expect(row).toMatchObject({ status: "new", label: "Test Character" });
  });

  it("classifies a same-id character with different content as an update", () => {
    const existing = makeTestCharacter({ id: "yomi", level: 3 });
    const [row] = previewCharacterImport([{ ...existing, level: 5 }], [existing]);
    expect(row?.status).toBe("update");
    expect(row?.entity?.level).toBe(5);
  });

  it("generates a random id when absent, never colliding two same-named characters", () => {
    const [rowA] = previewCharacterImport([makeTestCharacter({ name: "Yomi" })], []);
    const { id: _idA, ...withoutIdA } = rowA?.entity ?? makeTestCharacter();
    const [rowB] = previewCharacterImport([{ ...withoutIdA, name: "Yomi" }], []);

    expect(rowA?.entity?.id).toBeDefined();
    expect(rowB?.entity?.id).toBeDefined();
    expect(rowA?.entity?.id).not.toBe(rowB?.entity?.id);
  });

  it("reports a humanized error for an invalid entry without blocking other rows", () => {
    const valid = makeTestCharacter({ id: "yomi" });
    const invalid = { ...makeTestCharacter({ id: "broken" }), level: "not-a-number" };
    const [validRow, invalidRow] = previewCharacterImport([valid, invalid], []);

    expect(validRow?.status).toBe("new");
    expect(invalidRow?.status).toBe("invalid");
    expect(invalidRow?.errors?.[0]).toMatch(/level/);
  });
});

describe("parseCharacterImportEntries", () => {
  it("accepts a { characters: [...] } wrapper", () => {
    const result = parseCharacterImportEntries(JSON.stringify({ characters: [{ name: "A" }] }));
    expect(result).toEqual({ ok: true, entries: [{ name: "A" }] });
  });
});
