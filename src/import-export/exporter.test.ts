import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestCharacter, makeTestSpell } from "@/test/fixtures";
import { backupSchema } from "./schemas/backup-schema";
import {
  downloadJson,
  exportBackupToJson,
  exportCharactersToJson,
  exportSpellsToJson,
} from "./exporter";

describe("exportSpellsToJson", () => {
  it("serializes spells as JSON that parses back to the same data", () => {
    const spell = makeTestSpell();
    expect(JSON.parse(exportSpellsToJson([spell]))).toEqual([spell]);
  });
});

describe("exportCharactersToJson", () => {
  it("serializes characters as JSON that parses back to the same data", () => {
    const character = makeTestCharacter();
    expect(JSON.parse(exportCharactersToJson([character]))).toEqual([character]);
  });
});

describe("exportBackupToJson", () => {
  it("produces a backup that satisfies backupSchema and contains both resources", () => {
    const character = makeTestCharacter();
    const spell = makeTestSpell();

    const backup = backupSchema.parse(JSON.parse(exportBackupToJson([character], [spell])));

    expect(backup.schemaVersion).toBe(1);
    expect(backup.characters).toEqual([character]);
    expect(backup.spells).toEqual([spell]);
    expect(backup.exportedAt).toEqual(expect.any(String));
  });
});

describe("downloadJson", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("creates and clicks a download link, then revokes the object URL", () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === "a") {
        element.click = clickSpy;
      }
      return element;
    });

    downloadJson("spells.json", "[]");

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
