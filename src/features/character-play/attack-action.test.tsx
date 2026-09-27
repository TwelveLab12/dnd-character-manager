import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageActivityLogRepository } from "@/repositories/local-storage/local-storage-activity-log-repository";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

// Force 16 (+3), maîtrise +2 : Marteau de guerre +5, 1d8+3.
async function renderWarrior() {
  const character = makeTestCharacter({
    abilityScores: {
      strength: 16,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    weaponProficiencies: ["simple", "martial"],
    inventory: [
      {
        id: "warhammer",
        name: "Marteau de guerre",
        quantity: 1,
        equipped: true,
        weapon: {
          category: "martial",
          range: "melee",
          damageDice: "1d8",
          damageType: "bludgeoning",
        },
      },
    ],
  });
  await new LocalStorageCharacterRepository().create(character);
  render(
    <RepositoryProvider>
      <StoreProvider>
        <CharacterPlay characterId={character.id} />
      </StoreProvider>
    </RepositoryProvider>,
  );
  await screen.findByRole("heading", { name: character.name });
  return character;
}

async function openAttack(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Détails : Marteau de guerre" }));
  return within(await screen.findByRole("region", { name: "Attaquer" }));
}

describe("Attaque guidée (mode jeu)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("explains an entered attack against a known AC, then the damage, and logs it", async () => {
    const character = await renderWarrior();
    const user = userEvent.setup();
    const attack = await openAttack(user);

    await user.type(attack.getByLabelText("CA cible"), "15");
    await user.type(attack.getByLabelText("ou dé"), "12");
    await user.click(attack.getByRole("button", { name: "Valider" }));

    expect(attack.getByText("Touché")).toBeInTheDocument();
    const breakdown = attack.getByLabelText("Détail du calcul");
    expect(breakdown).toHaveTextContent("d20 12");
    expect(breakdown).toHaveTextContent("+3 Force");
    expect(breakdown).toHaveTextContent("+2 Maîtrise");
    expect(breakdown).toHaveTextContent("=17");

    await user.click(attack.getByRole("button", { name: /Pourquoi/ }));
    expect(attack.getByText(/Arme de corps à corps : Force/)).toBeInTheDocument();
    expect(
      attack.getByText(/Touche si le total atteint la CA de la cible \(15\)/),
    ).toBeInTheDocument();

    await user.type(attack.getByLabelText("ou total des dés"), "6");
    await user.click(attack.getByRole("button", { name: "Valider" }));
    const [, damageBreakdown] = attack.getAllByLabelText("Détail du calcul");
    expect(damageBreakdown).toHaveTextContent("1d8 6+3 Force=9");
    expect(attack.getByText("contondant")).toBeInTheDocument();

    const [entry] = await new LocalStorageActivityLogRepository().list(character.id);
    expect(entry).toMatchObject({ title: "Attaque : Marteau de guerre", category: "combat" });
    expect(entry?.details?.[0]).toMatch(/^Jet d’attaque : 17/);
    expect(entry?.details?.[1]).toMatch(/^Dégâts : 9 contondant/);
  });

  it("asks the DM without AC, and doubles the dice on a natural 20", async () => {
    await renderWarrior();
    const user = userEvent.setup();
    const attack = await openAttack(user);

    await user.type(attack.getByLabelText("ou dé"), "20");
    await user.click(attack.getByRole("button", { name: "Valider" }));
    expect(attack.getByText("Coup critique !")).toBeInTheDocument();
    expect(attack.getByRole("button", { name: "Lancer 2d8" })).toBeInTheDocument();
  });

  it("offers Touché / Raté when the target AC is unknown", async () => {
    const character = await renderWarrior();
    const user = userEvent.setup();
    const attack = await openAttack(user);

    await user.type(attack.getByLabelText("ou dé"), "8");
    await user.click(attack.getByRole("button", { name: "Valider" }));
    await user.click(attack.getByRole("button", { name: "Raté" }));

    expect(attack.getByText("Raté")).toBeInTheDocument();
    expect(attack.queryByRole("button", { name: /^Lancer 1d8$/ })).not.toBeInTheDocument();
    const [entry] = await new LocalStorageActivityLogRepository().list(character.id);
    expect(entry?.details?.[0]).toMatch(/raté$/);
  });

  it("uses advantage when asked", async () => {
    await renderWarrior();
    const user = userEvent.setup();
    const attack = await openAttack(user);
    await user.click(attack.getByRole("radio", { name: "Avantage" }));
    expect(attack.getByRole("button", { name: "Lancer 2d20" })).toBeInTheDocument();
    expect(attack.getByLabelText("ou dé retenu")).toBeInTheDocument();
  });
});
