import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { LocalStorageSpellRepository } from "@/repositories/local-storage/local-storage-spell-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter, makeTestSpell } from "@/test/fixtures";
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

describe("PreparedSpellsList (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows only prepared or always-available spells, not merely-known ones", async () => {
    const character = makeTestCharacter({
      knownSpellIds: ["cure-wounds", "guidance", "moonbeam"],
      preparedSpellIds: ["cure-wounds"],
      spellTags: [{ spellId: "moonbeam", domain: "Domaine de la Lune", alwaysPrepared: true }],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "cure-wounds", name: "Soins", level: 1 }),
      makeTestSpell({ id: "guidance", name: "Assistance", level: 0 }),
      makeTestSpell({ id: "moonbeam", name: "Rayon lunaire", level: 2 }),
    ]);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(await screen.findByText("Soins")).toBeInTheDocument();
    expect(screen.getByText("Rayon lunaire")).toBeInTheDocument();
    expect(screen.queryByText("Assistance")).not.toBeInTheDocument();
  });

  it("filters the list by spell level using the level chips", async () => {
    const character = makeTestCharacter({
      knownSpellIds: ["cure-wounds", "moonbeam"],
      preparedSpellIds: ["cure-wounds", "moonbeam"],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "cure-wounds", name: "Soins", level: 1 }),
      makeTestSpell({ id: "moonbeam", name: "Rayon lunaire", level: 2 }),
    ]);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await screen.findByText("Soins");

    await user.click(screen.getByRole("button", { name: "Niveau 1" }));

    expect(screen.getByText("Soins")).toBeInTheDocument();
    expect(screen.queryByText("Rayon lunaire")).not.toBeInTheDocument();
  });

  it("filters the list by domain using the domain chips", async () => {
    const character = makeTestCharacter({
      knownSpellIds: ["cure-wounds", "moonbeam"],
      preparedSpellIds: ["cure-wounds"],
      spellTags: [{ spellId: "moonbeam", domain: "Domaine de la Lune", alwaysPrepared: true }],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "cure-wounds", name: "Soins", level: 1 }),
      makeTestSpell({ id: "moonbeam", name: "Rayon lunaire", level: 2 }),
    ]);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await screen.findByText("Soins");

    await user.click(screen.getByRole("button", { name: "Domaine de la Lune" }));

    expect(screen.getByText("Rayon lunaire")).toBeInTheDocument();
    expect(screen.queryByText("Soins")).not.toBeInTheDocument();
  });
});
