"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Character } from "@/domain/character";
import { useCharacterStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AbilitiesTab } from "./abilities-tab";
import { GeneralTab } from "./general-tab";

export function CharacterSheet({ characterId }: { characterId: string }) {
  const characters = useCharacterStore((state) => state.characters);
  const isLoading = useCharacterStore((state) => state.isLoading);
  const load = useCharacterStore((state) => state.load);
  const update = useCharacterStore((state) => state.update);

  const character = characters.find((existing) => existing.id === characterId) ?? null;

  // Le brouillon local est réinitialisé au rendu quand on change de personnage (ou quand il
  // devient disponible après le chargement async) — pas dans un useEffect, pour éviter le
  // double rendu que provoquerait un setState synchrone dans un effet. Voir
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [draftForId, setDraftForId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Character | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  if (character && draftForId !== characterId) {
    setDraftForId(characterId);
    setDraft(character);
    setJustSaved(false);
  }

  useEffect(() => {
    void load();
  }, [load]);

  function handleChange(patch: Partial<Character>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setJustSaved(false);
  }

  async function handleSave() {
    if (!draft) {
      return;
    }
    setIsSaving(true);
    try {
      const updated = await update(draft.id, draft);
      setDraft(updated);
      setJustSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading && !character) {
    return <p className="text-muted-foreground p-6 text-sm">Chargement…</p>;
  }

  if (!character || !draft) {
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
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-muted-foreground text-sm underline underline-offset-4">
            &larr; Mes personnages
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{draft.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {justSaved && <span className="text-muted-foreground text-xs">Enregistré</span>}
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="abilities">Caractéristiques</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralTab draft={draft} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="abilities">
          <AbilitiesTab draft={draft} onChange={handleChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
