import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChangelogRoute from "@/app/changelog/page";
import CharacterEditPage from "@/app/characters/[characterId]/edit/page";
import CharacterPage from "@/app/characters/[characterId]/page";
import NotFound from "@/app/not-found";
import OfflinePage from "@/app/offline/page";
import Home from "@/app/page";
import SpellsPage from "@/app/spells/page";
import { MAIN_CONTENT_ID } from "@/features/shared/main-landmark";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const characterProps = {
  params: Promise.resolve({ characterId: "hero" }),
  searchParams: Promise.resolve({}),
};

// Le lien d'évitement du layout vise #contenu (RGAA 12.7) : chaque page doit rendre exactement un
// <main> qui porte cet id (RGAA 12.6). Couvre aussi les pages de personnage, absentes des routes
// e2e tant que #182 est ouverte.
describe("Zone principale sur toutes les pages", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await new LocalStorageCharacterRepository().create(makeTestCharacter({ id: "hero" }));
  });

  it.each<[string, () => ReactNode | Promise<ReactNode>]>([
    ["accueil", () => <Home />],
    ["bibliothèque de sorts", () => <SpellsPage />],
    ["Nouveautés", () => <ChangelogRoute />],
    ["hors ligne", () => <OfflinePage />],
    ["page introuvable", () => <NotFound />],
    ["fiche en mode jeu", () => CharacterPage(characterProps)],
    ["configuration d'un personnage", () => CharacterEditPage(characterProps)],
  ])("%s : un seul <main id=contenu>", async (_page, renderPage) => {
    const { container } = render(
      <RepositoryProvider>
        <StoreProvider>{await renderPage()}</StoreProvider>
      </RepositoryProvider>,
    );
    const mains = container.querySelectorAll("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]?.id).toBe(MAIN_CONTENT_ID);
  });
});
