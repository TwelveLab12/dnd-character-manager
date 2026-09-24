"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useCharacterStore, useSpellStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { CharacterCard } from "./character-card";
import { CreateCharacterDialog } from "./create-character-dialog";
import { DataPanel } from "./data-panel";

export function CharacterList() {
  const characters = useCharacterStore((state) => state.characters);
  const isLoading = useCharacterStore((state) => state.isLoading);
  const error = useCharacterStore((state) => state.error);
  const load = useCharacterStore((state) => state.load);

  const loadSpells = useSpellStore((state) => state.load);

  useEffect(() => {
    void load();
    void loadSpells();
  }, [load, loadSpells]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Mes personnages</PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/spells">
              <BookOpen />
              Bibliothèque de sorts
            </Link>
          </Button>
          <DataPanel />
          <CreateCharacterDialog />
        </div>
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
