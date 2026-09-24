"use client";

import { ArrowLeft, Eye, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";
import type { Character } from "@/domain/character";
import { useCharacterStore } from "@/stores/store-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterThemeScope } from "@/features/character-theme/character-theme-scope";
import { AbilitiesTab } from "./abilities-tab";
import { FeaturesTab } from "./features-tab";
import { GeneralTab } from "./general-tab";
import { InventoryTab } from "./inventory-tab";
import { SpellsTab } from "./spells-tab";

export function CharacterSheet({ characterId }: { characterId: string }) {
  const characters = useCharacterStore((state) => state.characters);
  const isLoading = useCharacterStore((state) => state.isLoading);
  const load = useCharacterStore((state) => state.load);
  const update = useCharacterStore((state) => state.update);
  const router = useRouter();

  const character = characters.find((existing) => existing.id === characterId) ?? null;

  // Le brouillon local est réinitialisé au rendu quand on change de personnage (ou quand il
  // devient disponible après le chargement async) — pas dans un useEffect, pour éviter le
  // double rendu que provoquerait un setState synchrone dans un effet. Voir
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [draftForId, setDraftForId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Character | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  // Destination en attente quand on tente de quitter avec des modifications non enregistrées.
  const [pendingHref, setPendingHref] = useState<string | null>(null);

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

  async function handleSaveAndLeave() {
    if (!pendingHref) {
      return;
    }
    await handleSave();
    router.push(pendingHref);
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(character);

  // Garde de sortie : sans modification, le lien navigue normalement ; sinon on intercepte le
  // clic pour proposer d'enregistrer plutôt que de perdre le brouillon en silence.
  function guardNavigation(href: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      setPendingHref(href);
    };
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

  const sheetHref = `/characters/${characterId}`;

  return (
    <CharacterThemeScope themeId={draft.themeId}>
      <div className="bg-card text-card-foreground ring-foreground/10 mx-auto my-8 flex w-full max-w-3xl flex-col gap-6 rounded-2xl px-6 py-10 shadow-2xl ring-1 shadow-black/70 sm:my-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/"
              onClick={guardNavigation("/")}
              className="text-muted-foreground inline-flex items-center gap-1 text-sm underline underline-offset-4"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Mes personnages
            </Link>
            <PageTitle>{draft.name}</PageTitle>
          </div>
          <div className="flex items-center gap-3">
            {justSaved && <span className="text-muted-foreground text-xs">Enregistré</span>}
            <Button type="button" variant="ghost" asChild>
              <Link href={sheetHref} onClick={guardNavigation(sheetHref)}>
                <Eye />
                Voir la fiche
              </Link>
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              <Save />
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>

        <AlertDialog
          open={pendingHref !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPendingHref(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
              <AlertDialogDescription>
                Vous avez modifié {draft.name} sans enregistrer. Que voulez-vous faire avant de
                quitter cette page ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  if (pendingHref) {
                    router.push(pendingHref);
                  }
                }}
              >
                Quitter sans enregistrer
              </Button>
              <AlertDialogAction onClick={() => void handleSaveAndLeave()} disabled={isSaving}>
                Enregistrer et quitter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="abilities">Caractéristiques</TabsTrigger>
            <TabsTrigger value="spells">Sorts</TabsTrigger>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
            <TabsTrigger value="features">Capacités</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralTab draft={draft} onChange={handleChange} />
          </TabsContent>
          <TabsContent value="abilities">
            <AbilitiesTab draft={draft} onChange={handleChange} />
          </TabsContent>
          <TabsContent value="spells">
            <SpellsTab draft={draft} onChange={handleChange} />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryTab draft={draft} onChange={handleChange} />
          </TabsContent>
          <TabsContent value="features">
            <FeaturesTab draft={draft} onChange={handleChange} />
          </TabsContent>
        </Tabs>
      </div>
    </CharacterThemeScope>
  );
}
