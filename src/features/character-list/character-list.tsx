"use client";

import { BookOpen, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCharacterStore, useCharacterStoreApi, useSpellStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { FullscreenToggle } from "@/features/shared/fullscreen-toggle";
import { useHasUnseenChangelog } from "@/features/changelog/use-changelog-seen";
import { CharacterCard } from "./character-card";
import { CreateCharacterDialog } from "./create-character-dialog";
import { DataPanel } from "./data-panel";
import { DEMO_QUERY_PARAM, fetchDemoData } from "./demo-data";

export function CharacterList() {
  const characters = useCharacterStore((state) => state.characters);
  const isLoading = useCharacterStore((state) => state.isLoading);
  const error = useCharacterStore((state) => state.error);
  const load = useCharacterStore((state) => state.load);

  const loadSpells = useSpellStore((state) => state.load);
  const upsertCharacters = useCharacterStore((state) => state.upsertMany);
  const upsertSpells = useSpellStore((state) => state.upsertMany);
  const hasUnseenChangelog = useHasUnseenChangelog();

  const characterStoreApi = useCharacterStoreApi();
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const loadDemo = useCallback(async () => {
    setIsLoadingDemo(true);
    setDemoError(null);
    try {
      const demo = await fetchDemoData();
      await Promise.all([upsertCharacters(demo.characters), upsertSpells(demo.spells)]);
    } catch (cause) {
      setDemoError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsLoadingDemo(false);
    }
  }, [upsertCharacters, upsertSpells]);

  useEffect(() => {
    // `/?demo=1` (lien depuis le portfolio) : lu une seule fois et retiré de l'URL. La démo n'est
    // chargée qu'après le premier chargement, et seulement si le navigateur n'a encore aucun
    // personnage — on ne touche jamais aux données d'un joueur.
    const url = new URL(window.location.href);
    const wantsDemo = url.searchParams.has(DEMO_QUERY_PARAM);
    if (wantsDemo) {
      url.searchParams.delete(DEMO_QUERY_PARAM);
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }

    void Promise.all([load(), loadSpells()]).then(() => {
      const { characters: loaded, error: loadError } = characterStoreApi.getState();
      if (wantsDemo && loaded.length === 0 && !loadError) {
        void loadDemo();
      }
    });
  }, [load, loadSpells, characterStoreApi, loadDemo]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Mes personnages</PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <FullscreenToggle />
          <Button variant="outline" asChild>
            <Link href="/spells">
              <BookOpen />
              Bibliothèque de sorts
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/changelog" className="relative">
              <Sparkles />
              Nouveautés
              {hasUnseenChangelog && (
                <>
                  <span className="sr-only"> (non lues)</span>
                  <span
                    aria-hidden
                    className="bg-primary ring-background absolute -top-1 -right-1 size-2.5 rounded-full ring-2"
                  />
                </>
              )}
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
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground text-sm">
            Aucun personnage pour l&rsquo;instant. Créez-en un pour commencer, ou découvrez
            l&rsquo;application avec quatre personnages de niveau 3.
          </p>
          <Button variant="outline" onClick={() => void loadDemo()} disabled={isLoadingDemo}>
            <Wand2 />
            {isLoadingDemo ? "Chargement de la démo…" : "Charger les personnages de démo"}
          </Button>
          {demoError && (
            <p className="text-destructive text-sm" role="alert">
              Impossible de charger la démo : {demoError}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}
