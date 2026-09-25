import type { MetadataRoute } from "next";

/**
 * Manifest PWA servi par Next à `/manifest.webmanifest` : rend l'application installable (écran
 * d'accueil Android/iOS, application de bureau Chrome/Edge). Couleurs = palette Séluné, celle de
 * l'icône d20 (voir `scripts/generate-icons.ts`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Gestionnaire de personnage D&D",
    short_name: "D&D Perso",
    description: "Gestionnaire de personnage D&D 5e — stats, sorts, inventaire.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0e1120",
    theme_color: "#0e1120",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
