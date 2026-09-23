"use client";

import Link from "next/link";
import { useEffect } from "react";
import { downloadJson, exportBackupToJson, exportCharactersToJson } from "@/import-export/exporter";
import { useCharacterStore, useSpellStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "./character-card";
import { CreateCharacterDialog } from "./create-character-dialog";
import { ImportBackupDialog } from "./import-backup-dialog";
import { ImportCharactersDialog } from "./import-characters-dialog";

export function CharacterList() {
  const characters = useCharacterStore((state) => state.characters);
  const isLoading = useCharacterStore((state) => state.isLoading);
  const error = useCharacterStore((state) => state.error);
  const load = useCharacterStore((state) => state.load);

  const spells = useSpellStore((state) => state.spells);
  const loadSpells = useSpellStore((state) => state.load);

  useEffect(() => {
    void load();
    void loadSpells();
  }, [load, loadSpells]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Mes personnages</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/spells">Bibliothèque de sorts</Link>
          </Button>
          <CreateCharacterDialog />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <span className="text-muted-foreground mr-1 text-sm">Données :</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={characters.length === 0}
          onClick={() => downloadJson("personnages.json", exportCharactersToJson(characters))}
        >
          Exporter personnages
        </Button>
        <ImportCharactersDialog />
        <span className="bg-border mx-1 h-4 w-px" aria-hidden="true" />
        <Button
          variant="ghost"
          size="sm"
          disabled={characters.length === 0 && spells.length === 0}
          onClick={() => downloadJson("sauvegarde.json", exportBackupToJson(characters, spells))}
        >
          Exporter tout (sauvegarde)
        </Button>
        <ImportBackupDialog />
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          Impossible de charger les personnages : {error}
        </p>
      )}

      {isLoading && characters.length === 0 && !error && (
        <p className="text-muted-foreground text-sm">Chargement…</p>
      )}

      {!isLoading && characters.length === 0 && !error && (
        <p className="text-muted-foreground text-sm">
          Aucun personnage pour l&rsquo;instant. Créez-en un pour commencer.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}
