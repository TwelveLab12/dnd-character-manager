import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { Spell } from "@/domain/spell";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { LocalStorageSpellRepository } from "@/repositories/local-storage/local-storage-spell-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

const shillelagh: Spell = {
  id: "shillelagh",
  name: "Gourdin magique",
  level: 0,
  school: "Transmutation",
  castingTime: "1 action bonus",
  range: "Contact",
  components: { verbal: true, somatic: true, material: true },
  duration: "1 minute",
  concentration: false,
  ritual: false,
  description: "",
  classes: ["Druide"],
};

describe("Gourdin magique depuis l'arme", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("enchants the quarterstaff in hand, then ends", async () => {
    const character = makeTestCharacter({
      classId: "druide",
      level: 3,
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 17,
        charisma: 10,
      },
      weaponProficiencies: ["simple"],
      knownSpellIds: [shillelagh.id],
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
            versatileDamageDice: "1d8",
            damageType: "bludgeoning",
          },
        },
      ],
    });
    const repository = new LocalStorageCharacterRepository();
    await repository.create(character);
    await new LocalStorageSpellRepository().upsertMany([shillelagh]);

    const user = userEvent.setup();
    render(
      <RepositoryProvider>
        <StoreProvider>
          <CharacterPlay characterId={character.id} />
        </StoreProvider>
      </RepositoryProvider>,
    );
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: "Détails : Bâton" }));
    const sheet = await screen.findByRole("dialog", { name: "Bâton" });
    await user.click(await within(sheet).findByRole("button", { name: "Lancer Gourdin magique" }));

    expect((await repository.getById(character.id))?.shillelagh).toEqual({ itemId: "staff" });
    expect(within(sheet).getByText("Sagesse au lieu de la Force, au toucher et aux dégâts"));
    expect(within(sheet).getByText("1d8+3")).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: "Mettre fin" }));
    expect((await repository.getById(character.id))?.shillelagh).toBeUndefined();
  });
});
