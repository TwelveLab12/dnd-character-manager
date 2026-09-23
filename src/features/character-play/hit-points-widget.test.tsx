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

  it("has no Save button — every action persists immediately", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 10, max: 10, temporary: 0 } });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.queryByRole("button", { name: /^enregistrer$/i })).not.toBeInTheDocument();
  });

  it("inflicts 1 damage per click on the down chevron, absorbing temporary hit points first", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 10, max: 10, temporary: 2 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /infliger 1 dégât/i }));
    await user.click(screen.getByRole("button", { name: /infliger 1 dégât/i }));
    await user.click(screen.getByRole("button", { name: /infliger 1 dégât/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints).toEqual({ current: 9, max: 10, temporary: 0 });
  });

  it("heals 1 point per click on the up chevron, capped at max", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 9, max: 10, temporary: 0 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /soigner 1 point de vie/i }));
    await user.click(screen.getByRole("button", { name: /soigner 1 point de vie/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints).toEqual({ current: 10, max: 10, temporary: 0 });
  });

  it("edits current hit points directly, clamped to max", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 10, max: 10, temporary: 0 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const currentInput = screen.getByLabelText(/pv actuels/i);
    await user.clear(currentInput);
    await user.type(currentInput, "999");

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.current).toBe(10);
  });

  it("edits temporary hit points directly, including lowering an existing value", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 10, max: 10, temporary: 5 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const temporaryInput = screen.getByLabelText(/pv temporaires/i);
    await user.clear(temporaryInput);
    await user.type(temporaryInput, "2");

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.temporary).toBe(2);
  });

  it("shows the moon gauge for the Séluné theme, the linear bar otherwise", async () => {
    const seluneCharacter = makeTestCharacter({
      hitPoints: { current: 7, max: 23, temporary: 0 },
      themeId: "selune",
    });
    await new LocalStorageCharacterRepository().create(seluneCharacter);

    const { unmount } = renderPlay(seluneCharacter.id);
    await screen.findByRole("heading", { name: seluneCharacter.name });
    expect(screen.getByText("/ 23 PV")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    unmount();

    window.localStorage.clear();
    const defaultCharacter = makeTestCharacter({
      hitPoints: { current: 7, max: 23, temporary: 0 },
    });
    await new LocalStorageCharacterRepository().create(defaultCharacter);

    renderPlay(defaultCharacter.id);
    await screen.findByRole("heading", { name: defaultCharacter.name });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("/ 23 PV")).not.toBeInTheDocument();
  });
});
