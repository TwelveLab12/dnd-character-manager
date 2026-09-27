import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OfflinePage from "@/app/offline/page";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { ChangelogPage } from "@/features/changelog/changelog-page";
import { CharacterList } from "@/features/character-list/character-list";
import { SpellLibrary } from "@/features/spell-library/spell-library";
import { CharacterPlay } from "@/features/character-play/character-play";
import { CharacterSheet } from "@/features/character-sheet/character-sheet";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { makeTestCharacter } from "@/test/fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function setFullscreen(enabled: boolean, element: Element | null) {
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: enabled });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: element });
}

// Le plein écran persiste d'une page à l'autre : chaque page doit permettre d'en sortir
// (docs/adr/0063).
describe("Bouton plein écran sur toutes les pages", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    setFullscreen(true, document.documentElement);
    await new LocalStorageCharacterRepository().create(makeTestCharacter({ id: "hero" }));
  });

  afterEach(() => {
    setFullscreen(false, null);
  });

  it.each([
    ["accueil", <CharacterList key="list" />],
    ["bibliothèque de sorts", <SpellLibrary key="spells" />],
    ["Nouveautés", <ChangelogPage key="changelog" />],
    ["hors ligne", <OfflinePage key="offline" />],
    ["fiche en mode jeu", <CharacterPlay key="play" characterId="hero" />],
    ["configuration d'un personnage", <CharacterSheet key="edit" characterId="hero" />],
  ])("%s : propose de quitter le plein écran", async (_page, page) => {
    render(
      <RepositoryProvider>
        <StoreProvider>{page}</StoreProvider>
      </RepositoryProvider>,
    );
    expect(
      await screen.findByRole("button", { name: "Quitter le plein écran" }),
    ).toBeInTheDocument();
  });
});
