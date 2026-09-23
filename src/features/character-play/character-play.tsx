"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCharacterStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import { ConcentrationMarker } from "./concentration-marker";
import { FeaturesUsageList } from "./features-usage-list";
import { HitPointsWidget } from "./hit-points-widget";
import { PreparedSpellsList } from "./prepared-spells-list";
import { RestActions } from "./rest-actions";

export function CharacterPlay({ characterId }: { characterId: string }) {
  const characters = useCharacterStore((state) => state.characters);
  const isLoading = useCharacterStore((state) => state.isLoading);
  const load = useCharacterStore((state) => state.load);

  const character = characters.find((existing) => existing.id === characterId) ?? null;

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading && !character) {
    return <p className="text-muted-foreground p-6 text-sm">Chargement…</p>;
  }

  if (!character) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <p className="text-sm">Personnage introuvable.</p>
        <Link href="/" className="text-primary text-sm underline underline-offset-4">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/" className="text-muted-foreground text-sm underline underline-offset-4">
            &larr; Mes personnages
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{character.name}</h1>
          <p className="text-muted-foreground text-sm">
            {character.class}
            {character.subclass ? ` — ${character.subclass}` : ""} · Niveau {character.level}
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link href={`/characters/${characterId}/edit`}>Configurer</Link>
        </Button>
      </div>

      <HitPointsWidget character={character} />

      <div className="flex flex-wrap items-center gap-2">
        <ConcentrationMarker character={character} />
        <RestActions characterId={characterId} />
      </div>

      <PreparedSpellsList character={character} />
      <FeaturesUsageList character={character} />
    </div>
  );
}
