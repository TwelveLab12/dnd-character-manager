import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

describe("Rage (mode jeu)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("enters a rage, shows it everywhere, then ends it", async () => {
    const character = makeTestCharacter({
      class: "Barbare",
      classId: "barbare",
      level: 3,
      abilityScores: { ...makeTestCharacter().abilityScores, strength: 15 },
      inventory: [
        {
          id: "greatsword",
          name: "Épée à deux mains",
          quantity: 1,
          equipped: true,
          weapon: {
            category: "martial",
            range: "melee",
            damageDice: "1d12",
            damageType: "slashing",
            twoHanded: true,
          },
        },
      ],
    });
    await new LocalStorageCharacterRepository().create(character);
    render(
      <RepositoryProvider>
        <StoreProvider>
          <CharacterPlay characterId={character.id} />
        </StoreProvider>
      </RepositoryProvider>,
    );
    await screen.findByRole("heading", { name: character.name });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Entrer en rage" }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted).toMatchObject({ raging: true, classResourcesUsed: { rage: 1 } });
    expect(
      within(screen.getByRole("region", { name: "Résumé" })).getByText("En rage"),
    ).toBeVisible();
    expect(screen.getByText(/1d12\+4 tranchant · Deux mains · Rage \+2/)).toBeInTheDocument();
    expect(
      screen.getByText(/Résistance : dégâts contondants, perforants et tranchants/),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Mettre fin à la rage" }));
    expect(
      within(screen.getByRole("region", { name: "Résumé" })).queryByText("En rage"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrer en rage" })).toBeEnabled();
  });
});
