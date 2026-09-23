"use client";

import { parseSpellImportEntries, previewSpellImport } from "@/import-export/importer";
import { useSpellStore } from "@/stores/store-provider";
import { ImportDialog } from "@/features/shared/import-dialog";

export function ImportSpellsDialog() {
  const spells = useSpellStore((state) => state.spells);
  const upsertMany = useSpellStore((state) => state.upsertMany);

  return (
    <ImportDialog
      title="Importer des sorts"
      description="Collez du JSON, ou choisissez un fichier — format attendu détaillé dans le modèle téléchargeable depuis la bibliothèque."
      placeholder='[{ "name": "Boule de feu", "level": 3, ... }]'
      parseEntries={parseSpellImportEntries}
      preview={(entries) => previewSpellImport(entries, spells)}
      onImport={upsertMany}
    />
  );
}
