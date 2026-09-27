import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { Character } from "@/domain/character";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

async function renderPlay(overrides: Partial<Character>) {
  const character = makeTestCharacter({
    baseMaxHitPoints: 20,
    hitPoints: { current: 18, temporary: 0 },
    ...overrides,
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
  return character;
}

function persisted(id: string) {
  return new LocalStorageCharacterRepository().getById(id);
}

describe("Épuisement (mode jeu)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("raises the level, lists cumulative effects and halves HP at 4", async () => {
    const character = await renderPlay({ exhaustion: 3 });
    const user = userEvent.setup();

    const banner = screen.getByRole("region", { name: "Épuisement 3" });
    expect(within(banner).getAllByRole("listitem")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Ajouter un niveau d'épuisement" }));
    expect(await screen.findByRole("region", { name: "Épuisement 4" })).toHaveTextContent(
      "PV max divisés par 2",
    );
    const saved = await persisted(character.id);
    expect(saved?.exhaustion).toBe(4);
    expect(saved?.hitPoints.current).toBe(10);
  });

  it("shows death at level 6 and lets the player undo it", async () => {
    const character = await renderPlay({ exhaustion: 5 });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Ajouter un niveau d'épuisement" }));
    const panel = await screen.findByRole("region", { name: "Jets contre la mort" });
    expect(within(panel).getByRole("heading", { name: "Mort" })).toBeInTheDocument();
    expect(within(panel).getByText("Épuisement 6")).toBeInTheDocument();
    expect(within(panel).queryByRole("group", { name: "Réussites" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retirer un niveau d'épuisement" }));
    expect(screen.queryByRole("region", { name: "Jets contre la mort" })).not.toBeInTheDocument();
    expect((await persisted(character.id))?.exhaustion).toBe(5);
  });

  it("warns about disadvantage in the Caractéristiques tab", async () => {
    await renderPlay({ exhaustion: 3 });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Caractéristiques" }));
    expect(screen.getByRole("note")).toHaveTextContent(
      "Épuisement 3 : désavantage aux tests de caractéristique et de compétence, et aux jets de sauvegarde.",
    );
  });

  it("removes one level on a long rest, unless the character did not eat and drink", async () => {
    const character = await renderPlay({ exhaustion: 2 });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /^repos long$/i }));
    let dialog = within(await screen.findByRole("alertdialog"));
    expect(dialog.getByText(/Épuisement : 2 → 1/)).toBeInTheDocument();
    await user.click(dialog.getByRole("checkbox", { name: "A mangé et bu" }));
    expect(dialog.getByText(/Épuisement : 2 → 2/)).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: /^confirmer$/i }));
    expect((await persisted(character.id))?.exhaustion).toBe(2);

    await user.click(screen.getByRole("button", { name: /^repos long$/i }));
    dialog = within(await screen.findByRole("alertdialog"));
    expect(dialog.getByRole("checkbox", { name: "A mangé et bu" })).toBeChecked();
    await user.click(dialog.getByRole("button", { name: /^confirmer$/i }));
    expect((await persisted(character.id))?.exhaustion).toBe(1);
  });

  it("pre-selects disadvantage for attacks from level 3", async () => {
    await renderPlay({
      exhaustion: 3,
      inventory: [
        {
          id: "mace",
          name: "Masse d'armes",
          quantity: 1,
          equipped: true,
          weapon: {
            category: "simple",
            range: "melee",
            damageDice: "1d6",
            damageType: "bludgeoning",
          },
        },
      ],
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Détails : Masse d'armes" }));
    const attack = within(await screen.findByRole("region", { name: "Attaquer" }));
    expect(attack.getByRole("radio", { name: "Désavantage" })).toBeChecked();
    expect(attack.getByText(/Épuisement 3 : désavantage aux jets d’attaque/)).toBeInTheDocument();
  });
});
