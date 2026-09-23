"use client";

import { useEffect } from "react";
import { useCharacterStore } from "@/stores/store-provider";
import { CharacterCard } from "./character-card";
import { CreateCharacterDialog } from "./create-character-dialog";

export function CharacterList() {
  const characters = useCharacterStore((state) => state.characters);
  const isLoading = useCharacterStore((state) => state.isLoading);
  const error = useCharacterStore((state) => state.error);
  const load = useCharacterStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Mes personnages</h1>
        <CreateCharacterDialog />
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
