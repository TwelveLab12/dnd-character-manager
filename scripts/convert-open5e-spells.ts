/**
 * Convertit un export brut de l'API open5e (v1 ou v2 — tableau JSON, ou objet
 * `{ results: [...] }`/`{ spells: [...] }`) vers le schéma canonique de sorts de l'application.
 * Utilitaire manuel, exécuté à la main, PAS lancé en CI — voir
 * docs/adr/0004-json-import-export-open5e-schema.md.
 *
 * Usage : pnpm tsx scripts/convert-open5e-spells.ts <entree.json> <sortie.json>
 */
import { readFile, writeFile } from "node:fs/promises";
import { mapOpen5eSpell } from "../src/import-export/open5e-adapter";

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error("Usage: pnpm tsx scripts/convert-open5e-spells.ts <entree.json> <sortie.json>");
    process.exitCode = 1;
    return;
  }

  const raw: unknown = JSON.parse(await readFile(inputPath, "utf-8"));
  const entries: unknown[] = Array.isArray(raw)
    ? raw
    : ((raw as { results?: unknown[]; spells?: unknown[] } | null)?.results ??
      (raw as { results?: unknown[]; spells?: unknown[] } | null)?.spells ??
      []);

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(
      "Fichier d'entrée inattendu : ni tableau, ni { results: [...] } / { spells: [...] } non vide.",
    );
  }

  const spells = entries.map((entry, index) => {
    try {
      return mapOpen5eSpell(entry);
    } catch (error) {
      throw new Error(
        `Entrée ${index} : ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  await writeFile(outputPath, JSON.stringify(spells, null, 2), "utf-8");
  console.log(`${spells.length} sort(s) converti(s) -> ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
