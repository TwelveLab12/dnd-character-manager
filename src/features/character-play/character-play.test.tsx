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
    });
    await new LocalStorageCharacterRepository().create(character);

    renderPlay(character.id);

    expect(await screen.findByRole("heading", { name: "Elara Duskwood" })).toBeInTheDocument();
    expect(screen.getByText("Cleric — Domaine de la Lune")).toBeInTheDocument();
    expect(screen.getByText("niv.")).toHaveTextContent("niv. 5");
    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      `/characters/${character.id}/edit`,
    );
  });

  it("keeps the combat HUD (CA, PV, concentration, repos) visible across the 5 mirror tabs", async () => {
    const character = makeTestCharacter({
      background: "Ermite",
      inventory: [{ id: "item-1", name: "Sac à dos", quantity: 1 }],
      features: [{ id: "feature-1", name: "Vision dans le noir", source: "Race", description: "" }],
    });
    await new LocalStorageCharacterRepository().create(character);

    const user = userEvent.setup();
    renderPlay(character.id);
    await screen.findByRole("heading", { name: character.name });

    for (const tabName of ["Général", "Caractéristiques", "Sorts", "Inventaire", "Capacités"]) {
      await user.click(screen.getByRole("tab", { name: tabName }));
      expect(screen.getByRole("img", { name: /classe d'armure/i })).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /points de vie/i })).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: /concentration/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^repos court$/i })).toBeInTheDocument();
    }

    await user.click(screen.getByRole("tab", { name: "Général" }));
    expect(screen.getByText("Ermite")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Inventaire" }));
    expect(screen.getByText("Sac à dos")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Capacités" }));
    expect(screen.getByText("Vision dans le noir")).toBeInTheDocument();
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

    await user.click(screen.getByRole("tab", { name: "Général" }));
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
