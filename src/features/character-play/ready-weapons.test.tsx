import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { InventoryItem } from "@/domain/inventory";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

const greatsword: InventoryItem = {
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
};
const handaxe: InventoryItem = {
  id: "handaxe",
  name: "Hachette",
  quantity: 2,
  weapon: {
    category: "simple",
    range: "melee",
    damageDice: "1d6",
    damageType: "slashing",
    light: true,
    thrown: { normal: 6, long: 18 },
  },
};

async function renderMurrik() {
  const character = makeTestCharacter({
    weaponProficiencies: ["simple", "martial"],
    inventory: [greatsword, handaxe],
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

describe("Armes prêtes (mode jeu)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lists ready weapons apart from the weapons in hand in the Combat tab", async () => {
    await renderMurrik();

    expect(
      within(screen.getByRole("list", { name: "En main" })).getByText("Épée à deux mains"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Prêtes à dégainer" })).getByText("Hachette"),
    ).toBeInTheDocument();
  });

  it("places a weapon from the Inventaire tab: in hand, ready or in the bag", async () => {
    const character = await renderMurrik();
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Inventaire" }));

    const handaxePlacement = screen.getByRole("radiogroup", { name: "Emplacement : Hachette" });
    expect(within(handaxePlacement).getByRole("radio", { name: "Prête" })).toBeChecked();
    expect(
      within(screen.getByRole("radiogroup", { name: "Emplacement : Épée à deux mains" })).getByRole(
        "radio",
        { name: "Deux mains" },
      ),
    ).toBeChecked();

    await user.click(within(handaxePlacement).getByRole("radio", { name: "En main" }));
    let persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.inventory.map((item) => [item.id, item.equipped === true])).toEqual([
      ["greatsword", false],
      ["handaxe", true],
    ]);

    await user.click(
      within(screen.getByRole("radiogroup", { name: "Main : Hachette" })).getByRole("radio", {
        name: "Secondaire",
      }),
    );
    persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.inventory[1]).toMatchObject({ equipped: true, hand: "off" });

    await user.click(
      within(screen.getByRole("radiogroup", { name: "Emplacement : Hachette" })).getByRole(
        "radio",
        { name: "Sac" },
      ),
    );
    persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.inventory[1]).toMatchObject({ equipped: false, stowed: true });
  });
});
