import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseCharacterImportEntries,
  previewCharacterImport,
} from "@/import-export/character-importer";
import { parseSpellImportEntries, previewSpellImport } from "@/import-export/importer";
import { parseDemoBackup } from "./demo-data";

const demoText = readFileSync(join(process.cwd(), "public/demo/demo-backup.json"), "utf8");

describe("demo backup", () => {
  it("imports every character and spell without an invalid row", () => {
    const characters = parseCharacterImportEntries(demoText);
    const spells = parseSpellImportEntries(demoText);
    if (!characters.ok || !spells.ok) throw new Error("demo backup is not parseable");

    const rows = [
      ...previewCharacterImport(characters.entries, []),
      ...previewSpellImport(spells.entries, []),
    ];
    expect(rows.filter((row) => row.status === "invalid")).toEqual([]);

    const demo = parseDemoBackup(demoText);
    expect(demo.characters).toHaveLength(4);
    expect(demo.spells.length).toBeGreaterThan(100);
  });

  it("prefixes every id so it never overwrites a player's own data", () => {
    const { characters, spells } = parseDemoBackup(demoText);
    for (const entity of [...characters, ...spells]) {
      expect(entity.id).toMatch(/^demo-/);
    }
  });

  it("only references spells shipped in the demo", () => {
    const { characters, spells } = parseDemoBackup(demoText);
    const spellIds = new Set(spells.map((spell) => spell.id));
    for (const character of characters) {
      const references = [
        ...character.knownSpellIds,
        ...character.preparedSpellIds,
        ...(character.spellTags ?? []).map((tag) => tag.spellId),
      ];
      for (const id of references) {
        expect(spellIds.has(id), `${character.name} → ${id}`).toBe(true);
      }
    }
  });
});
