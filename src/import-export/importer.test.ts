import { describe, expect, it } from "vitest";
import { makeTestSpell } from "@/test/fixtures";
import { parseSpellImportEntries, previewSpellImport } from "./importer";

describe("previewSpellImport", () => {
  it("classifies a brand new spell", () => {
    const [row] = previewSpellImport([makeTestSpell({ id: "fireball" })], []);
    expect(row).toMatchObject({ status: "new", label: "Test Spell" });
  });

  it("classifies an identical spell as such regardless of key order", () => {
    const existing = makeTestSpell({ id: "fireball" });
    const reordered = { ...existing, name: existing.name }; // same content, JS key order differs from a literal
    const [row] = previewSpellImport([reordered], [existing]);
    expect(row?.status).toBe("identical");
  });

  it("classifies a same-id spell with different content as an update", () => {
    const existing = makeTestSpell({ id: "fireball", level: 3 });
    const [row] = previewSpellImport([{ ...existing, level: 5 }], [existing]);
    expect(row?.status).toBe("update");
    expect(row?.spell?.level).toBe(5);
  });

  it("derives the id from the name when absent", () => {
    const { id: _id, ...withoutId } = makeTestSpell({ name: "Fire Bolt" });
    const [row] = previewSpellImport([withoutId], []);
    expect(row?.spell?.id).toBe("fire-bolt");
  });

  it("reports a humanized error for an invalid entry without blocking other rows", () => {
    const valid = makeTestSpell({ id: "shield" });
    const invalid = { name: "Broken Spell", level: "not-a-number" };
    const [validRow, invalidRow] = previewSpellImport([valid, invalid], []);

    expect(validRow?.status).toBe("new");
    expect(invalidRow?.status).toBe("invalid");
    expect(invalidRow?.errors?.[0]).toMatch(/level/);
  });
});

describe("parseSpellImportEntries", () => {
  it("accepts a bare array", () => {
    const result = parseSpellImportEntries(JSON.stringify([{ name: "A" }]));
    expect(result).toEqual({ ok: true, entries: [{ name: "A" }] });
  });

  it("accepts a { spells: [...] } wrapper", () => {
    const result = parseSpellImportEntries(JSON.stringify({ spells: [{ name: "A" }] }));
    expect(result).toEqual({ ok: true, entries: [{ name: "A" }] });
  });

  it("reports a syntax error", () => {
    const result = parseSpellImportEntries("{not json");
    expect(result.ok).toBe(false);
  });

  it("reports an unexpected shape", () => {
    const result = parseSpellImportEntries(JSON.stringify({ characters: [] }));
    expect(result.ok).toBe(false);
  });
});
