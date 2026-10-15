import type { Metadata } from "next";
import { CharacterList } from "@/features/character-list/character-list";
import { PageMain } from "@/features/shared/main-landmark";

export const metadata: Metadata = { title: "Mes personnages" };

export default function Home() {
  return (
    <PageMain>
      <CharacterList />
    </PageMain>
  );
}
