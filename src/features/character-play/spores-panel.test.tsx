import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

describe("Entité symbiotique (Cercle des spores)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("activates from the Wild Shape card and adds necrotic damage to a melee attack", async () => {
    // Force 14 (+2), maîtrise +2 : Bâton +4, 1d6+2, niveau 3 : 12 PV temporaires, halo 1d4.
    const character = makeTestCharacter({
      classId: "druide",
      subclassId: "spores",
      level: 3,
      abilityScores: {
        strength: 14,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
      hitPoints: { current: 20, temporary: 0 },
      weaponProficiencies: ["simple"],
      inventory: [
        {
          id: "staff",
          name: "Bâton",
          quantity: 1,
          equipped: true,
          weapon: {
            category: "simple",
            range: "melee",
            damageDice: "1d6",
            damageType: "bludgeoning",
          },
        },
      ],
    });
    const repository = new LocalStorageCharacterRepository();
    await repository.create(character);
    const user = userEvent.setup();
    render(
      <RepositoryProvider>
        <StoreProvider>
          <CharacterPlay characterId={character.id} />
        </StoreProvider>
      </RepositoryProvider>,
    );
    await screen.findByRole("heading", { name: character.name });

    expect(screen.getByText("Halo de spores").parentElement).toHaveTextContent("1d4");
    await user.click(screen.getByRole("button", { name: "Utiliser Entité symbiotique" }));

    const saved = await repository.getById(character.id);
    expect(saved?.symbioticEntity).toBe(true);
    expect(saved?.hitPoints.temporary).toBe(12);
    expect(saved?.classResourcesUsed["wild-shape"]).toBe(1);
    expect(screen.getByText("Halo de spores").parentElement).toHaveTextContent("2d4");

    await user.click(screen.getByRole("button", { name: "Détails : Bâton" }));
    const attack = within(await screen.findByRole("region", { name: "Attaquer" }));
    await user.type(attack.getByLabelText("CA cible"), "10");
    await user.type(attack.getByLabelText("ou dé"), "12");
    await user.click(attack.getByRole("button", { name: "Valider" }));

    expect(attack.getByRole("button", { name: "Lancer 1d6 + 1d6" })).toBeInTheDocument();
    await user.type(attack.getByLabelText("ou total des 1d6"), "4");
    await user.click(attack.getByRole("button", { name: "Valider" }));
    expect(attack.getByText("+ Entité symbiotique : 1d6 nécrotique")).toBeInTheDocument();
    await user.type(attack.getByLabelText("ou total des dés"), "5");
    await user.click(attack.getByRole("button", { name: "Valider" }));

    // Le total de tous les dégâts est le chiffre mis en avant, avec sa répartition.
    expect(attack.getAllByText("11")[0]).toHaveClass("text-4xl");
    expect(attack.getByText("dégâts au total")).toBeInTheDocument();
    expect(attack.getByText("6 contondant + 5 nécrotique")).toBeInTheDocument();
    const [, damageBreakdown] = attack.getAllByLabelText("Détail du calcul");
    expect(damageBreakdown).toHaveTextContent("1d6 4+2 Force+5 1d6 nécrotique=11");
  });
});
