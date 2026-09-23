"use client";

import Link from "next/link";
import { useEffect } from "react";
import { downloadJson, exportSpellsToJson } from "@/import-export/exporter";
import { useSpellStore } from "@/stores/store-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ImportSpellsDialog } from "./import-spells-dialog";

export function SpellLibrary() {
  const spells = useSpellStore((state) => state.spells);
  const isLoading = useSpellStore((state) => state.isLoading);
  const error = useSpellStore((state) => state.error);
  const load = useSpellStore((state) => state.load);
  const remove = useSpellStore((state) => state.remove);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedSpells = [...spells].sort(
    (a, b) => a.level - b.level || a.name.localeCompare(b.name),
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-muted-foreground text-sm underline underline-offset-4">
            &larr; Mes personnages
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Bibliothèque de sorts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={spells.length === 0}
            onClick={() => downloadJson("sorts.json", exportSpellsToJson(spells))}
          >
            Exporter
          </Button>
          <ImportSpellsDialog />
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Aucun sort officiel n&rsquo;est fourni avec l&rsquo;application pour des raisons de droits —
        importez les vôtres via « Importer », ou{" "}
        <a
          href="/templates/spells-import-template.json"
          download
          className="text-primary underline underline-offset-4"
        >
          téléchargez un modèle
        </a>
        .
      </p>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          Impossible de charger les sorts : {error}
        </p>
      )}

      {isLoading && spells.length === 0 && !error && (
        <p className="text-muted-foreground text-sm">Chargement…</p>
      )}

      {!isLoading && spells.length === 0 && !error && (
        <p className="text-muted-foreground text-sm">Aucun sort importé pour l&rsquo;instant.</p>
      )}

      {sortedSpells.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-2 font-medium">Sort</th>
              <th className="py-2 pr-2 font-medium">Niveau</th>
              <th className="py-2 pr-2 font-medium">École</th>
              <th className="py-2 pr-2 font-medium">Classes</th>
              <th className="py-2 pr-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSpells.map((spell) => (
              <tr key={spell.id} className="border-b last:border-0">
                <td className="py-2 pr-2 font-medium">{spell.name}</td>
                <td className="py-2 pr-2">{spell.level === 0 ? "Tour de magie" : spell.level}</td>
                <td className="py-2 pr-2">{spell.school}</td>
                <td className="text-muted-foreground py-2 pr-2">{spell.classes.join(", ")}</td>
                <td className="py-2 text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer {spell.name} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Le sort sera retiré de la bibliothèque locale. Vous pourrez le réimporter
                          plus tard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void remove(spell.id)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
