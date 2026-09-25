import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageSpellRepository } from "@/repositories/local-storage/local-storage-spell-repository";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestSpell } from "@/test/fixtures";
import { SpellLibrary } from "./spell-library";

function renderLibrary() {
  return render(
    <RepositoryProvider>
      <StoreProvider>
        <SpellLibrary />
      </StoreProvider>
    </RepositoryProvider>,
  );
}

// Sort générique inventé pour le test, pas du texte SRD — voir docs/adr/0004.
const SAMPLE_SPELL = {
  name: "Test Bolt",
  level: 1,
  school: "Evocation",
  castingTime: "1 action",
  range: "120 feet",
  components: { verbal: true, somatic: true, material: false },
  duration: "Instantaneous",
  description: "A generic test spell.",
  classes: ["Wizard"],
};

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

describe("SpellLibrary", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows an empty state, then imports a spell from pasted JSON", async () => {
    const user = userEvent.setup();
    renderLibrary();

    expect(await screen.findByText(/aucun sort importé/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^importer$/i }));
    const dialog = await screen.findByRole("dialog");
    await pasteIntoJsonField(user, dialog, JSON.stringify([SAMPLE_SPELL]));
    await user.click(within(dialog).getByRole("button", { name: /^analyser$/i }));

    expect(await within(dialog).findByText("Test Bolt")).toBeInTheDocument();
    expect(within(dialog).getByText(/nouveau/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^importer \(1\)$/i }));
    expect(await within(dialog).findByText(/1 ajouté/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^fermer$/i }));
    expect(await screen.findByText("Test Bolt")).toBeInTheDocument();
  });

  it("shows a humanized error for an invalid row without blocking the valid one", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: /^importer$/i }));
    const dialog = await screen.findByRole("dialog");
    await pasteIntoJsonField(
      user,
      dialog,
      JSON.stringify([SAMPLE_SPELL, { name: "Broken", level: "oops" }]),
    );
    await user.click(within(dialog).getByRole("button", { name: /^analyser$/i }));

    expect(await within(dialog).findByText(/invalide/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /^importer \(1\)$/i })).toBeInTheDocument();
  });

  it("reports a JSON syntax error", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: /^importer$/i }));
    const dialog = await screen.findByRole("dialog");
    await pasteIntoJsonField(user, dialog, "{not json");
    await user.click(within(dialog).getByRole("button", { name: /^analyser$/i }));

    expect(await within(dialog).findByText(/json invalide/i)).toBeInTheDocument();
  });

  it("opens a read-only spell detail sheet from a library row", async () => {
    await new LocalStorageSpellRepository().upsertMany([
      makeTestSpell({ id: "bolt", name: "Test Bolt", description: "A generic test spell." }),
    ]);
    const user = userEvent.setup();
    renderLibrary();

    await user.click(await screen.findByRole("button", { name: "Détails : Test Bolt" }));

    const sheet = await screen.findByRole("dialog", { name: "Test Bolt" });
    expect(within(sheet).getByText("A generic test spell.")).toBeInTheDocument();
    expect(within(sheet).getByText("Classes : Cleric")).toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: /lancer/i })).not.toBeInTheDocument();
  });
});
