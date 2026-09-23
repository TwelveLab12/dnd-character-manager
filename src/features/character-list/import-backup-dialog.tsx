"use client";

import { useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { humanizeZodError } from "@/import-export/humanize-zod-error";
import { backupSchema } from "@/import-export/schemas/backup-schema";
import { useCharacterStore, useSpellStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Import d'un fichier de sauvegarde combiné (personnages + sorts) — validation du fichier entier
 * d'un coup plutôt qu'une preview ligne par ligne : contrairement à un import de sorts glané de
 * sources externes, un backup est censé être un export généré par cette appli elle-même. Voir
 * docs/adr/0004-json-import-export-open5e-schema.md.
 */
export function ImportBackupDialog() {
  const upsertCharacters = useCharacterStore((state) => state.upsertMany);
  const upsertSpells = useSpellStore((state) => state.upsertMany);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();

  function reset() {
    setText("");
    setError(null);
    setSummary(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setText(typeof reader.result === "string" ? reader.result : "");
      setError(null);
      setSummary(null);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  async function handleImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      setError(
        `JSON invalide : ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      );
      return;
    }

    const result = backupSchema.safeParse(parsed);
    if (!result.success) {
      setError(humanizeZodError(result.error).join(" · "));
      return;
    }

    setError(null);
    const [characterResult, spellResult] = await Promise.all([
      upsertCharacters(result.data.characters),
      upsertSpells(result.data.spells),
    ]);
    setSummary(
      `Personnages : ${characterResult.added} ajouté(s), ${characterResult.updated} mis à jour. ` +
        `Sorts : ${spellResult.added} ajouté(s), ${spellResult.updated} mis à jour.`,
    );
    setText("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Importer une sauvegarde
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer une sauvegarde</DialogTitle>
          <DialogDescription>
            Fichier généré par « Exporter tout » — complète ou met à jour vos personnages et sorts
            avec son contenu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor={textareaId}>JSON</Label>
            <Textarea
              id={textareaId}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setError(null);
                setSummary(null);
              }}
              rows={6}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Choisir un fichier
            </Button>
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          {summary && <p className="text-sm">{summary}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fermer
            </Button>
          </DialogClose>
          <Button type="button" onClick={() => void handleImport()} disabled={text.trim() === ""}>
            Importer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
