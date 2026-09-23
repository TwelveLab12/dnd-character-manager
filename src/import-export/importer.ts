import type { Spell } from "@/domain/spell";
import { spellSchema } from "./schemas/spell-schema";
import { deepEqual } from "./deep-equal";
import { humanizeZodError } from "./humanize-zod-error";
import { slugify } from "./slugify";

export type SpellImportRowStatus = "new" | "update" | "identical" | "invalid";

export interface SpellImportRow {
  status: SpellImportRowStatus;
  /** Toujours présent : sert d'étiquette de ligne dans la preview, y compris pour une ligne invalide. */
  label: string;
  spell?: Spell;
  errors?: string[];
}

/** Renseigne un id par défaut (slugify du nom) quand le JSON importé n'en fournit pas, avant
 * validation — laisse zod signaler l'erreur si `name` lui-même est absent/invalide plutôt que de
 * produire une erreur d'id dérivé qui masquerait la vraie cause. */
function fillDefaultId(raw: unknown): unknown {
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

function labelFor(raw: unknown): string {
  if (raw && typeof raw === "object" && "name" in raw && typeof raw.name === "string") {
    return raw.name;
  }
  return "(sans nom)";
}

/**
 * Valide chaque entrée indépendamment (un JSON mal formé sur une ligne ne bloque pas les autres)
 * et la classe par rapport aux sorts déjà stockés, pour l'écran de preview d'import. Voir
 * docs/adr/0004-json-import-export-open5e-schema.md.
 */
export function previewSpellImport(
  rawEntries: unknown[],
  existingSpells: Spell[],
): SpellImportRow[] {
  const existingById = new Map(existingSpells.map((spell) => [spell.id, spell]));

  return rawEntries.map((raw) => {
    const label = labelFor(raw);
    const result = spellSchema.safeParse(fillDefaultId(raw));

    if (!result.success) {
      return { status: "invalid", label, errors: humanizeZodError(result.error) };
    }

    const spell = result.data;
    const existing = existingById.get(spell.id);
    if (!existing) {
      return { status: "new", label, spell };
    }
    return { status: deepEqual(existing, spell) ? "identical" : "update", label, spell };
  });
}

/** Détecte le format d'un JSON importé : tableau brut de sorts, ou objet `{ spells: [...] }`
 * (même forme que l'export "backup", voir docs/adr/0004). */
export function parseSpellImportEntries(
  text: string,
): { ok: true; entries: unknown[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      error: `JSON invalide : ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (Array.isArray(parsed)) {
    return { ok: true, entries: parsed };
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    "spells" in parsed &&
    Array.isArray((parsed as { spells: unknown }).spells)
  ) {
    return { ok: true, entries: (parsed as { spells: unknown[] }).spells };
  }
  return {
    ok: false,
    error: "Format inattendu : attendu un tableau de sorts, ou un objet { spells: [...] }.",
  };
}
