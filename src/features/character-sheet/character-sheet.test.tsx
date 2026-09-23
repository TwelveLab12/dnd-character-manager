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
    const character = makeTestCharacter({ name: "Elara Duskwood", class: "Cleric" });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);

    expect(await screen.findByRole("heading", { name: "Elara Duskwood" })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/^nom$/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Elara Duskwood-Crépuscule");
    await user.click(screen.getByRole("button", { name: /^enregistrer$/i }));

    expect(await screen.findByText(/enregistré/i)).toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.name).toBe("Elara Duskwood-Crépuscule");
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
    // Plusieurs compétences liées à la Sagesse affichent aussi +3 (non maîtrisées) : on se limite
    // à la ligne "Sagesse" elle-même pour éviter une correspondance ambiguë.
    const wisdomRow = screen.getByText(/^sagesse$/i).closest(".rounded-lg") as HTMLElement | null;
    if (!wisdomRow) {
      throw new Error("expected a row for Sagesse");
    }
    expect(within(wisdomRow).getByText("+3")).toBeInTheDocument();
    expect(within(wisdomRow).getByText(/sauv\. \+5/i)).toBeInTheDocument();
  });

  it("toggles a skill proficiency and computes its total live on the Caractéristiques tab", async () => {
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
    await user.click(screen.getByRole("tab", { name: /caractéristiques/i }));

    // Médecine (Sagesse) non maîtrisée au départ -> juste le modificateur, +3.
    const medicineCheckbox = screen.getByRole("checkbox", { name: /médecine/i });
    const medicineRow = medicineCheckbox.closest("div");
    if (!medicineRow) {
      throw new Error("expected a row for Médecine");
    }
    expect(within(medicineRow).getByText("+3")).toBeInTheDocument();

    // Maîtrisée -> + bonus de maîtrise (+2 au niveau 3) -> +5.
    await user.click(medicineCheckbox);
    expect(within(medicineRow).getByText("+5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^enregistrer$/i }));
    await screen.findByText(/enregistré/i);
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.skillProficiencies).toEqual(["Médecine"]);
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
