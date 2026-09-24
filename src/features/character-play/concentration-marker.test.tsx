import { render, screen } from "@testing-library/react";
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

describe("ConcentrationMarker (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("toggles concentration on and off, persisting immediately", async () => {
    const character = makeTestCharacter({ concentration: { active: false } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const toggle = screen.getByRole("switch", { name: /^concentration$/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.concentration.active).toBe(true);

    await user.click(toggle);
    const persistedAgain = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persistedAgain?.concentration.active).toBe(false);
  });
});

describe("Armor class in play mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("forgets the concentration spell when concentration is turned off", async () => {
    const character = makeTestCharacter({
      concentration: { active: true, spellId: "shield-of-faith" },
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("switch", { name: /^concentration$/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.concentration).toEqual({ active: false });
  });

  it("toggles a manual armor class effect and shows the computed AC", async () => {
    const character = makeTestCharacter({
      armorClassEffects: [
        { id: "shield", name: "Bouclier", bonus: 5, trigger: { type: "manual", active: false } },
      ],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.getByText("Base 10 + Dex 0")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: /bouclier \(\+5 ca\)/i }));

    expect(await screen.findByText("Base 10 + Dex 0 + Bouclier 5")).toBeInTheDocument();
    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.armorClassEffects?.[0]?.trigger).toEqual({ type: "manual", active: true });
  });
});

describe("Weapon attacks in play mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows computed attack bonus and damage of equipped weapons", async () => {
    const character = makeTestCharacter({
      level: 5,
      abilityScores: {
        strength: 16,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      weaponProficiencies: ["simple"],
      inventory: [
        {
          id: "longsword",
          name: "Épée longue",
          quantity: 1,
          equipped: true,
          weapon: {
            category: "martial",
            range: "melee",
            damageDice: "1d8",
            versatileDamageDice: "1d10",
            damageType: "slashing",
          },
        },
      ],
    });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText(/1d8\+3 tranchant · 1d10\+3 à deux mains/)).toBeInTheDocument();
    expect(screen.getByText(/non maîtrisée/i)).toBeInTheDocument();
  });

  it("shows martial arts, thrown range and the unarmed strike for a monk", async () => {
    const character = makeTestCharacter({
      level: 5,
      martialArts: true,
      abilityScores: {
        strength: 10,
        dexterity: 16,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      inventory: [
        {
          id: "dagger",
          name: "Dague",
          quantity: 1,
          equipped: true,
          weapon: {
            category: "simple",
            range: "melee",
            damageDice: "1d4",
            damageType: "piercing",
            finesse: true,
            thrown: { normal: 6, long: 18 },
          },
        },
      ],
    });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.getByText("Mains nues")).toBeInTheDocument();
    expect(screen.getByText("Lancer 6/18 m")).toBeInTheDocument();
    expect(screen.getAllByText("Arts martiaux")).toHaveLength(2);
    expect(screen.getByText("1d6+3 perforant")).toBeInTheDocument();
  });
});
