"use client";

import {
  parseCharacterImportEntries,
  previewCharacterImport,
} from "@/import-export/character-importer";
import { useCharacterStore } from "@/stores/store-provider";
import { ImportDialog } from "@/features/shared/import-dialog";

export function ImportCharactersDialog() {
  const characters = useCharacterStore((state) => state.characters);
  const upsertMany = useCharacterStore((state) => state.upsertMany);

  return (
    <ImportDialog
      title="Importer des personnages"
      description="Collez du JSON, ou choisissez un fichier — un id absent est généré automatiquement (deux personnages peuvent partager le même nom)."
      triggerLabel="Importer des personnages"
      triggerVariant="ghost"
      triggerSize="sm"
      placeholder='[{ "name": "Yomi Tsuki", "class": "Clerc", ... }]'
      parseEntries={parseCharacterImportEntries}
      preview={(entries) => previewCharacterImport(entries, characters)}
      onImport={upsertMany}
    />
  );
}
