import type { Metadata } from "next";
import { CharacterList } from "@/features/character-list/character-list";
import { PageMain } from "@/features/shared/main-landmark";

// Même segment que le layout : son gabarit de titre ne s'applique pas ici, d'où le titre complet.
export const metadata: Metadata = { title: "Mes personnages — Gestionnaire de personnage D&D" };

export default function Home() {
  return (
    <PageMain>
      <CharacterList />
    </PageMain>
  );
}
