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

describe("PlayDetailSheet (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("opens a feature with uses and uses it from the sheet", async () => {
    const character = makeTestCharacter({
      features: [
        {
          id: "night-eyes",
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

    const card = screen.getByRole("region", { name: "Yeux de la nuit" });
    await user.click(within(card).getByRole("button", { name: "Détails : Yeux de la nuit" }));

    const sheet = await screen.findByRole("dialog", { name: "Yeux de la nuit" });
    expect(within(sheet).getByText("Domaine du Crépuscule")).toBeInTheDocument();
    expect(within(sheet).getByText("Repos long")).toBeInTheDocument();
    expect(within(sheet).getByText("Partagez votre vision dans le noir.")).toBeInTheDocument();
    expect(within(sheet).getByText("Utilisations · 1/1")).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: "Utiliser Yeux de la nuit" }));

    expect(screen.queryByRole("dialog", { name: "Yeux de la nuit" })).not.toBeInTheDocument();
    expect((await repository.getById(character.id))?.features[0]?.usesCurrent).toBe(0);
  });

  it("opens a Channel Divinity option: row shows details, its button spends the pool", async () => {
    const character = makeTestCharacter({
      classId: "clerc",
      subclassId: "crepuscule",
      level: 3,
      features: [
        {
          id: "sanctuary",
          name: "Sanctuaire du Crépuscule",
          source: "Domaine du Crépuscule",
          description: "Une sphère de pénombre apaisante.",
        },
      ],
    });
    const repository = new LocalStorageCharacterRepository();
    await repository.create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const card = screen.getByRole("region", { name: "Canalisation divine" });
    // Option des règles sans texte propre : la description vient de la capacité de même nom.
    await user.click(
      within(card).getByRole("button", { name: "Détails : Sanctuaire du Crépuscule" }),
    );
    let sheet = await screen.findByRole("dialog", { name: "Sanctuaire du Crépuscule" });
    expect(within(sheet).getByText("Une sphère de pénombre apaisante.")).toBeInTheDocument();
    expect(within(sheet).getByText("Canalisation divine · 1/1")).toBeInTheDocument();
    // Ouvrir le détail ne dépense rien.
    expect((await repository.getById(character.id))?.classResourcesUsed).toEqual({});

    await user.click(
      within(sheet).getByRole("button", { name: "Utiliser Sanctuaire du Crépuscule" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Sanctuaire du Crépuscule" }),
    ).not.toBeInTheDocument();
    expect((await repository.getById(character.id))?.classResourcesUsed).toEqual({
      "channel-divinity": 1,
    });

    // Option des règles sans capacité de même nom : invitation à en créer une.
    await user.click(
      within(card).getByRole("button", { name: "Détails : Renvoi des morts-vivants" }),
    );
    sheet = await screen.findByRole("dialog", { name: "Renvoi des morts-vivants" });
    expect(
      within(sheet).getByText(/crée une capacité « Renvoi des morts-vivants »/),
    ).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Ajouter une description" })).toHaveAttribute(
      "href",
      `/characters/${character.id}/edit?tab=features`,
    );
    expect(
      within(sheet).getByRole("button", { name: "Utiliser Renvoi des morts-vivants" }),
    ).toBeDisabled();
  });

  it("opens a weapon attack with its computed values and item description", async () => {
    const character = makeTestCharacter({
      inventory: [
        {
          id: "mace",
          name: "Masse d'armes",
          quantity: 1,
          equipped: true,
          description: "Gravée de croissants de lune.",
          weapon: {
            category: "simple",
            range: "melee",
            damageDice: "1d6",
            damageType: "bludgeoning",
          },
        },
      ],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: "Détails : Masse d'armes" }));

    const sheet = await screen.findByRole("dialog", { name: "Masse d'armes" });
    expect(within(sheet).getByText("Arme · Corps à corps")).toBeInTheDocument();
    expect(within(sheet).getByText("contondant")).toBeInTheDocument();
    expect(within(sheet).getByText("Force")).toBeInTheDocument();
    expect(within(sheet).getByText("Gravée de croissants de lune.")).toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: /utiliser/i })).not.toBeInTheDocument();
  });

  it("opens a feat from the Capacités tab, read-only when it has no uses", async () => {
    const character = makeTestCharacter({
      features: [
        {
          id: "war-caster",
          name: "Lanceur de sorts de bataille",
          source: "Don",
          description: "Avantage aux jets de concentration.",
        },
        {
          id: "no-text",
          name: "Robuste",
          source: "Don",
          description: "",
        },
      ],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: "Capacités" }));

    await user.click(
      screen.getByRole("button", { name: "Détails : Lanceur de sorts de bataille" }),
    );
    let sheet = await screen.findByRole("dialog", { name: "Lanceur de sorts de bataille" });
    expect(within(sheet).getByText("Don")).toBeInTheDocument();
    expect(within(sheet).getByText("Avantage aux jets de concentration.")).toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: /utiliser/i })).not.toBeInTheDocument();
    await user.click(within(sheet).getByRole("button", { name: "Fermer" }));

    await user.click(screen.getByRole("button", { name: "Détails : Robuste" }));
    sheet = await screen.findByRole("dialog", { name: "Robuste" });
    expect(within(sheet).getByText("Pas de description.")).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Ajouter une description" })).toHaveAttribute(
      "href",
      `/characters/${character.id}/edit?tab=features`,
    );
  });

  it("uses a feature linked to Channel Divinity from its sheet in the Capacités tab", async () => {
    const character = makeTestCharacter({
      classId: "clerc",
      level: 2,
      features: [
        {
          id: "turn",
          name: "Renvoi des morts-vivants",
          source: "Clerc",
          description: "Les morts-vivants fuient.",
          resourceId: "channel-divinity",
        },
      ],
    });
    const repository = new LocalStorageCharacterRepository();
    await repository.create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: "Capacités" }));

    await user.click(screen.getByRole("button", { name: "Détails : Renvoi des morts-vivants" }));
    const sheet = await screen.findByRole("dialog", { name: "Renvoi des morts-vivants" });
    expect(within(sheet).getByText("Canalisation divine · 1/1")).toBeInTheDocument();
    await user.click(
      within(sheet).getByRole("button", { name: "Utiliser Renvoi des morts-vivants" }),
    );

    expect((await repository.getById(character.id))?.classResourcesUsed).toEqual({
      "channel-divinity": 1,
    });
  });

  it("opens an inventory item from the Inventaire tab; the stepper keeps its own action", async () => {
    const character = makeTestCharacter({
      inventory: [
        {
          id: "rope",
          name: "Corde en chanvre",
          quantity: 2,
          weight: 5,
          description: "15 mètres.",
        },
        {
          id: "mail",
          name: "Cotte de mailles",
          quantity: 1,
          equipped: true,
          armor: { category: "heavy", baseArmorClass: 16, strengthRequirement: 13 },
        },
      ],
    });
    const repository = new LocalStorageCharacterRepository();
    await repository.create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    await user.click(screen.getByRole("tab", { name: "Inventaire" }));

    await user.click(screen.getByRole("button", { name: "Ajouter 1 Corde en chanvre" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((await repository.getById(character.id))?.inventory[0]?.quantity).toBe(3);

    await user.click(screen.getByRole("button", { name: "Détails : Corde en chanvre" }));
    let sheet = await screen.findByRole("dialog", { name: "Corde en chanvre" });
    expect(within(sheet).getByText("Objet")).toBeInTheDocument();
    expect(within(sheet).getByText("3")).toBeInTheDocument();
    expect(within(sheet).getByText("5 kg")).toBeInTheDocument();
    expect(within(sheet).getByText("15 mètres.")).toBeInTheDocument();
    await user.click(within(sheet).getByRole("button", { name: "Fermer" }));

    await user.click(screen.getByRole("button", { name: "Détails : Cotte de mailles" }));
    sheet = await screen.findByRole("dialog", { name: "Cotte de mailles" });
    expect(within(sheet).getByText("Armure lourde")).toBeInTheDocument();
    expect(within(sheet).getByText("Équipé")).toBeInTheDocument();
    expect(within(sheet).getByText("16")).toBeInTheDocument();
    expect(within(sheet).getByText("13")).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Ajouter une description" })).toHaveAttribute(
      "href",
      `/characters/${character.id}/edit?tab=inventory`,
    );
  });
});
