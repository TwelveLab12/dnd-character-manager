import type { Character } from "@/domain/character";
import type { Spell } from "@/domain/spell";
import {
  parseCharacterImportEntries,
  previewCharacterImport,
} from "@/import-export/character-importer";
import { parseSpellImportEntries, previewSpellImport } from "@/import-export/importer";
import type { ImportRow } from "@/import-export/preview-import";

/** Sauvegarde de démonstration servie depuis `public/` — voir docs/adr/0072-demo-data.md. */
export const DEMO_BACKUP_URL = "/demo/demo-backup.json";

/** Paramètre d'URL qui charge la démo à l'arrivée (`/?demo=1`), si aucun personnage n'existe. */
export const DEMO_QUERY_PARAM = "demo";

export interface DemoData {
  characters: Character[];
  spells: Spell[];
}

function entitiesOf<T>(rows: ImportRow<T>[]): T[] {
  return rows.flatMap((row) => (row.entity ? [row.entity] : []));
}

/**
 * Passe la sauvegarde de démo par le même pipeline que l'import manuel (validation, migrations),
 * pour qu'elle suive automatiquement l'évolution du schéma.
 */
export function parseDemoBackup(text: string): DemoData {
  const characterEntries = parseCharacterImportEntries(text);
  const spellEntries = parseSpellImportEntries(text);
  if (!characterEntries.ok) {
    throw new Error(characterEntries.error);
  }
  if (!spellEntries.ok) {
    throw new Error(spellEntries.error);
  }
  return {
    characters: entitiesOf(previewCharacterImport(characterEntries.entries, [])),
    spells: entitiesOf(previewSpellImport(spellEntries.entries, [])),
  };
}

export async function fetchDemoData(): Promise<DemoData> {
  const response = await fetch(DEMO_BACKUP_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return parseDemoBackup(await response.text());
}
