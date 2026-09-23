import type { Character } from "@/domain/character";
import { generateId } from "@/domain/id";
import { characterSchema } from "./schemas/character-schema";
import { parseImportEntries } from "./parse-import-entries";
import type { ImportRow } from "./preview-import";
import { previewImport } from "./preview-import";

export type CharacterImportRow = ImportRow<Character>;

/** Renseigne un id par défaut (généré, pas dérivé du nom) quand le JSON importé n'en fournit pas
 * — contrairement aux sorts, deux personnages peuvent légitimement partager le même nom, un id
 * dérivé du nom collisionnerait à tort. */
function fillDefaultCharacterId(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) {
    return raw;
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.id === "string" && record.id.trim() !== "") {
    return raw;
  }
  return { ...record, id: generateId() };
}

export function previewCharacterImport(
  rawEntries: unknown[],
  existingCharacters: Character[],
): CharacterImportRow[] {
  return previewImport(rawEntries, {
    schema: characterSchema,
    existing: existingCharacters,
    fillDefaults: fillDefaultCharacterId,
  });
}

export function parseCharacterImportEntries(text: string) {
  return parseImportEntries(text, "characters");
}
