import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Hors ligne — Gestionnaire de personnage D&D" };

/**
 * Page de repli servie par le service worker (`public/sw.js`) quand une page demandée hors ligne
 * n'a jamais été mise en cache — typiquement un personnage créé sans connexion.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl font-semibold">Hors ligne</h1>
      <p className="text-muted-foreground">
        Cette page n&apos;a pas encore été ouverte avec une connexion : elle sera disponible hors
        ligne dès la prochaine visite en ligne. Tes personnages restent enregistrés sur cet
        appareil.
      </p>
      <Link href="/" className="text-primary underline underline-offset-4">
        Retour aux personnages
      </Link>
    </main>
  );
}
