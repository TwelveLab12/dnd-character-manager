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

describe("HitPointsWidget (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("applies damage immediately, without a Save button", async () => {
    const character = makeTestCharacter({
      hitPoints: { current: 10, max: 10, temporary: 0 },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.queryByRole("button", { name: /^enregistrer$/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/^montant$/i), "4");
    await user.click(screen.getByRole("button", { name: /^dégâts$/i }));

    expect(await screen.findByText("6")).toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints).toEqual({ current: 6, max: 10, temporary: 0 });
  });

  it("absorbs damage with temporary hit points before current hit points", async () => {
    const character = makeTestCharacter({
      hitPoints: { current: 10, max: 10, temporary: 5 },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.type(screen.getByLabelText(/^montant$/i), "3");
    await user.click(screen.getByRole("button", { name: /^dégâts$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints).toEqual({ current: 10, max: 10, temporary: 2 });
  });

  it("heals current hit points, capped at max", async () => {
    const character = makeTestCharacter({
      hitPoints: { current: 8, max: 10, temporary: 0 },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.type(screen.getByLabelText(/^montant$/i), "100");
    await user.click(screen.getByRole("button", { name: /^soin$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints).toEqual({ current: 10, max: 10, temporary: 0 });
  });

  it("sets temporary hit points without stacking", async () => {
    const character = makeTestCharacter({
      hitPoints: { current: 10, max: 10, temporary: 5 },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.type(screen.getByLabelText(/pv temporaires/i), "3");
    await user.click(screen.getByRole("button", { name: /^définir$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.temporary).toBe(5);
  });
});
