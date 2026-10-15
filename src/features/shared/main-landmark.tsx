import type { ReactNode } from "react";

/** Cible du lien d'évitement : porté par le `<main>` de chaque page (RGAA 12.7). */
export const MAIN_CONTENT_ID = "contenu";

/**
 * Zone principale d'une page (RGAA 12.6) : un seul `<main>` par page, posé par `page.tsx` autour
 * de l'écran de la feature. Il prolonge la colonne flex du `<body>` pour que les écrans qui
 * remplissent la hauteur (`flex-1`) gardent leur mise en page.
 */
export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main id={MAIN_CONTENT_ID} className="flex flex-1 flex-col">
      {children}
    </main>
  );
}

/**
 * Lien d'évitement (RGAA 12.7) : premier élément focalisable de chaque page, masqué jusqu'à ce
 * qu'il reçoive le focus clavier.
 */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="bg-background text-foreground ring-ring sr-only z-50 rounded-md font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:ring-2"
    >
      Aller au contenu principal
    </a>
  );
}
