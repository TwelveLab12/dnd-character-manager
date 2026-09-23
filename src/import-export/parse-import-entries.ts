/**
 * Détecte le format d'un JSON importé : tableau brut, ou objet `{ [arrayKey]: [...] }` (même
 * forme que l'export "backup", voir docs/adr/0004-json-import-export-open5e-schema.md).
 */
export function parseImportEntries(
  text: string,
  arrayKey: string,
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
    arrayKey in parsed &&
    Array.isArray((parsed as Record<string, unknown>)[arrayKey])
  ) {
    return { ok: true, entries: (parsed as Record<string, unknown>)[arrayKey] as unknown[] };
  }
  return {
    ok: false,
    error: `Format inattendu : attendu un tableau, ou un objet { ${arrayKey}: [...] }.`,
  };
}
