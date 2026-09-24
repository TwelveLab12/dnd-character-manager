"use client";

import { ArrowDownUp, Download, Upload, type LucideIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { downloadJson, exportBackupToJson, exportCharactersToJson } from "@/import-export/exporter";
import { useCharacterStore, useSpellStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ImportBackupDialog } from "./import-backup-dialog";
import { ImportCharactersDialog } from "./import-characters-dialog";

type ActiveImport = "characters" | "backup" | null;

/**
 * Panneau latéral regroupant imports et exports. Choisir un import ferme le panneau avant
 * d'ouvrir la fenêtre d'import, pour n'avoir qu'une couche modale à la fois.
 */
export function DataPanel() {
  const characters = useCharacterStore((state) => state.characters);
  const spells = useSpellStore((state) => state.spells);

  const [panelOpen, setPanelOpen] = useState(false);
  const [activeImport, setActiveImport] = useState<ActiveImport>(null);

  function openImport(kind: Exclude<ActiveImport, null>) {
    setPanelOpen(false);
    setActiveImport(kind);
  }

  function closeImport(open: boolean) {
    if (!open) {
      setActiveImport(null);
    }
  }

  return (
    <>
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <ArrowDownUp />
            Import / Export
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Import / Export</SheetTitle>
            <SheetDescription>
              Vos données sont stockées uniquement dans ce navigateur : exportez-les régulièrement
              pour les sauvegarder ou les transférer.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
            <PanelSection title="Personnages">
              <PanelAction
                icon={Download}
                label="Exporter les personnages"
                description="Télécharge personnages.json"
                disabled={characters.length === 0}
                onClick={() => downloadJson("personnages.json", exportCharactersToJson(characters))}
              />
              <PanelAction
                icon={Upload}
                label="Importer des personnages"
                description="Depuis un fichier ou du JSON collé"
                onClick={() => openImport("characters")}
              />
            </PanelSection>

            <PanelSection title="Sauvegarde complète (personnages + sorts)">
              <PanelAction
                icon={Download}
                label="Exporter tout"
                description="Télécharge sauvegarde.json"
                disabled={characters.length === 0 && spells.length === 0}
                onClick={() =>
                  downloadJson("sauvegarde.json", exportBackupToJson(characters, spells))
                }
              />
              <PanelAction
                icon={Upload}
                label="Importer une sauvegarde"
                description="Restaure personnages et sorts"
                onClick={() => openImport("backup")}
              />
            </PanelSection>
          </div>
        </SheetContent>
      </Sheet>

      <ImportCharactersDialog open={activeImport === "characters"} onOpenChange={closeImport} />
      <ImportBackupDialog open={activeImport === "backup"} onOpenChange={closeImport} />
    </>
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function PanelAction({
  icon: Icon,
  label,
  description,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto justify-start gap-3 px-2 py-2.5 text-left"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="text-primary size-5" />
      <span className="flex flex-col">
        <span>{label}</span>
        <span className="text-muted-foreground text-xs font-normal">{description}</span>
      </span>
    </Button>
  );
}
