import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

describe("Forme sauvage (mode jeu)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("turns into a saved beast, fights with its HP and attacks, then reverts", async () => {
    const character = makeTestCharacter({
      classId: "druide",
      level: 3,
      hitPoints: { current: 20, temporary: 0 },
      wildShapeForms: [
        {
          id: "wolf",
          name: "Loup",
          challengeRating: "1/4",
          strength: 12,
          dexterity: 15,
          constitution: 12,
          armorClass: 13,
          maxHitPoints: 11,
          speed: 12,
          attacks: [
            {
              id: "bite",
              name: "Morsure",
              attackBonus: 4,
              damageDice: "2d4",
              damageBonus: 2,
              damageType: "piercing",
            },
          ],
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

    await user.click(screen.getByRole("button", { name: "Se transformer : Loup" }));

    const saved = await repository.getById(character.id);
    expect(saved?.wildShape).toEqual({ formId: "wolf", hitPoints: 11 });
    expect(saved?.classResourcesUsed["wild-shape"]).toBe(1);
    expect(screen.getByLabelText("PV actuels (Loup)")).toHaveValue(11);
    expect(screen.getByRole("list", { name: "Attaques" })).toHaveTextContent("Morsure");
    expect(screen.getByRole("list", { name: "Attaques" })).toHaveTextContent("2d4+2 perforant");

    await user.click(screen.getByRole("button", { name: "Infliger 1 dégât" }));
    expect((await repository.getById(character.id))?.wildShape?.hitPoints).toBe(10);
    expect((await repository.getById(character.id))?.hitPoints.current).toBe(20);

    await user.click(screen.getByRole("button", { name: "Reprendre ma forme" }));
    expect((await repository.getById(character.id))?.wildShape).toBeUndefined();
    expect(screen.getByLabelText("PV actuels")).toHaveValue(20);
  });
});
