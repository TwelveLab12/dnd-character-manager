import type { Spell } from "@/domain/spell";
import { spellSchema } from "./schemas/spell-schema";
import { parseImportEntries } from "./parse-import-entries";
import type { ImportRow } from "./preview-import";
import { previewImport } from "./preview-import";
import { slugify } from "./slugify";

export type SpellImportRow = ImportRow<Spell>;

/** Renseigne un id par défaut (slugify du nom) quand le JSON importé n'en fournit pas, avant
 * validation — laisse zod signaler l'erreur si `name` lui-même est absent/invalide plutôt que de
 * produire une erreur d'id dérivé qui masquerait la vraie cause. */
function fillDefaultSpellId(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) {
    return raw;
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.id === "string" && record.id.trim() !== "") {
    return raw;
  }
  if (typeof record.name !== "string" || record.name.trim() === "") {
    return raw;
  }
  return { ...record, id: slugify(record.name) };
}

export function previewSpellImport(
  rawEntries: unknown[],
  existingSpells: Spell[],
): SpellImportRow[] {
  return previewImport(rawEntries, {
    schema: spellSchema,
    existing: existingSpells,
    fillDefaults: fillDefaultSpellId,
  });
}

export function parseSpellImportEntries(text: string) {
  return parseImportEntries(text, "spells");
}
