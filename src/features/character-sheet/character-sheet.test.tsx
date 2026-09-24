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
    const gold = screen.getByLabelText("Or");
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

    const nameInput = screen.getByLabelText(/nom du personnage/i);
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

    const nameInput = screen.getByLabelText(/nom du personnage/i);
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

    await user.type(screen.getByLabelText(/nom du personnage/i), "!");
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
    await user.click(screen.getByRole("combobox", { name: "Race" }));
    await user.click(await screen.findByRole("option", { name: "Humain variant" }));

    await user.click(screen.getByRole("button", { name: /^sagesse 15$/i }));
    await user.click(screen.getByRole("button", { name: /^constitution 14$/i }));

    expect(screen.getByRole("button", { name: "Sagesse 15 → 16 (+1)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("2 / 2 choisies")).toBeInTheDocument();

    // Un troisième choix remplace le plus ancien (Sagesse).
    await user.click(screen.getByRole("button", { name: /^force 13$/i }));
    expect(screen.getByRole("button", { name: /^sagesse 15$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await user.click(screen.getByRole("button", { name: /^force 13/i }));
    await user.click(screen.getByRole("button", { name: /^sagesse 15$/i }));

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
    expect(
      within(await screen.findByRole("group", { name: "DD de sauvegarde" })).getByText("13"),
    ).toBeInTheDocument();
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
    const dcTile = await screen.findByRole("group", { name: "DD de sauvegarde" });
    expect(within(dcTile).getByText("13")).toBeInTheDocument();
    expect(within(dcTile).getByText("8 + maîtrise 2 + Sag 3")).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Attaque de sort" })).getByText("+5"),
    ).toBeInTheDocument();
    // Classe hors registre : pas de limite de préparation calculée.
    expect(
      within(screen.getByRole("group", { name: "Sorts préparés" })).getByText("—"),
    ).toBeInTheDocument();

    await user.click(within(dcTile).getByRole("button", { name: /ajuster/i }));
    await user.type(await screen.findByLabelText(/dd de sauvegarde — valeur forcée/i), "99");
    expect(within(dcTile).getByText("99")).toBeInTheDocument();
    expect(within(dcTile).getByText("valeur forcée (calcul : 13)")).toBeInTheDocument();
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
    await user.click(screen.getByRole("combobox", { name: "Classe" }));
    await user.click(await screen.findByRole("option", { name: "Clerc" }));

    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
    expect(await screen.findByText("Niveau 1")).toBeInTheDocument();
    expect(screen.getByText("Niveau 2")).toBeInTheDocument();
    expect(screen.getByText(/clerc niv\. 3/i)).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Caractéristique" })).getByText("Sagesse"),
    ).toBeInTheDocument();

    // Clerc niv. 3 : 4 emplacements de niveau 1 ; toucher un jeton le dépense, le retoucher le rend.
    const levelOnePips = screen.getAllByRole("button", { name: /^emplacement de niveau 1 /i });
    expect(levelOnePips).toHaveLength(4);
    await user.click(levelOnePips[0]!);
    expect(
      screen.getAllByRole("button", { name: /^emplacement de niveau 1 .*dépensé/i }),
    ).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /^emplacement de niveau 1 .*dépensé/i }));
    expect(
      screen.queryAllByRole("button", { name: /^emplacement de niveau 1 .*dépensé/i }),
    ).toHaveLength(0);
  });

  it("adds known spells from the picker and keeps prepared / always-prepared exclusive", async () => {
    const character = makeTestCharacter({ classId: "clerc" });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "bless", name: "Test Bless" }),
      makeTestSpell({ id: "light", name: "Test Light", level: 0 }),
      makeTestSpell({ id: "fireball", name: "Test Fireball", level: 3, classes: ["Wizard"] }),
    ]);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
    expect(await screen.findByText(/aucun sort connu/i)).toBeInTheDocument();

    // Le panneau filtre par défaut sur la classe du personnage.
    await user.click(screen.getByRole("button", { name: /ajouter des sorts/i }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).queryByText("Test Fireball")).not.toBeInTheDocument();
    await user.click(within(panel).getByRole("checkbox", { name: /test bless/i }));
    await user.click(within(panel).getByRole("checkbox", { name: /test light/i }));
    await user.click(within(panel).getByRole("button", { name: "Ajouter 2 sorts" }));

    // Un tour de magie n'a pas de switch : il est toujours disponible.
    expect(await screen.findByText("Toujours disponible")).toBeInTheDocument();
    const prepared = screen.getByRole("switch", { name: "Préparé : Test Bless" });
    const always = screen.getByRole("switch", { name: "Toujours préparé : Test Bless" });

    await user.click(prepared);
    expect(prepared).toBeChecked();

    // Préparé -> toujours préparé : bascule directe.
    await user.click(always);
    expect(always).toBeChecked();
    expect(prepared).not.toBeChecked();

    // Toujours préparé -> préparé : confirmation (Annuler garde l'état).
    await user.click(prepared);
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Annuler" }));
    expect(always).toBeChecked();
    expect(prepared).not.toBeChecked();

    await user.click(prepared);
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Confirmer" }),
    );
    expect(prepared).toBeChecked();
    expect(always).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: /retirer test bless/i }));
    expect(screen.queryByText("Test Bless")).not.toBeInTheDocument();
  });

  it("locks the other Préparé switches once the prepared-spell limit is reached", async () => {
    // Clerc niv. 1, Sagesse 10 (+0) -> limite 1. Un sort toujours préparé ne compte pas.
    const character = makeTestCharacter({
      classId: "clerc",
      knownSpellIds: ["bless", "cure", "shield"],
      spellTags: [{ spellId: "shield", alwaysPrepared: true }],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "bless", name: "Test Bless" }),
      makeTestSpell({ id: "cure", name: "Test Cure" }),
      makeTestSpell({ id: "shield", name: "Test Shield" }),
    ]);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));

    expect(await screen.findByLabelText("0 sorts préparés sur 1")).toBeInTheDocument();
    const bless = screen.getByRole("switch", { name: "Préparé : Test Bless" });
    const cure = screen.getByRole("switch", { name: "Préparé : Test Cure" });
    await user.click(bless);

    expect(screen.getByLabelText("1 sorts préparés sur 1")).toBeInTheDocument();
    expect(cure).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Préparé : Test Shield" })).toBeDisabled();

    await user.click(bless);
    expect(cure).toBeEnabled();
  });

  it("hides preparation for a caster that knows its spells (Sorcerer)", async () => {
    const character = makeTestCharacter({ classId: "ensorceleur", knownSpellIds: ["bless"] });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "bless", name: "Test Bless" }),
    ]);

    const user = userEvent.setup();
    renderSheet(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: /^sorts$/i }));

    expect(await screen.findByText("Test Bless")).toBeInTheDocument();
    expect(screen.getByText(/ne prépare pas ses sorts/i)).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: /préparé : test bless/i })).not.toBeInTheDocument();
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
