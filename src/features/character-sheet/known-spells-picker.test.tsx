import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeTestSpell } from "@/test/fixtures";
import { KnownSpellsPicker } from "./known-spells-picker";

const LIBRARY = [
  makeTestSpell({ id: "bless", name: "Bénédiction", classes: ["Clerc"] }),
  makeTestSpell({ id: "cure", name: "Soins", classes: ["Cleric"] }),
  makeTestSpell({ id: "light", name: "Lumière", level: 0, classes: ["Clerc"] }),
  makeTestSpell({ id: "fireball", name: "Boule de feu", level: 3, classes: ["Magicien"] }),
];

async function openPicker(onAdd = vi.fn()) {
  const user = userEvent.setup();
  render(
    <KnownSpellsPicker library={LIBRARY} knownSpellIds={["cure"]} classId="clerc" onAdd={onAdd} />,
  );
  await user.click(screen.getByRole("button", { name: /ajouter des sorts/i }));
  return { user, panel: await screen.findByRole("dialog"), onAdd };
}

describe("KnownSpellsPicker", () => {
  it("filters on the character's class by default, and can show every spell", async () => {
    const { user, panel } = await openPicker();
    expect(within(panel).queryByText("Boule de feu")).not.toBeInTheDocument();

    await user.click(within(panel).getByRole("switch", { name: /uniquement les sorts de clerc/i }));
    expect(within(panel).getByText("Boule de feu")).toBeInTheDocument();
  });

  it("filters by name and by level", async () => {
    const { user, panel } = await openPicker();
    await user.type(within(panel).getByRole("searchbox"), "béné");
    expect(within(panel).getByText("Bénédiction")).toBeInTheDocument();
    expect(within(panel).queryByText("Lumière")).not.toBeInTheDocument();

    await user.clear(within(panel).getByRole("searchbox"));
    await user.click(within(panel).getByRole("button", { name: "Tours" }));
    expect(within(panel).getByText("Lumière")).toBeInTheDocument();
    expect(within(panel).queryByText("Bénédiction")).not.toBeInTheDocument();
  });

  it("shows known spells as checked and disabled, and adds only the selection", async () => {
    const { user, panel, onAdd } = await openPicker();
    const known = within(panel).getByRole("checkbox", { name: /soins/i });
    expect(known).toBeChecked();
    expect(known).toBeDisabled();

    const add = within(panel).getByRole("button", { name: "Ajouter" });
    expect(add).toBeDisabled();

    await user.click(within(panel).getByRole("checkbox", { name: /bénédiction/i }));
    await user.click(within(panel).getByRole("checkbox", { name: /lumière/i }));
    await user.click(within(panel).getByRole("button", { name: "Ajouter 2 sorts" }));

    expect(onAdd).toHaveBeenCalledWith(["bless", "light"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
