import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { LocalStorageSpellRepository } from "@/repositories/local-storage/local-storage-spell-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter, makeTestSpell } from "@/test/fixtures";
import { CharacterSheet } from "./character-sheet";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function renderSheet(characterId: string, initialTab?: string) {
  return render(
    <RepositoryProvider>
      <StoreProvider>
        <CharacterSheet characterId={characterId} initialTab={initialTab} />
      </StoreProvider>
    </RepositoryProvider>,
  );
}

describe("CharacterSheet", () => {
  beforeEach(() => {
    window.localStorage.clear();
    push.mockClear();
  });

  it("shows a not-found message for an unknown id", async () => {
    renderSheet("does-not-exist");
    expect(await screen.findByText(/personnage introuvable/i)).toBeInTheDocument();
  });

  it("opens the requested tab and edits the purse there", async () => {
    const character = makeTestCharacter({ name: "Elara Duskwood" });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id, "inventory");
    await screen.findByRole("heading", { name: "Elara Duskwood" });

    expect(screen.getByRole("tab", { name: "Inventaire" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const gold = screen.getByLabelText("Or (po)");
    expect(gold).toHaveValue(0);
    await user.clear(gold);
    await user.type(gold, "12");
    await user.click(screen.getByRole("button", { name: /^enregistrer$/i }));

    expect(await screen.findByText(/enregistré/i)).toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.currency?.gold).toBe(12);
  });

  it("falls back to the Général tab for an unknown tab", async () => {
    const character = makeTestCharacter({ name: "Elara Duskwood" });
    await new LocalStorageCharacterRepository().create(character);

    renderSheet(character.id, "nope");
    await screen.findByRole("heading", { name: "Elara Duskwood" });
    expect(screen.getByRole("tab", { name: "Général" })).toHaveAttribute("aria-selected", "true");
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

  it("links to the character's play sheet without prompting when nothing changed", async () => {
    const character = makeTestCharacter({ name: "Elara Duskwood" });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: "Elara Duskwood" });

    const sheetLink = screen.getByRole("link", { name: /voir la fiche/i });
    expect(sheetLink).toHaveAttribute("href", `/characters/${character.id}`);

    await user.click(sheetLink);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("asks before leaving with unsaved changes, and can save then navigate", async () => {
    const character = makeTestCharacter({ name: "Elara Duskwood" });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: "Elara Duskwood" });

    const nameInput = screen.getByLabelText(/^nom$/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Elara la Grise");
    await user.click(screen.getByRole("link", { name: /voir la fiche/i }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /enregistrer et quitter/i }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith(`/characters/${character.id}`));
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.name).toBe("Elara la Grise");
  });

  it("can leave without saving from the unsaved-changes prompt", async () => {
    const character = makeTestCharacter({ name: "Elara Duskwood" });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: "Elara Duskwood" });

    await user.type(screen.getByLabelText(/^nom$/i), "!");
    await user.click(screen.getByRole("link", { name: /mes personnages/i }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /quitter sans enregistrer/i }));

    expect(push).toHaveBeenCalledWith("/");
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.name).toBe("Elara Duskwood");
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

  it("applies a chosen race's ability bonus (Humain variant) to the effective score everywhere", async () => {
    const character = makeTestCharacter({
      abilityScores: {
        strength: 13,
        dexterity: 8,
        constitution: 14,
        intelligence: 12,
        wisdom: 15,
        charisma: 10,
      },
      level: 3,
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });

    // Général : choisir Humain variant, puis Sagesse + Constitution pour le bonus au choix.
    await user.click(screen.getByRole("combobox", { name: /race \(bonus/i }));
    await user.click(await screen.findByRole("option", { name: "Humain variant" }));

    await user.click(screen.getByRole("combobox", { name: /choix 1/i }));
    await user.click(await screen.findByRole("option", { name: "Sagesse" }));

    await user.click(screen.getByRole("combobox", { name: /choix 2/i }));
    await user.click(await screen.findByRole("option", { name: "Constitution" }));

    // L'ordre d'affichage suit l'ordre canonique des caractéristiques (Constitution avant
    // Sagesse), pas l'ordre dans lequel elles ont été choisies.
    expect(
      await screen.findByText(/constitution 14 → 15 \(\+1\), sagesse 15 → 16 \(\+1\)/i),
    ).toBeInTheDocument();

    // Caractéristiques : le modificateur affiché doit utiliser le score EFFECTIF (16 -> +3), pas
    // le score de base saisi (15 -> +2).
    await user.click(screen.getByRole("tab", { name: /caractéristiques/i }));
    const wisdomRow = screen.getByText(/^sagesse/i).closest(".rounded-lg") as HTMLElement | null;
    if (!wisdomRow) {
      throw new Error("expected a row for Sagesse");
    }
    expect(within(wisdomRow).getByText("+3")).toBeInTheDocument();

    // Sorts : le DD utilise aussi le score effectif (16, mod +3) -> DD 8+2+3=13.
    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
    await user.click(screen.getByRole("button", { name: /activer l.incantation/i }));
    expect(await screen.findByText(/dd de sauvegarde — 13/i)).toBeInTheDocument();
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
    const medicineSwitch = screen.getByRole("switch", { name: /médecine/i });
    const medicineRow = medicineSwitch.closest("div");
    if (!medicineRow) {
      throw new Error("expected a row for Médecine");
    }
    expect(within(medicineRow).getByText("+3")).toBeInTheDocument();

    // Maîtrisée -> + bonus de maîtrise (+2 au niveau 3) -> +5.
    await user.click(medicineSwitch);
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

  it("computes spell slots from the class chosen in the General tab", async () => {
    const character = makeTestCharacter({ level: 3 });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
    expect(screen.getByText(/aucun emplacement/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^général$/i }));
    await user.click(screen.getByRole("combobox", { name: /classe \(règles/i }));
    await user.click(await screen.findByRole("option", { name: "Clerc" }));

    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
    expect(await screen.findByText("Niveau 1")).toBeInTheDocument();
    expect(screen.getByText("Niveau 2")).toBeInTheDocument();
    expect(screen.getByText("Calculés : Clerc niv. 3")).toBeInTheDocument();
    expect(screen.getByText(/sagesse/i)).toBeInTheDocument();
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

    const knownSwitch = within(row).getAllByRole("switch")[0];
    const preparedSwitch = within(row).getAllByRole("switch")[1];
    if (!knownSwitch || !preparedSwitch) {
      throw new Error("expected known/prepared switches");
    }

    await user.click(knownSwitch);
    expect(await screen.findByText(/1 connu\(s\), 0 préparé\(s\)/)).toBeInTheDocument();

    await user.click(preparedSwitch);
    expect(await screen.findByText(/1 connu\(s\), 1 préparé\(s\)/)).toBeInTheDocument();

    // Un-knowing a spell un-prepares it too.
    await user.click(knownSwitch);
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
