import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { Character } from "@/domain/character";
import { LocalStorageCharacterRepository } from "@/repositories/local-storage/local-storage-character-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { CharacterPlay } from "./character-play";

async function renderPlay(overrides: Partial<Character> = {}) {
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
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Journal" }));
  const panel = await screen.findByRole("dialog", { name: "Journal" });
  return { character, user, panel };
}

async function storedJournal(id: string) {
  return (await new LocalStorageCharacterRepository().getById(id))?.journal;
}

const PAST_SESSION = {
  id: "past",
  date: "2020-05-02",
  title: "Le convoi",
  createdAt: "2020-05-02T18:00:00.000Z",
  notes: [{ id: "n1", text: "Ravel Dunmar nous emploie", createdAt: "2020-05-02T18:10:00.000Z" }],
};

describe("Journal de l'aventurier", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts today's session with the first note, newest notes first", async () => {
    const { character, user, panel } = await renderPlay();
    expect(within(panel).getByRole("region", { name: "Journal vide" })).toBeInTheDocument();

    await user.type(
      within(panel).getByRole("textbox", { name: "Nouvelle note" }),
      "Aldric ment{Enter}",
    );
    const today = await within(panel).findByRole("region", { name: "Session 1" });
    expect(within(today).getByText("Session 1 · Aujourd’hui")).toBeInTheDocument();

    await user.type(
      within(today).getByRole("textbox", { name: "Nouvelle note" }),
      "Mot de passe{Enter}",
    );
    const notes = within(today)
      .getAllByRole("button", { name: /^Modifier la note/ })
      .map((button) => button.textContent);
    expect(notes).toEqual(["Mot de passe", "Aldric ment"]);

    const journal = await storedJournal(character.id);
    expect(journal).toHaveLength(1);
    expect(journal?.[0]?.notes).toHaveLength(2);
  });

  it("completes a past session: add, edit and delete notes", async () => {
    const { character, user, panel } = await renderPlay({ journal: [PAST_SESSION] });
    expect(within(panel).getByRole("region", { name: "Session du jour" })).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: /Session 1 · 1 note/ }));
    const past = within(panel).getByRole("region", { name: "Session 1" });
    expect(within(past).getByText("Le convoi")).toBeInTheDocument();

    await user.type(within(past).getByRole("textbox", { name: "Nouvelle note" }), "Recopié{Enter}");
    await user.click(
      within(past).getByRole("button", { name: "Modifier la note : Ravel Dunmar nous emploie" }),
    );
    const text = within(past).getByRole("textbox", { name: "Texte de la note" });
    await user.clear(text);
    await user.type(text, "Ravel Dunmar, marchand");
    await user.click(within(past).getByRole("button", { name: "Enregistrer" }));
    expect(await within(past).findByText("Ravel Dunmar, marchand")).toBeInTheDocument();

    await user.click(within(past).getByRole("button", { name: "Modifier la note : Recopié" }));
    await user.click(within(past).getByRole("button", { name: "Supprimer" }));

    const journal = await storedJournal(character.id);
    expect(journal?.[0]?.notes.map((note) => note.text)).toEqual(["Ravel Dunmar, marchand"]);
  });

  it("creates a back-dated session, edits it and deletes it after confirmation", async () => {
    const { character, user, panel } = await renderPlay({ journal: [PAST_SESSION] });

    await user.click(within(panel).getByRole("button", { name: "Session" }));
    const create = await screen.findByRole("dialog", { name: "Nouvelle session" });
    const date = within(create).getByLabelText("Date de la partie");
    await user.clear(date);
    await user.type(date, "2020-04-18");
    expect(within(create).getByText("session 1")).toBeInTheDocument();
    await user.type(within(create).getByLabelText(/Titre/), "Le départ");
    await user.click(within(create).getByRole("button", { name: "Créer la session" }));

    // La session créée est dépliée et prend le numéro 1 : l'ancienne devient la 2.
    const created = await within(panel).findByRole("region", { name: "Session 1" });
    expect(within(created).getByText("Le départ")).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /Session 2 · 1 note/ })).toBeInTheDocument();

    await user.click(within(created).getByRole("button", { name: "Modifier la session 1" }));
    const edit = await screen.findByRole("dialog", { name: "Modifier la session" });
    await user.click(within(edit).getByRole("button", { name: "Supprimer la session" }));
    await user.click(await screen.findByRole("button", { name: "Supprimer" }));

    expect(within(panel).queryByText("Le départ")).not.toBeInTheDocument();
    expect((await storedJournal(character.id))?.map((session) => session.id)).toEqual(["past"]);
  });
});
