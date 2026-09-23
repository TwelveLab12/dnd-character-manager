import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { previewCharacterImport } from "./character-importer";
import { previewSpellImport } from "./importer";
import { backupSchema } from "./schemas/backup-schema";

/**
 * Les modèles JSON téléchargeables depuis l'UI (public/templates/) doivent toujours rester
 * valides contre les schémas actuels — sans ce test, une évolution de schéma pourrait les rendre
 * obsolètes sans que personne ne s'en aperçoive avant qu'un utilisateur ne bute dessus.
 *
 * spells-import-template.json / character-import-template.json sont validés via le même chemin
 * que l'UI réelle (previewSpellImport/previewCharacterImport, qui comblent un id absent) —
 * contrairement à backup-template.json, importé tel quel sans complétion, donc validé directement
 * contre backupSchema (ids explicites requis).
 */
const templatesDir = join(process.cwd(), "public", "templates");

function readTemplate(filename: string): unknown {
  return JSON.parse(readFileSync(join(templatesDir, filename), "utf-8"));
}

describe("public/templates", () => {
  it("spells-import-template.json imports cleanly (no invalid row)", () => {
    const entries = readTemplate("spells-import-template.json");
    expect(Array.isArray(entries)).toBe(true);
    const rows = previewSpellImport(entries as unknown[], []);
    expect(rows.every((row) => row.status !== "invalid")).toBe(true);
  });

  it("character-import-template.json imports cleanly (no invalid row)", () => {
    const entries = readTemplate("character-import-template.json");
    expect(Array.isArray(entries)).toBe(true);
    const rows = previewCharacterImport(entries as unknown[], []);
    expect(rows.every((row) => row.status !== "invalid")).toBe(true);
  });

  it("backup-template.json validates against backupSchema", () => {
    const backup = readTemplate("backup-template.json");
    expect(() => backupSchema.parse(backup)).not.toThrow();
  });
});
