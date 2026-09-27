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
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /^terminer le repos$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.features[0]?.usesCurrent).toBe(1);
    expect(persisted?.classResourcesUsed).toEqual({});
    // Le repos court ne touche pas aux emplacements de sorts.
    expect(persisted?.spellSlotsUsed).toEqual({ "1": 3 });
  });

  it("spends hit dice during a short rest, from the hit dice chip", async () => {
    // Clerc niv. 3 (d8), Con 14 (+2) : PV max = 10 + 2 × 7 = 24.
    const character = makeTestCharacter({
      classId: "clerc",
      level: 3,
      hitPoints: { current: 5, temporary: 0 },
      hitDiceUsed: 1,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /Dés de vie : 2 sur 3 \(d8\)/ }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("ou résultat"), "6");
    await user.click(within(dialog).getByRole("button", { name: "Ajouter" }));
    expect(within(dialog).getByText("+8 PV")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Points de vie après le repos")).toHaveTextContent(
      "PV 5 → 13/24",
    );

    // Deuxième dé ajouté puis retiré : il n'est pas dépensé.
    await user.click(within(dialog).getByRole("button", { name: "Lancer 1d8" }));
    await user.click(within(dialog).getByRole("button", { name: "Retirer le dé 2" }));
    expect(within(dialog).getByRole("button", { name: "Lancer 1d8" })).toBeEnabled();

    await user.click(within(dialog).getByRole("button", { name: /^terminer le repos$/i }));
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.current).toBe(13);
    expect(persisted?.hitDiceUsed).toBe(2);
    expect(
      await screen.findByRole("button", { name: /Dés de vie : 1 sur 3 \(d8\)/ }),
    ).toBeInTheDocument();
  });

  it("spends nothing when the short rest is cancelled", async () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 2,
      hitPoints: { current: 5, temporary: 0 },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /^repos court$/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Lancer 1d8" }));
    await user.click(within(dialog).getByRole("button", { name: /^annuler$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.current).toBe(5);
    expect(persisted?.hitDiceUsed).toBeUndefined();
  });

  it("ends concentration on a short rest unless the player keeps it", async () => {
    const character = makeTestCharacter({ concentration: { active: true } });
    await new LocalStorageCharacterRepository().create(character);
    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /^repos court$/i }));
    let dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("checkbox", { name: "Garder la concentration" }));
    await user.click(within(dialog).getByRole("button", { name: /^terminer le repos$/i }));
    let persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.concentration.active).toBe(true);

    await user.click(screen.getByRole("button", { name: /^repos court$/i }));
    dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("checkbox", { name: "Garder la concentration" }),
    ).not.toBeChecked();
    await user.click(within(dialog).getByRole("button", { name: /^terminer le repos$/i }));
    persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.concentration.active).toBe(false);
  });

  it("lists what a long rest ends, then ends it", async () => {
    const character = makeTestCharacter({
      hitPoints: { current: 4, temporary: 5 },
      concentration: { active: true },
      armorClassEffects: [
        {
          id: "mage-armor",
          name: "Armure du mage",
          bonus: 3,
          trigger: { type: "manual", active: true },
        },
      ],
    });
    await new LocalStorageCharacterRepository().create(character);
    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /^repos long$/i }));
    const ends = within(await screen.findByRole("alertdialog")).getByRole("list", {
      name: "Prend fin avec le repos",
    });
    expect(ends).toHaveTextContent("Le sommeil met fin à la concentration.");
    expect(ends).toHaveTextContent("Les PV temporaires (5) disparaissent.");
    expect(ends).toHaveTextContent("Prennent fin : Armure du mage.");

    await user.click(screen.getByRole("button", { name: /^confirmer$/i }));
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.temporary).toBe(0);
    expect(persisted?.concentration.active).toBe(false);
    expect(persisted?.armorClassEffects?.[0]?.trigger).toEqual({ type: "manual", active: false });
  });
});
