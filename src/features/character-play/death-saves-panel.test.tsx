import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

async function renderPlay(overrides: Parameters<typeof makeTestCharacter>[0]) {
  const character = makeTestCharacter(overrides);
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

function persisted(id: string) {
  return new LocalStorageCharacterRepository().getById(id);
}

describe("Jets contre la mort (mode jeu)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("appears only at 0 HP", async () => {
    await renderPlay({ hitPoints: { current: 4, temporary: 0 } });
    expect(screen.queryByRole("region", { name: "Jets contre la mort" })).not.toBeInTheDocument();
  });

  it("records saves from a typed d20 and stabilizes on the third success", async () => {
    const character = await renderPlay({
      hitPoints: { current: 0, temporary: 0 },
      deathSaves: { successes: 1, failures: 1 },
    });
    const user = userEvent.setup();
    const panel = screen.getByRole("region", { name: "Jets contre la mort" });
    expect(within(panel).getByRole("heading", { name: "Mourant" })).toBeInTheDocument();

    await user.type(within(panel).getByLabelText("ou résultat"), "12");
    await user.click(within(panel).getByRole("button", { name: "Valider" }));
    expect((await persisted(character.id))?.deathSaves).toEqual({ successes: 2, failures: 1 });

    await user.click(within(panel).getByRole("button", { name: "Réussites 3" }));
    expect(await within(panel).findByRole("heading", { name: "Stabilisé" })).toBeInTheDocument();
    expect((await persisted(character.id))?.stable).toBe(true);

    await user.click(within(panel).getByRole("button", { name: "Reprendre 1 PV" }));
    expect(screen.queryByRole("region", { name: "Jets contre la mort" })).not.toBeInTheDocument();
    const revived = await persisted(character.id);
    expect(revived?.hitPoints.current).toBe(1);
    expect(revived?.stable).toBeUndefined();
  });

  it("damage at 0 HP adds a failure, the third one kills, healing revives", async () => {
    const character = await renderPlay({
      hitPoints: { current: 0, temporary: 0 },
      deathSaves: { successes: 0, failures: 2 },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Infliger 1 dégât" }));
    const panel = screen.getByRole("region", { name: "Jets contre la mort" });
    expect(await within(panel).findByRole("heading", { name: "Mort" })).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "Lancer 1d20" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Soigner 1 point de vie" }));
    expect(screen.queryByRole("region", { name: "Jets contre la mort" })).not.toBeInTheDocument();
    expect((await persisted(character.id))?.deathSaves).toBeUndefined();
  });

  it("stabilizes on demand", async () => {
    const character = await renderPlay({ hitPoints: { current: 0, temporary: 0 } });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Stabiliser" }));
    expect((await persisted(character.id))?.stable).toBe(true);
  });
});
