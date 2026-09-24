import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Tuile compacte du HUD de combat : icône, valeur en gros, libellé court. */
export function StatTile({
  icon: Icon,
  value,
  label,
  tone = "primary",
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: string;
  /** `magic` regroupe visuellement les valeurs d'incantation (DD, attaque de sort). */
  tone?: "primary" | "magic";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border px-1 pt-2.5 pb-2 sm:rounded-2xl sm:px-2 sm:pt-3 sm:pb-2.5 ${
        tone === "magic" ? "border-info/30 bg-info/5" : "bg-card"
      }`}
    >
      <Icon
        aria-hidden
        className={`size-4 sm:size-[18px] ${tone === "magic" ? "text-info" : "text-primary"}`}
      />
      <span className="font-heading text-[22px] leading-none font-bold tabular-nums sm:text-[26px]">
        {value}
      </span>
      <span className="text-muted-foreground text-[10px] sm:text-[11px]">{label}</span>
    </div>
  );
}
