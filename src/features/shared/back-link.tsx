import { ChevronLeft, Users } from "lucide-react";
import Link from "next/link";
import type { MouseEventHandler } from "react";

/**
 * Lien de retour vers la liste des personnages (docs/adr/0067) : bouton en pastille avec icônes,
 * détaché du titre qu'il surmonte, commun à toutes les pages secondaires.
 */
export function BackLink({
  onClick,
  className = "",
}: {
  /** Ex : garde de navigation de la configuration (modifications non enregistrées). */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={`group bg-background/40 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 inline-flex h-8 w-fit items-center gap-1.5 rounded-full border pr-3.5 pl-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 ${className}`}
    >
      <ChevronLeft
        aria-hidden
        className="size-4 transition-transform group-hover:-translate-x-0.5"
      />
      <Users aria-hidden className="size-4" />
      Mes personnages
    </Link>
  );
}
