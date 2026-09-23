import type { Character } from "@/domain/character";
import type { Spell } from "@/domain/spell";
import type { Backup } from "./schemas/backup-schema";

export function exportSpellsToJson(spells: Spell[]): string {
  return JSON.stringify(spells, null, 2);
}

export function exportCharactersToJson(characters: Character[]): string {
  return JSON.stringify(characters, null, 2);
}

/** Export combiné "toutes les données" — voir docs/adr/0004-json-import-export-open5e-schema.md. */
export function exportBackupToJson(characters: Character[], spells: Spell[]): string {
  const backup: Backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    characters,
    spells,
  };
  return JSON.stringify(backup, null, 2);
}

/** Déclenche le téléchargement d'un fichier côté navigateur — aucun accès réseau, tout reste local. */
export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
