import { render, screen, within } from "@testing-library/react";
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

async function openSpellsTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("tab", { name: /^sorts$/i }));
}

describe("SpellsViewTab (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows prepared, always-available and known cantrips, not merely-known spells", async () => {
    const character = makeTestCharacter({
      knownSpellIds: ["cure-wounds", "guidance", "moonbeam", "bless"],
      preparedSpellIds: ["cure-wounds"],
      spellTags: [{ spellId: "moonbeam", domain: "Domaine de la Lune", alwaysPrepared: true }],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "cure-wounds", name: "Soins", level: 1 }),
      makeTestSpell({ id: "guidance", name: "Assistance", level: 0 }),
      makeTestSpell({ id: "moonbeam", name: "Rayon lunaire", level: 2 }),
      makeTestSpell({ id: "bless", name: "Bénédiction", level: 1 }),
    ]);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await openSpellsTab(user);

    expect(await screen.findByText("Soins")).toBeInTheDocument();
    expect(screen.getByText("Rayon lunaire")).toBeInTheDocument();
    // Tour de magie connu : toujours disponible (5e 2014).
    expect(screen.getByText("Assistance")).toBeInTheDocument();
    expect(screen.queryByText("Bénédiction")).not.toBeInTheDocument();
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
    await openSpellsTab(user);
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
    await openSpellsTab(user);
    await screen.findByText("Soins");

    await user.click(screen.getByRole("button", { name: "Domaine de la Lune" }));

    expect(screen.getByText("Rayon lunaire")).toBeInTheDocument();
    expect(screen.queryByText("Soins")).not.toBeInTheDocument();
  });

  const WISDOM_16 = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 16,
    charisma: 10,
  };

  it("casts a concentration spell: spends the lowest slot and starts concentration", async () => {
    // Clerc niv. 3 : 4 emplacements de niveau 1, 2 de niveau 2.
    const character = makeTestCharacter({
      classId: "clerc",
      level: 3,
      abilityScores: WISDOM_16,
      knownSpellIds: ["bless", "cure"],
      preparedSpellIds: ["bless", "cure"],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "bless", name: "Bénédiction", level: 1, concentration: true }),
      makeTestSpell({ id: "cure", name: "Soins", level: 1 }),
    ]);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await openSpellsTab(user);

    const bless = await screen.findByRole("article", { name: "Bénédiction" });
    expect(within(bless).getByText("Concentration")).toBeInTheDocument();
    await user.click(within(bless).getByRole("button", { name: "Lancer · niv. 1" }));

    expect(await within(bless).findByText("En concentration")).toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.spellSlotsUsed).toEqual({ "1": 1 });
    expect(persisted?.concentration).toEqual({ active: true, spellId: "bless" });

    // Un sort sans concentration ne touche pas à la concentration ; il peut être lancé plus haut.
    const cure = screen.getByRole("article", { name: "Soins" });
    await user.click(within(cure).getByRole("button", { name: /autres options/i }));
    await user.click(await screen.findByRole("menuitem", { name: /emplacement niv\. 2/i }));
    const after = await new LocalStorageCharacterRepository().getById(character.id);
    expect(after?.spellSlotsUsed).toEqual({ "1": 1, "2": 1 });
    expect(after?.concentration).toEqual({ active: true, spellId: "bless" });
  });

  it("opens the spell detail sheet from the card and casts from it", async () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 3,
      abilityScores: WISDOM_16,
      knownSpellIds: ["bless", "moonbeam"],
      preparedSpellIds: ["bless", "moonbeam"],
      concentration: { active: true, spellId: "moonbeam" },
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({
        id: "bless",
        name: "Bénédiction",
        level: 1,
        concentration: true,
        description: "Jusqu'à trois créatures ajoutent un d4.",
        higherLevel: "Une créature de plus par niveau.",
        components: {
          verbal: true,
          somatic: true,
          material: true,
          materialDescription: "eau bénite",
        },
      }),
      makeTestSpell({ id: "moonbeam", name: "Rayon lunaire", level: 2, concentration: true }),
    ]);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await openSpellsTab(user);

    // « Lancer » sur la carte lance sans ouvrir le panneau.
    const bless = await screen.findByRole("article", { name: "Bénédiction" });
    expect(within(bless).queryByText(/trois créatures/)).not.toBeInTheDocument();
    await user.click(within(bless).getByRole("button", { name: "Détails : Bénédiction" }));

    const sheet = await screen.findByRole("dialog", { name: "Bénédiction" });
    expect(within(sheet).getByText("Niveau 1 · Evocation")).toBeInTheDocument();
    expect(within(sheet).getByText("Jusqu'à trois créatures ajoutent un d4.")).toBeInTheDocument();
    expect(within(sheet).getByText("Une créature de plus par niveau.")).toBeInTheDocument();
    expect(within(sheet).getByText("V · S · M")).toBeInTheDocument();
    expect(within(sheet).getByText("Matériel : eau bénite")).toBeInTheDocument();
    expect(
      within(sheet).getByText("Remplacera la concentration sur Rayon lunaire"),
    ).toBeInTheDocument();
    expect(within(sheet).getByText("Emplacements niv. 1 · 4/4")).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: "Lancer · niv. 1" }));

    expect(screen.queryByRole("dialog", { name: "Bénédiction" })).not.toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.spellSlotsUsed).toEqual({ "1": 1 });
    expect(persisted?.concentration).toEqual({ active: true, spellId: "bless" });
  });

  it("closes the spell detail sheet with the close button", async () => {
    const character = makeTestCharacter({
      knownSpellIds: ["cure"],
      preparedSpellIds: ["cure"],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "cure", name: "Soins", level: 1 }),
    ]);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await openSpellsTab(user);

    await user.click(await screen.findByRole("button", { name: "Détails : Soins" }));
    const sheet = await screen.findByRole("dialog", { name: "Soins" });
    await user.click(within(sheet).getByRole("button", { name: "Fermer" }));

    expect(screen.queryByRole("dialog", { name: "Soins" })).not.toBeInTheDocument();
  });

  it("offers the ritual when no slot is left, and disables other spells", async () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 1,
      abilityScores: WISDOM_16,
      spellSlotsUsed: { "1": 2 },
      knownSpellIds: ["detect", "cure"],
      preparedSpellIds: ["detect", "cure"],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "detect", name: "Détection", level: 1, ritual: true }),
      makeTestSpell({ id: "cure", name: "Soins", level: 1 }),
    ]);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await openSpellsTab(user);

    const cure = await screen.findByRole("article", { name: "Soins" });
    expect(within(cure).getByRole("button", { name: /plus d.emplacement/i })).toBeDisabled();
    const detect = screen.getByRole("article", { name: "Détection" });
    await user.click(within(detect).getByRole("button", { name: "Rituel" }));
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.spellSlotsUsed).toEqual({ "1": 2 });
  });

  it("prepares spells from play mode within the prepared-spell limit", async () => {
    // Clerc niv. 1, Sagesse 10 -> limite 1 ; le sort toujours préparé ne compte pas.
    const character = makeTestCharacter({
      classId: "clerc",
      knownSpellIds: ["bless", "cure", "shield"],
      spellTags: [{ spellId: "shield", alwaysPrepared: true }],
    });
    await new LocalStorageCharacterRepository().create(character);
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "bless", name: "Bénédiction", level: 1 }),
      makeTestSpell({ id: "cure", name: "Soins", level: 1 }),
      makeTestSpell({ id: "shield", name: "Bouclier de la foi", level: 1 }),
    ]);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await openSpellsTab(user);
    expect(screen.queryByRole("article", { name: "Soins" })).not.toBeInTheDocument();
    // Le sort toujours préparé a sa propre identité : il ne peut pas être remplacé.
    const shield = await screen.findByRole("article", { name: "Bouclier de la foi" });
    expect(within(shield).getByText("Toujours préparé")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /préparer les sorts/i }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByText("Toujours préparé")).toBeInTheDocument();
    await user.click(within(panel).getByRole("switch", { name: "Préparer Soins" }));

    expect(within(panel).getByRole("switch", { name: "Préparer Bénédiction" })).toBeDisabled();
    expect(within(panel).getByText(/limite atteinte/i)).toBeInTheDocument();
    // Fermer le panneau : la carte du sort préparé apparaît dans l'onglet.
    await user.keyboard("{Escape}");
    expect(await screen.findByRole("article", { name: "Soins" })).toBeInTheDocument();
  });
});
