import type { Spell } from "@/domain/spell";

export function exportSpellsToJson(spells: Spell[]): string {
  return JSON.stringify(spells, null, 2);
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
