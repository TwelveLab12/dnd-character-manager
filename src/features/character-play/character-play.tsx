"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCharacterStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterThemeScope } from "@/features/character-theme/character-theme-scope";
import { AbilitiesViewTab } from "./abilities-view-tab";
import { ConcentrationMarker } from "./concentration-marker";
import { GeneralViewTab } from "./general-view-tab";
import { HitPointsWidget } from "./hit-points-widget";
import { InventoryViewTab } from "./inventory-view-tab";
import { FeaturesViewTab } from "./features-view-tab";
import { RestActions } from "./rest-actions";
import { SpellsViewTab } from "./spells-view-tab";

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
    <CharacterThemeScope themeId={character.themeId}>
      <div className="bg-background text-foreground mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/" className="text-muted-foreground text-sm underline underline-offset-4">
              &larr; Mes personnages
            </Link>
            <PageTitle>{character.name}</PageTitle>
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

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="abilities">Caractéristiques</TabsTrigger>
            <TabsTrigger value="spells">Sorts</TabsTrigger>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
            <TabsTrigger value="features">Capacités</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralViewTab character={character} />
          </TabsContent>
          <TabsContent value="abilities">
            <AbilitiesViewTab character={character} />
          </TabsContent>
          <TabsContent value="spells">
            <SpellsViewTab character={character} />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryViewTab character={character} />
          </TabsContent>
          <TabsContent value="features">
            <FeaturesViewTab character={character} />
          </TabsContent>
        </Tabs>
      </div>
    </CharacterThemeScope>
  );
}
