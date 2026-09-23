import type { ReactNode } from "react";

/** Paire label/valeur en lecture seule, pour les vues miroir du mode jeu (voir *-view-tab.tsx). */
export function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
