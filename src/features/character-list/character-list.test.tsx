import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter, makeTestSpell } from "@/test/fixtures";
import { CharacterList } from "./character-list";

function renderCharacterList() {
  return render(
    <RepositoryProvider>
      <StoreProvider>
        <CharacterList />
      </StoreProvider>
    </RepositoryProvider>,
  );
}

async function createCharacter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /nouveau personnage/i }));
  await user.type(screen.getByLabelText(/^nom$/i), "Yomi Tsuki");
  await user.type(screen.getByLabelText(/^classe$/i), "Clerc");
  await user.click(screen.getByRole("button", { name: /^créer$/i }));
}

async function pasteIntoJsonField(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  json: string,
) {
  const textarea = within(dialog).getByLabelText(/json/i);
  await user.click(textarea);
  // user.paste (pas user.type) : le JSON contient des accolades, que user-event.type
  // interpréterait comme des codes de touche spéciaux ("{enter}"...).
  await user.paste(json);
}

describe("CharacterList", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows an empty state, then creates and lists a character", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    expect(await screen.findByText(/aucun personnage/i)).toBeInTheDocument();

    await createCharacter(user);

    expect(await screen.findByText("Yomi Tsuki")).toBeInTheDocument();
    expect(screen.getByText(/clerc — niveau 1/i)).toBeInTheDocument();
  });

  it("deletes a character after confirmation", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    await createCharacter(user);
    await screen.findByText("Yomi Tsuki");

    await user.click(screen.getByRole("button", { name: /supprimer/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /^supprimer$/i }));

    await waitFor(() => expect(screen.queryByText("Yomi Tsuki")).not.toBeInTheDocument());
    expect(await screen.findByText(/aucun personnage/i)).toBeInTheDocument();
  });

  it("imports a character from pasted JSON", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    await user.click(screen.getByRole("button", { name: /importer des personnages/i }));
    const dialog = await screen.findByRole("dialog");
    await pasteIntoJsonField(
      user,
      dialog,
      JSON.stringify([makeTestCharacter({ name: "Yomi Tsuki" })]),
    );
    await user.click(within(dialog).getByRole("button", { name: /^analyser$/i }));

    expect(await within(dialog).findByText("Yomi Tsuki")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /^importer \(1\)$/i }));
    expect(await within(dialog).findByText(/1 ajouté/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^fermer$/i }));
    expect(await screen.findByText("Yomi Tsuki")).toBeInTheDocument();
  });

  it("imports a full backup (characters + spells) from pasted JSON", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      characters: [makeTestCharacter({ name: "Yomi Tsuki" })],
      spells: [makeTestSpell({ id: "fireball" })],
    };

    await user.click(screen.getByRole("button", { name: /importer une sauvegarde/i }));
    const dialog = await screen.findByRole("dialog");
    await pasteIntoJsonField(user, dialog, JSON.stringify(backup));
    await user.click(within(dialog).getByRole("button", { name: /^importer$/i }));

    expect(await within(dialog).findByText(/personnages : 1 ajouté/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /^fermer$/i }));
    expect(await screen.findByText("Yomi Tsuki")).toBeInTheDocument();
  });
});
