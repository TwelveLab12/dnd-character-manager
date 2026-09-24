"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "cn";
import { Switch } from "@/components/ui/switch";

/**
 * Section de l'onglet Général (docs/adr/0035) : titre Spectral, sous-titre discret, séparée de la
 * précédente par un filet. `id` sert d'ancre aux tuiles de résumé en haut de l'onglet.
 */
export function GeneralSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <section id={id} aria-labelledby={titleId} className="grid scroll-mt-6 gap-4 border-t pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <h3 id={titleId} className="font-heading text-xl font-semibold">
            {title}
          </h3>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Petit intitulé en capitales au-dessus d'un groupe de contrôles. */
export function GroupLabel({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <span id={id} className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
      {children}
    </span>
  );
}

/**
 * Maîtrise en jeton, toujours modifiable (docs/adr/0035). Une maîtrise prévue par la classe ou la
 * sous-classe (`grantedBy`) est active par défaut et affiche sa source ; la décocher la retire
 * pour ce personnage seulement (« Retirée · Clerc »).
 */
export function ProficiencyChip({
  label,
  checked,
  grantedBy,
  onCheckedChange,
}: {
  label: string;
  /** Maîtrise effective pour ce personnage. */
  checked: boolean;
  /** Classe ou sous-classe qui prévoit cette maîtrise, qu'elle soit conservée ou retirée. */
  grantedBy?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const detail = grantedBy
    ? checked
      ? grantedBy
      : `Retirée · ${grantedBy}`
    : checked
      ? "Ajoutée à la main"
      : "Non maîtrisée";
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "focus-visible:ring-ring/50 flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3",
        checked
          ? "border-primary bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-muted/40",
        !checked && grantedBy && "border-dashed",
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {checked && <Check className="size-3.5" aria-hidden />}
        {label}
      </span>
      <span
        className={cn("text-xs", checked && grantedBy ? "text-primary" : "text-muted-foreground")}
      >
        {detail}
      </span>
    </button>
  );
}

/** Ligne « nom + effet » avec un interrupteur, pour les dons, styles et capacités appliqués. */
export function RuleSwitchRow({
  name,
  effect,
  checked,
  onCheckedChange,
}: {
  name: string;
  effect: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  const effectId = useId();
  return (
    <div className="bg-background/60 flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
      <label htmlFor={id} className="grid min-w-0 flex-1 cursor-pointer gap-0.5">
        <span className="text-sm font-medium">{name}</span>
        <span id={effectId} className="text-muted-foreground text-xs">
          {effect}
        </span>
      </label>
      <Switch
        id={id}
        aria-describedby={effectId}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
