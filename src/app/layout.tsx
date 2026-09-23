import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gestionnaire de personnage D&D",
  description: "Gestionnaire de personnage D&D 5e — stats, sorts, inventaire.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <RepositoryProvider>
          <StoreProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </StoreProvider>
        </RepositoryProvider>
        <Toaster />
      </body>
    </html>
  );
}
