"use client";

import { useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { CharacterImportRow } from "@/import-export/character-importer";
import {
  parseCharacterImportEntries,
  previewCharacterImport,
} from "@/import-export/character-importer";
import type { SpellImportRow } from "@/import-export/importer";
import { parseSpellImportEntries, previewSpellImport } from "@/import-export/importer";
import type { ImportRow } from "@/import-export/preview-import";
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
import { ImportRowsTable } from "@/features/shared/import-rows-table";

function hasEntity<T>(row: ImportRow<T>): row is ImportRow<T> & { entity: T } {
  return row.entity !== undefined;
}

/**
 * Import d'un fichier de sauvegarde combiné (personnages + sorts) — même flux Analyser -> preview
 * -> Importer que ImportDialog, mais sur deux collections à la fois : réutilise les fonctions déjà
 * testées côté import personnages/sorts (previewCharacterImport, previewSpellImport,
 * parseCharacterImportEntries, parseSpellImportEntries) plutôt qu'une validation du fichier entier
 * d'un bloc, qui empêchait d'importer les personnages valides si un seul sort était invalide. Voir
 * docs/adr/0004-json-import-export-open5e-schema.md.
 */
export function ImportBackupDialog() {
  const characters = useCharacterStore((state) => state.characters);
  const upsertCharacters = useCharacterStore((state) => state.upsertMany);
  const spells = useSpellStore((state) => state.spells);
  const upsertSpells = useSpellStore((state) => state.upsertMany);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [characterRows, setCharacterRows] = useState<CharacterImportRow[] | null>(null);
  const [spellRows, setSpellRows] = useState<SpellImportRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();

  function reset() {
    setText("");
    setCharacterRows(null);
    setSpellRows(null);
    setParseError(null);
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
      setCharacterRows(null);
      setSpellRows(null);
      setParseError(null);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleAnalyze() {
    const characterEntries = parseCharacterImportEntries(text);
    const spellEntries = parseSpellImportEntries(text);

    if (!characterEntries.ok && !spellEntries.ok) {
      setParseError(characterEntries.error);
      setCharacterRows(null);
      setSpellRows(null);
      return;
    }

    setParseError(null);
    setSummary(null);
    setCharacterRows(
      previewCharacterImport(characterEntries.ok ? characterEntries.entries : [], characters),
    );
    setSpellRows(previewSpellImport(spellEntries.ok ? spellEntries.entries : [], spells));
  }

  const importableCharacters = characterRows?.filter(hasEntity).map((row) => row.entity) ?? [];
  const importableSpells = spellRows?.filter(hasEntity).map((row) => row.entity) ?? [];
  const analyzed = characterRows !== null || spellRows !== null;

  async function handleImport() {
    const [characterResult, spellResult] = await Promise.all([
      upsertCharacters(importableCharacters),
      upsertSpells(importableSpells),
    ]);
    setSummary(
      `Personnages : ${characterResult.added} ajouté(s), ${characterResult.updated} mis à jour. ` +
        `Sorts : ${spellResult.added} ajouté(s), ${spellResult.updated} mis à jour.`,
    );
    setCharacterRows(null);
    setSpellRows(null);
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer une sauvegarde</DialogTitle>
          <DialogDescription>
            Fichier généré par « Exporter tout » — complète ou met à jour vos personnages et sorts
            avec son contenu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor={textareaId}>JSON</Label>
            <Textarea
              id={textareaId}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setCharacterRows(null);
                setSpellRows(null);
                setParseError(null);
              }}
              rows={6}
              className="max-h-48 overflow-y-auto font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
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
            <Button type="button" onClick={handleAnalyze} disabled={text.trim() === ""}>
              Analyser
            </Button>
          </div>

          {parseError && (
            <p className="text-destructive text-sm" role="alert">
              {parseError}
            </p>
          )}

          {characterRows && characterRows.length > 0 && (
            <div className="grid gap-1">
              <p className="text-muted-foreground text-xs">Personnages</p>
              <ImportRowsTable rows={characterRows} />
            </div>
          )}
          {spellRows && spellRows.length > 0 && (
            <div className="grid gap-1">
              <p className="text-muted-foreground text-xs">Sorts</p>
              <ImportRowsTable rows={spellRows} />
            </div>
          )}

          {summary && <p className="text-sm">{summary}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fermer
            </Button>
          </DialogClose>
          {analyzed && (
            <Button
              type="button"
              onClick={() => void handleImport()}
              disabled={importableCharacters.length === 0 && importableSpells.length === 0}
            >
              Importer ({importableCharacters.length + importableSpells.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
