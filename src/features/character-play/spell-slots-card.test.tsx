import { render, screen, within } from "@testing-library/react";
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

function slotButtons(name: RegExp) {
  return within(screen.getByRole("region", { name: "Emplacements de sorts" })).queryAllByRole(
    "button",
    { name },
  );
}

describe("SpellSlotsCard — emplacements de sorts dans le HUD (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows one diamond per computed slot, available ones first", async () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 3,
      spellSlotsUsed: { "1": 1 },
    });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(slotButtons(/utiliser un emplacement de niveau 1/i)).toHaveLength(3);
    expect(slotButtons(/récupérer un emplacement de niveau 1/i)).toHaveLength(1);
    expect(slotButtons(/utiliser un emplacement de niveau 2/i)).toHaveLength(2);
    expect(screen.getByRole("region", { name: "Emplacements de sorts" })).toHaveTextContent(
      "5 / 6 restants",
    );
  });

  it("spends a slot from a lit diamond and recovers it from a spent one, persisting", async () => {
    const character = makeTestCharacter({ classId: "clerc", level: 3, spellSlotsUsed: { "1": 1 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(slotButtons(/utiliser un emplacement de niveau 1/i)[0]!);
    expect(slotButtons(/récupérer un emplacement de niveau 1/i)).toHaveLength(2);
    let persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.spellSlotsUsed).toEqual({ "1": 2 });

    await user.click(slotButtons(/récupérer un emplacement de niveau 1/i)[0]!);
    persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.spellSlotsUsed).toEqual({ "1": 1 });
  });

  it("shows no spell slot card for a class without spellcasting", async () => {
    const character = makeTestCharacter();
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.queryByRole("region", { name: "Emplacements de sorts" })).not.toBeInTheDocument();
  });
});

describe("ClassResourceCards — Canalisation divine dans le HUD (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function clericWithChannelDivinity(level: number) {
    return makeTestCharacter({
      classId: "clerc",
      level,
      features: [
        {
          id: "sanctuary",
          name: "Sanctuaire du Crépuscule",
          source: "Domaine du Crépuscule",
          description: "",
          resourceId: "channel-divinity",
        },
        {
          id: "turn",
          name: "Renvoi des morts-vivants",
          source: "Clerc",
          description: "",
          resourceId: "channel-divinity",
        },
      ],
    });
  }

  it("shows the computed pool and every linked option", async () => {
    const character = clericWithChannelDivinity(6);
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const card = screen.getByRole("region", { name: "Canalisation divine" });
    expect(within(card).getAllByRole("button", { name: /dépenser : canalisation/i })).toHaveLength(
      2,
    );
    expect(
      within(card).getByRole("button", { name: /utiliser sanctuaire du crépuscule/i }),
    ).toBeEnabled();
    expect(within(card).getByRole("button", { name: /utiliser renvoi/i })).toBeEnabled();
  });

  it("consumes the shared pool from any option, then disables the options", async () => {
    const character = clericWithChannelDivinity(2);
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const card = screen.getByRole("region", { name: "Canalisation divine" });
    await user.click(within(card).getByRole("button", { name: /utiliser renvoi/i }));

    expect(
      await within(card).findByRole("button", { name: /utiliser sanctuaire du crépuscule/i }),
    ).toBeDisabled();
    expect(within(card).getByText(/revient au prochain repos court/i)).toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.classResourcesUsed).toEqual({ "channel-divinity": 1 });

    await user.click(within(card).getByRole("button", { name: /récupérer : canalisation/i }));
    expect(await within(card).findByRole("button", { name: /utiliser renvoi/i })).toBeEnabled();
  });

  it("shows no Channel Divinity before cleric level 2", async () => {
    const character = clericWithChannelDivinity(1);
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.queryByRole("region", { name: "Canalisation divine" })).not.toBeInTheDocument();
  });

  it("lists the rule-granted options of a Twilight cleric without any linked feature", async () => {
    const character = makeTestCharacter({ classId: "clerc", subclassId: "crepuscule", level: 3 });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const card = screen.getByRole("region", { name: "Canalisation divine" });
    expect(
      within(card)
        .getAllByRole("button", { name: /^utiliser/i })
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Utiliser Renvoi des morts-vivants", "Utiliser Sanctuaire du Crépuscule"]);
  });
});
