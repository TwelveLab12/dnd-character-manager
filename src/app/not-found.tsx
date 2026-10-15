import type { Metadata } from "next";
import Link from "next/link";
import { FullscreenToggle } from "@/features/shared/fullscreen-toggle";
import { MAIN_CONTENT_ID } from "@/features/shared/main-landmark";

// La 404 doit se reconnaître dans l'onglet et l'historique (RGAA 8.6). Contrairement à la page
// d'accueil, le gabarit de titre du layout s'applique ici : il ajoute le nom de l'application.
export const metadata: Metadata = { title: "Page introuvable" };

// Next's built-in 404 has no <main> landmark (axe: landmark-one-main, region). Keep the same
// structure as other pages: a <main> with the skip-link target id and a single h1, plus the
// fullscreen toggle every page offers (docs/adr/0063).
export default function NotFound() {
  return (
    <main
      id={MAIN_CONTENT_ID}
      className="relative mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16"
    >
      <div className="absolute top-4 right-4">
        <FullscreenToggle />
      </div>
      <h1 className="text-3xl font-semibold">Page introuvable</h1>
      <p>La page demandée n&apos;existe pas ou a été déplacée.</p>
      <p>
        <Link href="/" className="underline underline-offset-4">
          Revenir à l&apos;accueil
        </Link>
      </p>
    </main>
  );
}
