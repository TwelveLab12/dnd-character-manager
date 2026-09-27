import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CharacterPlay } from "@/features/character-play/character-play";
import { CharacterSheet } from "@/features/character-sheet/character-sheet";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import {
  characterEditHref,
  characterPlayHref,
  configTabFor,
  playTabFor,
  toConfigTab,
  toPlayTab,
} from "./character-tabs";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("mirror tabs", () => {
  it("maps each play tab to its configuration tab and back", () => {
    expect(configTabFor("spells")).toBe("spells");
    expect(configTabFor("combat")).toBe("general");
    expect(configTabFor("notes")).toBe("general");
    expect(playTabFor("inventory")).toBe("inventory");
    expect(playTabFor("general")).toBe("combat");
  });

  it("falls back to the first tab for an unknown value", () => {
    expect(toPlayTab("oops")).toBe("combat");
    expect(toConfigTab(undefined)).toBe("general");
  });

  it("builds links without a parameter for the first tab", () => {
    expect(characterPlayHref("c1", "combat")).toBe("/characters/c1");
    expect(characterPlayHref("c1", "features")).toBe("/characters/c1?tab=features");
    expect(characterEditHref("c1", "general")).toBe("/characters/c1/edit");
    expect(characterEditHref("c1", "abilities")).toBe("/characters/c1/edit?tab=abilities");
  });
});

async function renderPage(page: React.ReactNode) {
  const character = makeTestCharacter({ id: "hero" });
  await new LocalStorageCharacterRepository().create(character);
  render(
    <RepositoryProvider>
      <StoreProvider>{page}</StoreProvider>
    </RepositoryProvider>,
  );
  await screen.findByRole("heading", { name: character.name });
}

describe("keeping the tab between play and configuration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/characters/hero");
  });

  it("« Modifier » opens the configuration tab mirroring the current play tab", async () => {
    await renderPage(<CharacterPlay characterId="hero" />);
    const user = userEvent.setup();
    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/characters/hero/edit",
    );

    await user.click(screen.getByRole("tab", { name: "Sorts" }));
    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/characters/hero/edit?tab=spells",
    );
    expect(window.location.search).toBe("?tab=spells");

    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/characters/hero/edit",
    );
  });

  it("opens the tab given in the URL", async () => {
    await renderPage(<CharacterPlay characterId="hero" initialTab="inventory" />);
    expect(screen.getByRole("tab", { name: "Inventaire" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("« Voir la fiche » opens the play tab mirroring the current configuration tab", async () => {
    window.history.replaceState(null, "", "/characters/hero/edit?tab=features");
    await renderPage(<CharacterSheet characterId="hero" initialTab="features" />);
    const user = userEvent.setup();
    expect(screen.getByRole("link", { name: /Voir la fiche/ })).toHaveAttribute(
      "href",
      "/characters/hero?tab=features",
    );

    await user.click(screen.getByRole("tab", { name: "Général" }));
    expect(screen.getByRole("link", { name: /Voir la fiche/ })).toHaveAttribute(
      "href",
      "/characters/hero",
    );
    expect(window.location.search).toBe("");
  });

  it("shows the « Mes personnages » back link", async () => {
    await renderPage(<CharacterPlay characterId="hero" />);
    expect(screen.getByRole("link", { name: "Mes personnages" })).toHaveAttribute("href", "/");
  });
});
