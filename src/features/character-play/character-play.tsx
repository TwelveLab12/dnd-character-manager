"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCharacterStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterThemeScope } from "@/features/character-theme/character-theme-scope";
import { BackLink } from "@/features/shared/back-link";
import type { PlayTab } from "@/features/shared/character-tabs";
import {
  characterEditHref,
  configTabFor,
  rememberTabInUrl,
  toPlayTab,
} from "@/features/shared/character-tabs";
import { FullscreenToggle } from "@/features/shared/fullscreen-toggle";
import { AbilitiesViewTab } from "./abilities-view-tab";
import { ActivityLogButton } from "./activity-log-sheet";
import { JournalButton } from "./journal-sheet";
import { CombatHud } from "./combat-hud";
import { CombatSummary } from "./combat-summary";
import { InventoryViewTab } from "./inventory-view-tab";
import { NotesViewTab } from "./notes-view-tab";
import { FeaturesViewTab } from "./features-view-tab";
import { SpellsViewTab } from "./spells-view-tab";

export function CharacterPlay({
  characterId,
  initialTab,
}: {
  characterId: string;
  /** Onglet ouvert à l'arrivée (`?tab=`), ex : depuis « Voir la fiche » (docs/adr/0067). */
  initialTab?: string;
}) {
  const [tab, setTab] = useState<PlayTab>(() => toPlayTab(initialTab));
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
        <BackLink />
      </div>
    );
  }

  return (
    <CharacterThemeScope themeId={character.themeId}>
      <div className="bg-card text-card-foreground ring-foreground/10 mx-auto my-8 flex w-full max-w-3xl flex-col gap-6 rounded-2xl px-4 py-8 shadow-2xl ring-1 shadow-black/70 sm:my-12 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1.5">
            <BackLink className="mb-2" />
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <PageTitle className="text-3xl">{character.name}</PageTitle>
              <span aria-hidden className="text-muted-foreground/60 text-xl">
                ·
              </span>
              <span className="text-muted-foreground text-sm">
                niv.{" "}
                <span className="font-heading text-primary text-3xl font-bold tabular-nums">
                  {character.level}
                </span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {character.class}
              {character.subclass ? ` — ${character.subclass}` : ""}
              {character.race ? ` · ${character.race}` : ""}
              {character.background ? ` · ${character.background}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <JournalButton character={character} />
            <ActivityLogButton character={character} />
            <FullscreenToggle />
            <Button type="button" variant="ghost" asChild>
              <Link href={characterEditHref(characterId, configTabFor(tab))} aria-label="Modifier">
                <Pencil />
                <span className="max-sm:sr-only">Modifier</span>
              </Link>
            </Button>
          </div>
        </div>

        <CombatSummary character={character} />

        <Tabs
          value={tab}
          onValueChange={(value) => {
            const next = toPlayTab(value);
            setTab(next);
            rememberTabInUrl(next, "combat");
          }}
        >
          <TabsList className="max-w-full [scrollbar-width:none] justify-start overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="combat">Combat</TabsTrigger>
            <TabsTrigger value="abilities">Caractéristiques</TabsTrigger>
            <TabsTrigger value="spells">Sorts</TabsTrigger>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
            <TabsTrigger value="features">Capacités</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="combat">
            <CombatHud character={character} />
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
          <TabsContent value="notes">
            <NotesViewTab character={character} />
          </TabsContent>
        </Tabs>
      </div>
    </CharacterThemeScope>
  );
}
