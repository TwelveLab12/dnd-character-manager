import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("ConcentrationMarker (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("toggles concentration on and off, persisting immediately", async () => {
    const character = makeTestCharacter({ concentration: { active: false } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const toggle = screen.getByRole("switch", { name: /^concentration$/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.concentration.active).toBe(true);

    await user.click(toggle);
    const persistedAgain = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persistedAgain?.concentration.active).toBe(false);
  });
});
