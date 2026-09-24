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
      classId: "clerc",
      hitPoints: { current: 1, temporary: 0 },
      baseMaxHitPoints: 10,
      spellSlotsUsed: { "1": 2 },
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
      classId: "clerc",
      hitPoints: { current: 1, temporary: 0 },
      baseMaxHitPoints: 10,
      spellSlotsUsed: { "1": 2 },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /^repos long$/i }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: /^confirmer$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    // Clerc niv. 1, Con 10 : PV max calculés = 8.
    expect(persisted?.hitPoints.current).toBe(8);
    expect(persisted?.spellSlotsUsed).toEqual({});
  });

  it("restores short-rest features and Channel Divinity on a confirmed short rest", async () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 2,
      features: [
        {
          id: "second-wind",
          name: "Inspiration",
          source: "Test",
          description: "",
          usesMax: 1,
          usesCurrent: 0,
          recharge: "shortRest",
        },
      ],
      classResourcesUsed: { "channel-divinity": 1 },
      spellSlotsUsed: { "1": 3 },
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
    expect(persisted?.classResourcesUsed).toEqual({});
    // Le repos court ne touche pas aux emplacements de sorts.
    expect(persisted?.spellSlotsUsed).toEqual({ "1": 3 });
  });
});
