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

describe("SpellSlotsCounter (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses and recovers a spell slot, persisting immediately", async () => {
    const character = makeTestCharacter({
      spellSlots: [{ level: 1, total: 4, used: 1 }],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));

    expect(screen.getByText("3 / 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /utiliser un emplacement de niveau 1/i }));
    expect(await screen.findByText("2 / 4")).toBeInTheDocument();
    let persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.spellSlots).toEqual([{ level: 1, total: 4, used: 2 }]);

    await user.click(screen.getByRole("button", { name: /récupérer un emplacement de niveau 1/i }));
    expect(await screen.findByText("3 / 4")).toBeInTheDocument();
    persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.spellSlots).toEqual([{ level: 1, total: 4, used: 1 }]);
  });

  it("disables the recover button when nothing is used and the use button when fully used", async () => {
    const character = makeTestCharacter({
      spellSlots: [{ level: 1, total: 2, used: 0 }],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));

    expect(
      screen.getByRole("button", { name: /récupérer un emplacement de niveau 1/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /utiliser un emplacement de niveau 1/i }));
    await user.click(screen.getByRole("button", { name: /utiliser un emplacement de niveau 1/i }));

    expect(
      await screen.findByRole("button", { name: /utiliser un emplacement de niveau 1/i }),
    ).toBeDisabled();
  });
});
