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

describe("Armor class in play mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("forgets the concentration spell when concentration is turned off", async () => {
    const character = makeTestCharacter({
      concentration: { active: true, spellId: "shield-of-faith" },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("switch", { name: /^concentration$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.concentration).toEqual({ active: false });
  });

  it("toggles a manual armor class effect and shows the computed AC", async () => {
    const character = makeTestCharacter({
      armorClassEffects: [
        { id: "shield", name: "Bouclier", bonus: 5, trigger: { type: "manual", active: false } },
      ],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.getByText("Base 10 + Dex 0")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: /bouclier \(\+5 ca\)/i }));

    expect(await screen.findByText("Base 10 + Dex 0 + Bouclier 5")).toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.armorClassEffects?.[0]?.trigger).toEqual({ type: "manual", active: true });
  });
});
