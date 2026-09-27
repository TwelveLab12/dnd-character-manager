import type { BeastForm } from "@/domain/wild-shape";
import { parseImportEntries } from "./parse-import-entries";
import type { ImportRow } from "./preview-import";
import { previewImport } from "./preview-import";
import { beastFormSchema } from "./schemas/character-schema";
import { slugify } from "./slugify";

/*
 * Import de formes de Forme sauvage (docs/adr/0070) : un tableau de bêtes, ou `{ wildShapeForms:
 * [...] }` (la clé de l'export d'un personnage). Les identifiants absents sont dérivés des noms,
 * pour qu'un même fichier réimporté mette à jour les formes au lieu de les dupliquer.
 */

function withId(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) {
    return raw;
  }
  const record = raw as Record<string, unknown>;
  const hasId = typeof record.id === "string" && record.id.trim() !== "";
  return hasId || typeof record.name !== "string" || record.name.trim() === ""
    ? record
    : { ...record, id: slugify(record.name) };
}

function fillDefaultBeastIds(raw: unknown): unknown {
  const form = withId(raw);
  if (typeof form !== "object" || form === null) {
    return form;
  }
  const record = form as Record<string, unknown>;
  return Array.isArray(record.attacks) ? { ...record, attacks: record.attacks.map(withId) } : form;
}

export function parseBeastFormImportEntries(text: string) {
  return parseImportEntries(text, "wildShapeForms");
}

export function previewBeastFormImport(
  entries: unknown[],
  existing: BeastForm[],
): ImportRow<BeastForm>[] {
  return previewImport(entries, {
    schema: beastFormSchema,
    existing,
    fillDefaults: fillDefaultBeastIds,
  });
}

/** Ajoute les nouvelles formes et remplace celles de même identifiant. */
export function mergeBeastForms(
  existing: BeastForm[],
  imported: BeastForm[],
): { forms: BeastForm[]; added: number; updated: number } {
  const byId = new Map(existing.map((form) => [form.id, form]));
  let added = 0;
  let updated = 0;
  for (const form of imported) {
    if (byId.has(form.id)) {
      updated += 1;
    } else {
      added += 1;
    }
    byId.set(form.id, form);
  }
  return { forms: [...byId.values()], added, updated };
}
