import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

function renderPlay(characterId: string) {
  return render(
    <RepositoryProvider>
      <StoreProvider>
        <CharacterPlay characterId={characterId} />
      </StoreProvider>
    </RepositoryProvider>,
  );
}

describe("CharacterPlay", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows a not-found message for an unknown id", async () => {
    renderPlay("does-not-exist");
    expect(await screen.findByText(/personnage introuvable/i)).toBeInTheDocument();
  });

  it("loads an existing character and shows its identity and a link to configuration", async () => {
    const character = makeTestCharacter({
      name: "Elara Duskwood",
      class: "Cleric",
      subclass: "Domaine de la Lune",
      level: 5,
    });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);

    expect(await screen.findByRole("heading", { name: "Elara Duskwood" })).toBeInTheDocument();
    expect(screen.getByText(/cleric — domaine de la lune · niveau 5/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /configurer/i })).toHaveAttribute(
      "href",
      `/characters/${character.id}/edit`,
    );
  });
});
