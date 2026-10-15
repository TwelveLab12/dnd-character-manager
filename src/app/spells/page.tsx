import type { Metadata } from "next";
import { SpellLibrary } from "@/features/spell-library/spell-library";
import { PageMain } from "@/features/shared/main-landmark";

export const metadata: Metadata = { title: "Bibliothèque de sorts" };

export default function SpellsPage() {
  return (
    <PageMain>
      <SpellLibrary />
    </PageMain>
  );
}
