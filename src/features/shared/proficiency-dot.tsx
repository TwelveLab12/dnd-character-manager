/** Pastille de maîtrise, commune au mode jeu et à la configuration : pleine et dorée quand la
 * maîtrise est active, cerclée sinon. Décorative : l'état se lit aussi dans le texte ou l'ARIA. */
export function ProficiencyDot({ proficient }: { proficient: boolean }) {
  return (
    <span
      aria-hidden
      className={`size-2.5 shrink-0 rounded-full ${
        proficient
          ? "bg-primary shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
          : "border-muted-foreground/60 border-[1.5px]"
      }`}
    />
  );
}
