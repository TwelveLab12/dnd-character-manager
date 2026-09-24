"use client";

import { FileUp, ScanSearch, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import type { ImportRow } from "@/import-export/preview-import";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ImportRowsTable } from "./import-rows-table";

function hasEntity<T>(row: ImportRow<T>): row is ImportRow<T> & { entity: T } {
  return row.entity !== undefined;
}

export interface ImportDialogProps<T> {
  title: string;
  description: ReactNode;
  triggerLabel?: string;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerSize?: VariantProps<typeof buttonVariants>["size"];
  placeholder?: string;
  parseEntries: (text: string) => { ok: true; entries: unknown[] } | { ok: false; error: string };
  preview: (entries: unknown[]) => ImportRow<T>[];
  onImport: (entities: T[]) => Promise<{ added: number; updated: number; skipped: number }>;
}

/**
 * Dialog d'import JSON générique (coller ou choisir un fichier -> analyser -> preview par ligne
 * New/Update/Identique/Invalide -> importer les lignes valides). Partagé entre sorts et
 * personnages — voir docs/adr/0004-json-import-export-open5e-schema.md.
 */
export function ImportDialog<T>({
  title,
  description,
  triggerLabel = "Importer",
  triggerVariant,
  triggerSize,
  placeholder,
  parseEntries,
  preview,
  onImport,
}: ImportDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ImportRow<T>[] | null>(null);
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
    const result = parseEntries(text);
    if (!result.ok) {
      setParseError(result.error);
      setRows(null);
      return;
    }
    setParseError(null);
    setSummary(null);
    setRows(preview(result.entries));
  }

  const importable = rows?.filter(hasEntity).map((row) => row.entity) ?? [];
  const invalidCount = rows?.filter((row) => row.status === "invalid").length ?? 0;

  async function handleImport() {
    const result = await onImport(importable);
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
        <Button variant={triggerVariant} size={triggerSize}>
          <Upload />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
              placeholder={placeholder}
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
              <FileUp />
              Choisir un fichier
            </Button>
            <Button type="button" onClick={handleAnalyze} disabled={text.trim() === ""}>
              <ScanSearch />
              Analyser
            </Button>
          </div>

          {parseError && (
            <p className="text-destructive text-sm" role="alert">
              {parseError}
            </p>
          )}

          {rows && <ImportRowsTable rows={rows} />}

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
              disabled={importable.length === 0}
            >
              <Upload />
              Importer ({importable.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
