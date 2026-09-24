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

describe("CharacterPlay", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows a not-found message for an unknown id", async () => {
    renderPlay("does-not-exist");
    expect(await screen.findByText(/personnage introuvable/i)).toBeInTheDocument();
  });

  it("loads an existing character and shows its identity, level and an edit link", async () => {
    const character = makeTestCharacter({
      name: "Elara Duskwood",
      class: "Cleric",
      subclass: "Domaine de la Lune",
      level: 5,
      race: "Humain variant",
      background: "Acolyte",
    });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);

    expect(await screen.findByRole("heading", { name: "Elara Duskwood" })).toBeInTheDocument();
    expect(
      screen.getByText("Cleric — Domaine de la Lune · Humain variant · Acolyte"),
    ).toBeInTheDocument();
    expect(screen.getByText("niv.")).toHaveTextContent("niv. 5");
    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      `/characters/${character.id}/edit`,
    );
  });

  it("opens on the Combat tab, orders the tabs and keeps a CA/PV summary above every tab", async () => {
    const character = makeTestCharacter({
      background: "Ermite",
      inventory: [{ id: "item-1", name: "Sac à dos", quantity: 1 }],
      features: [{ id: "feature-1", name: "Vision dans le noir", source: "Race", description: "" }],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Combat",
      "Caractéristiques",
      "Sorts",
      "Inventaire",
      "Capacités",
      "Notes",
    ]);
    expect(screen.getByRole("tab", { name: "Combat" })).toHaveAttribute("aria-selected", "true");
    const combat = screen.getByRole("tabpanel");
    expect(within(combat).getByRole("img", { name: /classe d'armure/i })).toBeInTheDocument();
    expect(within(combat).getByRole("img", { name: /points de vie/i })).toBeInTheDocument();
    expect(within(combat).getByRole("switch", { name: /concentration/i })).toBeInTheDocument();
    expect(within(combat).getByRole("button", { name: /^repos court$/i })).toBeInTheDocument();

    for (const tabName of ["Caractéristiques", "Sorts", "Inventaire", "Capacités", "Notes"]) {
      await user.click(screen.getByRole("tab", { name: tabName }));
      const summary = screen.getByRole("region", { name: "Résumé" });
      expect(summary).toHaveTextContent("CA10");
      expect(summary).toHaveTextContent("PV10 / 10");
      expect(screen.queryByRole("img", { name: /classe d'armure/i })).not.toBeInTheDocument();
    }

    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByRole("heading", { name: "Règles appliquées" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Inventaire" }));
    expect(screen.getByText("Sac à dos")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Capacités" }));
    expect(screen.getByText("Vision dans le noir")).toBeInTheDocument();
  });

  it("lists the automatically applied rules and the free notes in the Notes tab", async () => {
    const character = makeTestCharacter({
      abilityScores: {
        strength: 13,
        dexterity: 8,
        constitution: 14,
        intelligence: 12,
        wisdom: 15,
        charisma: 10,
      },
      raceSelection: { raceId: "humain-variant", abilityBonusChoices: ["constitution", "wisdom"] },
      notes: "Symbole sacré : pendentif lunaire",
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.queryByRole("tab", { name: "Général" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(
      screen.getByText(
        "Bonus racial (Humain variant) : Constitution 14 → 15 (+1), Sagesse 15 → 16 (+1)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Symbole sacré : pendentif lunaire")).toBeInTheDocument();
  });

  it("highlights the saving throw total and proficiency of each ability in the Caractéristiques tab", async () => {
    const character = makeTestCharacter({
      level: 5,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
      savingThrowProficiencies: ["wisdom"],
      skillProficiencies: ["Perception"],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: "Caractéristiques" }));

    const wisdom = screen.getByRole("region", { name: "Sagesse" });
    expect(wisdom).toHaveTextContent("Jet de sauvegarde +6");
    expect(within(wisdom).getByText("mod. +3 · score 16")).toBeInTheDocument();
    expect(within(wisdom).getByText("Maîtrisé")).toBeInTheDocument();

    const strength = screen.getByRole("region", { name: "Force" });
    expect(strength).toHaveTextContent("Jet de sauvegarde +0");
    expect(within(strength).getByText("Non maîtrisé")).toBeInTheDocument();

    expect(screen.getByText("Perception passive").nextSibling).toHaveTextContent("16");
  });

  it("lets the player adjust bag quantities and the purse from the Inventaire tab", async () => {
    const character = makeTestCharacter({
      inventory: [
        { id: "torch", name: "Torches", quantity: 2, weight: 0.5 },
        {
          id: "mace",
          name: "Masse d'armes",
          quantity: 1,
          weapon: {
            category: "simple",
            range: "melee",
            damageDice: "1d6",
            damageType: "bludgeoning",
          },
        },
      ],
      currency: { platinum: 0, gold: 47, electrum: 0, silver: 23, copper: 15 },
    });
    const repository = new LocalStorageCharacterRepository();
    await repository.create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: "Inventaire" }));

    expect(screen.getByRole("link", { name: "Modifier l’inventaire" })).toHaveAttribute(
      "href",
      `/characters/${character.id}/edit?tab=inventory`,
    );
    expect(screen.getByText("2 objets · 1 kg")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Armes & armures" })).getByText("Masse d'armes"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ajouter 1 Torches" }));
    expect(await screen.findByText("2 objets · 1,5 kg")).toBeInTheDocument();

    const purse = screen.getByRole("region", { name: "Bourse" });
    expect(within(purse).getByText("49,45")).toBeInTheDocument();
    const gold = within(purse).getByLabelText("Or");
    await user.clear(gold);
    await user.type(gold, "50{Enter}");
    expect(await within(purse).findByText("52,45")).toBeInTheDocument();

    const stored = await repository.getById(character.id);
    expect(stored?.inventory.find((item) => item.id === "torch")?.quantity).toBe(3);
    expect(stored?.currency?.gold).toBe(50);
  });

  it("puts features with uses first, in the Capacités tab and in the combat HUD", async () => {
    const character = makeTestCharacter({
      features: [
        {
          id: "skill",
          name: "Compétence supplémentaire",
          source: "Race",
          description: "Une compétence.",
        },
        {
          id: "eyes",
          name: "Yeux de la nuit",
          source: "Domaine du Crépuscule",
          description: "Partagez votre vision dans le noir.",
          usesMax: 1,
          recharge: "longRest",
        },
      ],
    });
    const repository = new LocalStorageCharacterRepository();
    await repository.create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    // Bandeau de combat : la carte est là avant même d'ouvrir l'onglet.
    const hud = screen.getByRole("region", { name: "Combat" });
    expect(within(hud).getByRole("region", { name: "Yeux de la nuit" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Capacités" }));
    const panel = screen.getByRole("tabpanel");
    expect(screen.getByRole("link", { name: "Modifier les capacités" })).toHaveAttribute(
      "href",
      `/characters/${character.id}/edit?tab=features`,
    );
    const card = within(panel).getByRole("region", { name: "Yeux de la nuit" });
    expect(within(card).getByText("Repos long")).toBeInTheDocument();
    expect(within(card).getByText("Partagez votre vision dans le noir.")).toBeInTheDocument();
    expect(within(panel).getByRole("region", { name: "Race" })).toHaveTextContent(
      "Compétence supplémentaire",
    );

    await user.click(within(card).getByRole("button", { name: "Utiliser Yeux de la nuit" }));
    expect(await within(card).findByText("Revient au prochain repos long")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Utiliser Yeux de la nuit" })).toBeDisabled();
    expect((await repository.getById(character.id))?.features[1]?.usesCurrent).toBe(0);

    await user.click(within(card).getByRole("button", { name: "Récupérer : Yeux de la nuit" }));
    expect(await within(card).findByText("Disponible")).toBeInTheDocument();
  });

  it("shows no editable inputs on the read-only mirror tabs", async () => {
    const character = makeTestCharacter({
      background: "Ermite",
      inventory: [{ id: "item-1", name: "Sac à dos", quantity: 1 }],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("tab", { name: "Notes" }));
    let panel = screen.getByRole("tabpanel");
    expect(within(panel).queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Caractéristiques" }));
    panel = screen.getByRole("tabpanel");
    expect(within(panel).queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(within(panel).queryByRole("switch")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Inventaire" }));
    panel = screen.getByRole("tabpanel");
    expect(within(panel).queryByRole("textbox")).not.toBeInTheDocument();
  });
});
