import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageActivityLogRepository } from "@/repositories/local-storage/local-storage-activity-log-repository";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

async function renderPlay() {
  const character = makeTestCharacter({ hitPoints: { current: 10, temporary: 0 } });
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

describe("Historique du mode jeu", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("records play actions, merges rapid clicks and shows them in the panel", async () => {
    const character = await renderPlay();
    const user = userEvent.setup();

    for (let hit = 0; hit < 3; hit += 1) {
      await user.click(screen.getByRole("button", { name: "Infliger 1 dégât" }));
    }
    await user.click(screen.getByRole("button", { name: /^repos long$/i }));
    await user.click(await screen.findByRole("button", { name: /^confirmer$/i }));

    await user.click(screen.getByRole("button", { name: "Historique" }));
    const panel = await screen.findByRole("dialog", { name: "Historique" });
    const today = within(panel).getByRole("region", { name: "Aujourd’hui" });
    const titles = within(today)
      .getAllByText(/^(Repos long|Dégâts)$/)
      .map((node) => node.textContent);
    expect(titles).toEqual(["Repos long", "Dégâts"]);
    expect(within(today).getByText("(−3)")).toBeInTheDocument();

    const stored = await new LocalStorageActivityLogRepository().list(character.id);
    expect(stored).toHaveLength(2);
  });

  it("filters by category and clears the history after confirmation", async () => {
    const character = await renderPlay();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Infliger 1 dégât" }));
    await user.click(screen.getByRole("button", { name: /^repos long$/i }));
    await user.click(await screen.findByRole("button", { name: /^confirmer$/i }));

    await user.click(screen.getByRole("button", { name: "Historique" }));
    const panel = await screen.findByRole("dialog", { name: "Historique" });
    await user.click(await within(panel).findByRole("radio", { name: "Repos" }));
    expect(within(panel).queryByText("Dégâts")).not.toBeInTheDocument();
    expect(within(panel).getByText("Repos long")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Vider" }));
    await user.click(await screen.findByRole("button", { name: "Vider" }));
    expect(await within(panel).findByText(/Aucune action enregistrée/)).toBeInTheDocument();
    expect(await new LocalStorageActivityLogRepository().list(character.id)).toEqual([]);
  });

  it("changes the retention", async () => {
    await renderPlay();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Historique" }));
    const panel = await screen.findByRole("dialog", { name: "Historique" });
    const retention = within(panel).getByRole("radiogroup", {
      name: "Durée de conservation de l'historique",
    });
    expect(within(retention).getByRole("radio", { name: "30 j" })).toBeChecked();
    await user.click(within(retention).getByRole("radio", { name: "7 j" }));
    expect(await new LocalStorageActivityLogRepository().getRetention()).toBe(7);
  });
});
