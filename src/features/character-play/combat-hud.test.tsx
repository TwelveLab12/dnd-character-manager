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

describe("CombatHud — points de vie (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("has no Save button — every action persists immediately", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 10, temporary: 0 } });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.queryByRole("button", { name: /^enregistrer$/i })).not.toBeInTheDocument();
  });

  it("inflicts 1 damage per click on the left chevron, absorbing temporary hit points first", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 10, temporary: 2 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /infliger 1 dégât/i }));
    await user.click(screen.getByRole("button", { name: /infliger 1 dégât/i }));
    await user.click(screen.getByRole("button", { name: /infliger 1 dégât/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints).toEqual({ current: 9, temporary: 0 });
  });

  it("heals 1 point per click on the right chevron, capped at max", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 9, temporary: 0 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    await user.click(screen.getByRole("button", { name: /soigner 1 point de vie/i }));
    await user.click(screen.getByRole("button", { name: /soigner 1 point de vie/i }));

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints).toEqual({ current: 10, temporary: 0 });
  });

  it("edits current hit points directly, clamped to max", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 10, temporary: 0 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const currentInput = screen.getByLabelText(/pv actuels/i);
    await user.clear(currentInput);
    await user.type(currentInput, "999");

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.current).toBe(10);
  });

  it("edits temporary hit points directly, including lowering an existing value", async () => {
    const character = makeTestCharacter({ hitPoints: { current: 10, temporary: 5 } });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const temporaryInput = screen.getByLabelText(/pv temporaires/i);
    await user.clear(temporaryInput);
    await user.type(temporaryInput, "2");

    const persisted = await new LocalStorageCharacterRepository().getById(character.id);
    expect(persisted?.hitPoints.temporary).toBe(2);
  });

  it("describes the hit point ring with current, max and temporary hit points", async () => {
    const character = makeTestCharacter({
      hitPoints: { current: 7, temporary: 4 },
      baseMaxHitPoints: 23,
      themeId: "selune",
    });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });
    expect(
      screen.getByRole("img", { name: "Points de vie 7 sur 23, 4 temporaires" }),
    ).toBeInTheDocument();
  });
});

describe("CombatHud — valeurs de combat (via CharacterPlay)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows AC, initiative, speed, spell save DC and spell attack bonus", async () => {
    const character = makeTestCharacter({
      level: 3,
      initiativeExtraBonus: 1,
      abilityScores: {
        strength: 10,
        dexterity: 14,
        constitution: 10,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
      spellcasting: { ability: "wisdom" },
    });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    const hud = screen.getByRole("region", { name: "Combat" });
    expect(within(hud).getByRole("img", { name: "Classe d'armure 12" })).toBeInTheDocument();
    // Initiative = Dex +2 + bonus 1 ; vitesse = 9 m par défaut (race hors registre).
    expect(within(hud).getByText("Initiative").previousSibling).toHaveTextContent("+3");
    expect(within(hud).getByText("Vitesse").previousSibling).toHaveTextContent("9 m");
    expect(within(hud).getByText("DD sorts").previousSibling).toHaveTextContent("13");
    expect(within(hud).getByText("Attaque sort").previousSibling).toHaveTextContent("+5");
  });

  it("hides the spellcasting tiles for a character without spellcasting", async () => {
    const character = makeTestCharacter();
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.getByText("Initiative")).toBeInTheDocument();
    expect(screen.queryByText("DD sorts")).not.toBeInTheDocument();
    expect(screen.queryByText("Attaque sort")).not.toBeInTheDocument();
  });

  it("shows no attack list when no weapon is equipped", async () => {
    const character = makeTestCharacter();
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    expect(screen.queryByRole("list", { name: "Attaques" })).not.toBeInTheDocument();
  });
});
