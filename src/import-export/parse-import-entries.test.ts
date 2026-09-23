import { describe, expect, it } from "vitest";
import { parseImportEntries } from "./parse-import-entries";

describe("parseImportEntries", () => {
  it("accepts a bare array", () => {
    const result = parseImportEntries(JSON.stringify([{ name: "A" }]), "spells");
    expect(result).toEqual({ ok: true, entries: [{ name: "A" }] });
  });

  it("accepts an { [arrayKey]: [...] } wrapper", () => {
    const result = parseImportEntries(
      JSON.stringify({ characters: [{ name: "A" }] }),
      "characters",
    );
    expect(result).toEqual({ ok: true, entries: [{ name: "A" }] });
  });

  it("reports a syntax error", () => {
    const result = parseImportEntries("{not json", "spells");
    expect(result.ok).toBe(false);
  });

  it("reports an unexpected shape, naming the expected key", () => {
    const result = parseImportEntries(JSON.stringify({ somethingElse: [] }), "characters");
    expect(result).toEqual({
      ok: false,
      error: "Format inattendu : attendu un tableau, ou un objet { characters: [...] }.",
    });
  });
});
