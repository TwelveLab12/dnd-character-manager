import type { ImportRow } from "@/import-export/preview-import";

const STATUS_LABELS: Record<ImportRow<unknown>["status"], string> = {
  new: "Nouveau",
  update: "Mise à jour",
  identical: "Identique",
  invalid: "Invalide",
};

/**
 * Table de preview d'import (statut + erreurs par ligne), déjà bornée en hauteur et scrollable —
 * partagée entre l'import personnages/sorts (`ImportDialog`) et l'import de sauvegarde
 * (`ImportBackupDialog`, qui en affiche deux côte à côte, une par collection).
 */
export function ImportRowsTable<T>({ rows }: { rows: ImportRow<T>[] }) {
  return (
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
  );
}
