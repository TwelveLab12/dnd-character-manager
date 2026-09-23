import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { LocalStorageSpellRepository } from "@/repositories/local-storage/local-storage-spell-repository";
import { makeTestCharacter, makeTestSpell } from "@/test/fixtures";
import { backupSchema } from "./schemas/backup-schema";
import { exportBackupToJson } from "./exporter";

/**
 * Vérifie le scénario cross-environnement visé par le backup combiné (voir
 * docs/adr/0004-json-import-export-open5e-schema.md) : exporter tout, vider le stockage local
 * (simulant un autre navigateur/appareil), réimporter le fichier, et retrouver un état identique.
 */
describe("backup export/import round-trip", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores an identical state after exporting, wiping, and re-importing", async () => {
    const characterRepository = new LocalStorageCharacterRepository();
    const spellRepository = new LocalStorageSpellRepository();

    const character = makeTestCharacter({ id: "yomi", name: "Yomi Tsuki" });
    const spell = makeTestSpell({ id: "fireball" });
    await characterRepository.create(character);
    await spellRepository.upsertMany([spell]);

    // 1. Export.
    const backupJson = exportBackupToJson(
      await characterRepository.list(),
      await spellRepository.list(),
    );

    // 2. Wipe (simule un navigateur/appareil vierge).
    window.localStorage.clear();
    expect(await characterRepository.list()).toEqual([]);
    expect(await spellRepository.list()).toEqual([]);

    // 3. Import.
    const backup = backupSchema.parse(JSON.parse(backupJson));
    await characterRepository.upsertMany(backup.characters);
    await spellRepository.upsertMany(backup.spells);

    // 4. État identique.
    expect(await characterRepository.list()).toEqual([character]);
    expect(await spellRepository.list()).toEqual([spell]);
  });

  it("rejects a backup with an unsupported schemaVersion", () => {
    const malformed = { schemaVersion: 2, exportedAt: "now", characters: [], spells: [] };
    expect(() => backupSchema.parse(malformed)).toThrow();
  });
});
