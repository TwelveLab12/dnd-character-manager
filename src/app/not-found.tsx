import Link from "next/link";

// Next's built-in 404 has no <main> landmark (axe: landmark-one-main, region). Keep the same
// structure as other pages: a <main> with the skip-link target id and a single h1.
export default function NotFound() {
  return (
    <main
      id="contenu"
      className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16"
    >
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
