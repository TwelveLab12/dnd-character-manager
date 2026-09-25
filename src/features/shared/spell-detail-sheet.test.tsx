import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeTestSpell } from "@/test/fixtures";
import { SpellDetailSheet } from "./spell-detail-sheet";

describe("SpellDetailSheet", () => {
  it("renders nothing while no spell is selected", () => {
    render(<SpellDetailSheet spell={undefined} onOpenChange={() => {}} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a read-only detail with tags, classes and source", () => {
    const spell = makeTestSpell({
      name: "Détection de la magie",
      level: 1,
      school: "Divination",
      concentration: true,
      ritual: true,
      range: "Personnelle",
      classes: ["Clerc", "Magicien"],
      source: "SRD 5.1",
    });

    render(
      <SpellDetailSheet
        spell={spell}
        onOpenChange={() => {}}
        themeId="selune"
        isAlwaysPrepared={() => true}
        showOrigin
      />,
    );

    const sheet = screen.getByRole("dialog", { name: "Détection de la magie" });
    expect(sheet).toHaveAttribute("data-theme", "selune");
    expect(within(sheet).getByText("Niveau 1 · Divination")).toBeInTheDocument();
    expect(within(sheet).getByText("Toujours préparé")).toBeInTheDocument();
    expect(within(sheet).getByText("Concentration")).toBeInTheDocument();
    expect(within(sheet).getByText("Rituel")).toBeInTheDocument();
    expect(within(sheet).getByText("Personnelle")).toBeInTheDocument();
    expect(
      within(sheet).getByText("Classes : Clerc, Magicien · Source : SRD 5.1"),
    ).toBeInTheDocument();
    expect(within(sheet).queryByText("Aux niveaux supérieurs")).not.toBeInTheDocument();
  });

  it("labels a cantrip and asks to close on Escape", async () => {
    const onOpenChange = vi.fn();
    render(
      <SpellDetailSheet
        spell={makeTestSpell({ name: "Lumière", level: 0, school: "Évocation" })}
        onOpenChange={onOpenChange}
      />,
    );

    const sheet = screen.getByRole("dialog", { name: "Lumière" });
    expect(within(sheet).getByText("Tour de magie · Évocation")).toBeInTheDocument();

    await userEvent.setup().keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
