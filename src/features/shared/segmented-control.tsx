"use client";

import { cn } from "cn";

/**
 * Choix exclusif en segments (docs/adr/0035, 0036) : un groupe de boutons radio, le segment actif
 * en or. Pour 2 à 4 options courtes, à la place d'une liste déroulante. Une option `disabled` reste
 * visible (grisée) pour signaler un choix que les règles excluent.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: {
  /** Nom accessible du groupe. */
  label: string;
  options: readonly { value: T; label: string; disabled?: boolean }[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("bg-background/60 flex gap-1 rounded-xl border p-1", className)}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={option.disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "focus-visible:ring-ring/50 h-9 flex-1 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3",
              checked
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
              "disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40 disabled:cursor-not-allowed",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
