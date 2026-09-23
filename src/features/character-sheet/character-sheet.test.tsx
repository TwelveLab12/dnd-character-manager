import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { LocalStorageSpellRepository } from "@/repositories/local-storage/local-storage-spell-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter, makeTestSpell } from "@/test/fixtures";
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

  it("activates spellcasting, computes DC/attack bonus, and lets an override take precedence", async () => {
    const character = makeTestCharacter({
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
      level: 3,
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
    await user.click(screen.getByRole("button", { name: /activer l.incantation/i }));

    // Sagesse 16 (+3), niveau 3 (bonus de maîtrise +2) -> DD 13, bonus d'attaque +5.
    expect(await screen.findByText(/dd de sauvegarde — 13/i)).toBeInTheDocument();
    expect(screen.getByText(/bonus d.attaque — \+5/i)).toBeInTheDocument();

    const dcOverrideInput = screen.getByLabelText(/dd de sauvegarde/i);
    await user.type(dcOverrideInput, "99");
    expect(await screen.findByText(/dd de sauvegarde — 99/i)).toBeInTheDocument();
  });

  it("generates full-caster spell slots from the character's level", async () => {
    const character = makeTestCharacter({ level: 3, spellSlots: [] });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
    await user.click(screen.getByRole("button", { name: /générer \(lanceur complet\)/i }));

    expect(await screen.findByText("Niveau 1")).toBeInTheDocument();
    expect(screen.getByText("Niveau 2")).toBeInTheDocument();
  });

  it("lists library spells and toggles known/prepared, un-preparing when un-knowing", async () => {
    const character = makeTestCharacter();
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "fireball", name: "Test Fireball" }),
    ]);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
    const row = (await screen.findByText("Test Fireball")).closest("tr");
    if (!row) {
      throw new Error("expected a table row for the spell");
    }

    const knownCheckbox = within(row).getAllByRole("checkbox")[0];
    const preparedCheckbox = within(row).getAllByRole("checkbox")[1];
    if (!knownCheckbox || !preparedCheckbox) {
      throw new Error("expected known/prepared checkboxes");
    }

    await user.click(knownCheckbox);
    expect(await screen.findByText(/1 connu\(s\), 0 préparé\(s\)/)).toBeInTheDocument();

    await user.click(preparedCheckbox);
    expect(await screen.findByText(/1 connu\(s\), 1 préparé\(s\)/)).toBeInTheDocument();

    // Un-knowing a spell un-prepares it too.
    await user.click(knownCheckbox);
    expect(await screen.findByText(/0 connu\(s\), 0 préparé\(s\)/)).toBeInTheDocument();
  });

  it("adds, edits and persists an inventory item", async () => {
    const character = makeTestCharacter();
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("tab", { name: /inventaire/i }));
    await user.click(screen.getByRole("button", { name: /ajouter un objet/i }));
    await user.type(screen.getByLabelText(/^nom$/i), "Corde de soie (15 m)");
    await user.click(screen.getByRole("button", { name: /^enregistrer$/i }));

    await screen.findByText(/enregistré/i);
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.inventory).toEqual([
      expect.objectContaining({ name: "Corde de soie (15 m)", quantity: 1 }),
    ]);
  });

  it("adds and persists a feature (Channel Divinity, domain feature…)", async () => {
    const character = makeTestCharacter();
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("tab", { name: /capacités/i }));
    await user.click(screen.getByRole("button", { name: /ajouter une capacité/i }));
    await user.type(screen.getByLabelText(/^nom$/i), "Châtiment radieux");
    await user.type(screen.getByLabelText(/^source$/i), "Domaine du Crépuscule");
    await user.click(screen.getByRole("button", { name: /^enregistrer$/i }));

    await screen.findByText(/enregistré/i);
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.features).toEqual([
      expect.objectContaining({ name: "Châtiment radieux", source: "Domaine du Crépuscule" }),
    ]);
  });
});
