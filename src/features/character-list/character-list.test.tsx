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
  await user.type(screen.getByLabelText(/^nom$/i), "Elara Duskwood");
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

    expect(await screen.findByText("Elara Duskwood")).toBeInTheDocument();
    expect(screen.getByText(/^clerc$/i)).toBeInTheDocument();
    expect(screen.getByText(/niv\./i)).toHaveTextContent(/niv\.\s*1/i);
  });

  it("makes the whole info block a link to the play sheet, with HP and AC highlighted", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    await createCharacter(user);
    const link = await screen.findByRole("link", { name: /voir la fiche de elara duskwood/i });

    expect(link).toHaveAttribute("href", expect.stringMatching(/^\/characters\/[^/]+$/));
    expect(within(link).getByText("Elara Duskwood")).toBeInTheDocument();
    expect(within(link).getByRole("img", { name: /points de vie/i })).toBeInTheDocument();
    expect(within(link).getByRole("img", { name: /classe d'armure/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^voir la fiche$/i })).not.toBeInTheDocument();
  });

  it("deletes a character after confirmation", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    await createCharacter(user);
    await screen.findByText("Elara Duskwood");

    await user.click(screen.getByRole("button", { name: /supprimer/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /^supprimer$/i }));

    await waitFor(() => expect(screen.queryByText("Elara Duskwood")).not.toBeInTheDocument());
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
      JSON.stringify([makeTestCharacter({ name: "Elara Duskwood" })]),
    );
    await user.click(within(dialog).getByRole("button", { name: /^analyser$/i }));

    expect(await within(dialog).findByText("Elara Duskwood")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /^importer \(1\)$/i }));
    expect(await within(dialog).findByText(/1 ajouté/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^fermer$/i }));
    expect(await screen.findByText("Elara Duskwood")).toBeInTheDocument();
  });

  it("imports a full backup (characters + spells) from pasted JSON", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      characters: [makeTestCharacter({ name: "Elara Duskwood" })],
      spells: [makeTestSpell({ id: "fireball" })],
    };

    await user.click(screen.getByRole("button", { name: /importer une sauvegarde/i }));
    const dialog = await screen.findByRole("dialog");
    await pasteIntoJsonField(user, dialog, JSON.stringify(backup));
    await user.click(within(dialog).getByRole("button", { name: /^analyser$/i }));

    expect(await within(dialog).findByText("Elara Duskwood")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /^importer \(2\)$/i }));

    expect(await within(dialog).findByText(/personnages : 1 ajouté/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /^fermer$/i }));
    expect(await screen.findByText("Elara Duskwood")).toBeInTheDocument();
  });

  it("imports valid characters from a backup even when a spell entry is invalid", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      characters: [makeTestCharacter({ name: "Elara Duskwood" })],
      spells: [{ name: "Sort cassé" }],
    };

    await user.click(screen.getByRole("button", { name: /importer une sauvegarde/i }));
    const dialog = await screen.findByRole("dialog");
    await pasteIntoJsonField(user, dialog, JSON.stringify(backup));
    await user.click(within(dialog).getByRole("button", { name: /^analyser$/i }));

    expect(await within(dialog).findByText("Elara Duskwood")).toBeInTheDocument();
    expect(within(dialog).getByText(/invalide/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^importer \(1\)$/i }));
    expect(await within(dialog).findByText(/personnages : 1 ajouté/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^fermer$/i }));
    expect(await screen.findByText("Elara Duskwood")).toBeInTheDocument();
  });
});
