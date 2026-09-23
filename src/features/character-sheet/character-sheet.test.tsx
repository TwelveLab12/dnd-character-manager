import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterSheet } from "./character-sheet";

function renderSheet(characterId: string) {
  return render(
    <RepositoryProvider>
      <StoreProvider>
        <CharacterSheet characterId={characterId} />
      </StoreProvider>
    </RepositoryProvider>,
  );
}

describe("CharacterSheet", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows a not-found message for an unknown id", async () => {
    renderSheet("does-not-exist");
    expect(await screen.findByText(/personnage introuvable/i)).toBeInTheDocument();
  });

  it("loads an existing character and lets you edit and save it", async () => {
    const character = makeTestCharacter({ name: "Yomi Tsuki", class: "Cleric" });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);

    expect(await screen.findByRole("heading", { name: "Yomi Tsuki" })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/^nom$/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Yomi Tsuki-Crépuscule");
    await user.click(screen.getByRole("button", { name: /^enregistrer$/i }));

    expect(await screen.findByText(/enregistré/i)).toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.name).toBe("Yomi Tsuki-Crépuscule");
  });

  it("computes the ability modifier and saving throw live on the Caractéristiques tab", async () => {
    const character = makeTestCharacter({
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
      savingThrowProficiencies: ["wisdom"],
      level: 3,
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("tab", { name: /caractéristiques/i }));

    // Sagesse 16 -> modificateur +3 ; proficient au niveau 3 (bonus +2) -> jet de sauvegarde +5.
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText(/sauv\. \+5/i)).toBeInTheDocument();
  });
});
