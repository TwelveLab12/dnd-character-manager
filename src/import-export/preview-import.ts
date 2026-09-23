import type { ZodType } from "zod";
import { deepEqual } from "./deep-equal";
import { humanizeZodError } from "./humanize-zod-error";

export type ImportRowStatus = "new" | "update" | "identical" | "invalid";

export interface ImportRow<T> {
  status: ImportRowStatus;
  /** Toujours présent : sert d'étiquette de ligne dans la preview, y compris pour une ligne invalide. */
  label: string;
  entity?: T;
  errors?: string[];
}

function defaultLabelFor(raw: unknown): string {
  if (raw && typeof raw === "object" && "name" in raw && typeof raw.name === "string") {
    return raw.name;
  }
  return "(sans nom)";
}

interface PreviewImportOptions<T extends { id: string }> {
  schema: ZodType<T>;
  existing: T[];
  /** Renseigne des valeurs par défaut (ex : id) avant validation — voir fillDefaultSpellId,
   * fillDefaultCharacterId. */
  fillDefaults?: (raw: unknown) => unknown;
  labelFor?: (raw: unknown) => string;
}

/**
 * Valide chaque entrée indépendamment (une entrée mal formée ne bloque pas les autres) et la
 * classe par rapport aux entités déjà stockées, pour l'écran de preview d'import. Partagé entre
 * l'import de sorts et de personnages — voir docs/adr/0004-json-import-export-open5e-schema.md.
 */
export function previewImport<T extends { id: string }>(
  rawEntries: unknown[],
  { schema, existing, fillDefaults, labelFor = defaultLabelFor }: PreviewImportOptions<T>,
): ImportRow<T>[] {
  const existingById = new Map(existing.map((entity) => [entity.id, entity]));

  return rawEntries.map((raw) => {
    const label = labelFor(raw);
    const candidate = fillDefaults ? fillDefaults(raw) : raw;
    const result = schema.safeParse(candidate);

    if (!result.success) {
      return { status: "invalid", label, errors: humanizeZodError(result.error) };
    }

    const entity = result.data;
    const existingEntity = existingById.get(entity.id);
    if (!existingEntity) {
      return { status: "new", label, entity };
    }
    return { status: deepEqual(existingEntity, entity) ? "identical" : "update", label, entity };
  });
}
