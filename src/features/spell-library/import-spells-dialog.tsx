"use client";

import { useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Spell } from "@/domain/spell";
import type { SpellImportRow } from "@/import-export/importer";
import { parseSpellImportEntries, previewSpellImport } from "@/import-export/importer";
import { useSpellStore } from "@/stores/store-provider";
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

const STATUS_LABELS: Record<SpellImportRow["status"], string> = {
  new: "Nouveau",
  update: "Mise à jour",
  identical: "Identique",
  invalid: "Invalide",
};

function hasSpell(row: SpellImportRow): row is SpellImportRow & { spell: Spell } {
  return row.spell !== undefined;
}

export function ImportSpellsDialog() {
  const spells = useSpellStore((state) => state.spells);
  const upsertMany = useSpellStore((state) => state.upsertMany);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<SpellImportRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();

  function reset() {
    setText("");
    setRows(null);
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
      setRows(null);
      setParseError(null);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleAnalyze() {
    const result = parseSpellImportEntries(text);
    if (!result.ok) {
      setParseError(result.error);
      setRows(null);
      return;
    }
    setParseError(null);
    setSummary(null);
    setRows(previewSpellImport(result.entries, spells));
  }

  const importableSpells = rows?.filter(hasSpell).map((row) => row.spell) ?? [];
  const invalidCount = rows?.filter((row) => row.status === "invalid").length ?? 0;

  async function handleImport() {
    const result = await upsertMany(importableSpells);
    setSummary(
      `${result.added} ajouté(s), ${result.updated} mis à jour` +
        (invalidCount > 0 ? `, ${invalidCount} ignoré(s) (invalide(s))` : ""),
    );
    setRows(null);
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
        <Button>Importer</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des sorts</DialogTitle>
          <DialogDescription>
            Collez du JSON, ou choisissez un fichier — format attendu détaillé dans le modèle
            téléchargeable depuis la bibliothèque.
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
                setRows(null);
                setParseError(null);
              }}
              rows={8}
              placeholder='[{ "name": "Boule de feu", "level": 3, ... }]'
              className="font-mono text-xs"
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

          {rows && (
            <div className="max-h-64 overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.label}-${index}`} className="border-b last:border-0">
                      <td className="p-2 font-medium">{row.label}</td>
                      <td className="p-2">
                        <span
                          className={
                            row.status === "invalid" ? "text-destructive" : "text-muted-foreground"
                          }
                        >
                          {STATUS_LABELS[row.status]}
                        </span>
                        {row.errors && (
                          <ul className="text-destructive mt-1 list-disc pl-4 text-xs">
                            {row.errors.map((message, messageIndex) => (
                              <li key={messageIndex}>{message}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          {rows && (
            <Button
              type="button"
              onClick={() => void handleImport()}
              disabled={importableSpells.length === 0}
            >
              Importer ({importableSpells.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
