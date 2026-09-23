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

describe("RestActions (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("requires confirmation before applying a long rest", async () => {
    const character = makeTestCharacter({
      hitPoints: { current: 1, max: 10, temporary: 0 },
      spellSlots: [{ level: 1, total: 4, used: 4 }],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /^repos long$/i }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^annuler$/i }));
    const untouched = await new LocalStorageCharacterRepository().getById(character.id);
    expect(untouched?.hitPoints.current).toBe(1);
  });

  it("restores hit points and spell slots on confirmed long rest", async () => {
    const character = makeTestCharacter({
      hitPoints: { current: 1, max: 10, temporary: 0 },
      spellSlots: [{ level: 1, total: 4, used: 4 }],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /^repos long$/i }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: /^confirmer$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.current).toBe(10);
    expect(persisted?.spellSlots).toEqual([{ level: 1, total: 4, used: 0 }]);
  });

  it("only restores shortRest features on a confirmed short rest", async () => {
    const character = makeTestCharacter({
      features: [
        {
          id: "channel-divinity",
          name: "Channel Divinity",
          source: "Clerc",
          description: "",
          usesMax: 1,
          usesCurrent: 0,
          recharge: "shortRest",
        },
      ],
      spellSlots: [{ level: 1, total: 4, used: 4 }],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /^repos court$/i }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: /^confirmer$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.features[0]?.usesCurrent).toBe(1);
    // Le repos court ne touche pas aux emplacements de sorts.
    expect(persisted?.spellSlots).toEqual([{ level: 1, total: 4, used: 4 }]);
  });
});
