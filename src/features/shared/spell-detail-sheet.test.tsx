import { fireEvent, render, screen, within } from "@testing-library/react";
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

describe("SpellDetailSheet — fermeture par glissement", () => {
  function renderOpen(onOpenChange: (open: boolean) => void) {
    render(
      <SpellDetailSheet spell={makeTestSpell({ name: "Soins" })} onOpenChange={onOpenChange} />,
    );
    return screen.getByRole("heading", { name: "Soins" });
  }

  function swipe(target: HTMLElement, distance: number, durationMs: number) {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
    fireEvent.pointerDown(target, { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(target, { pointerId: 1, clientY: 100 + distance });
    now.mockReturnValue(1_000 + durationMs);
    fireEvent.pointerUp(target, { pointerId: 1, clientY: 100 + distance });
    now.mockRestore();
  }

  it("closes when the header is dragged down far enough", () => {
    const onOpenChange = vi.fn();
    swipe(renderOpen(onOpenChange), 160, 1000);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes on a short but fast flick", () => {
    const onOpenChange = vi.fn();
    swipe(renderOpen(onOpenChange), 60, 50);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("springs back on a short slow drag", () => {
    const onOpenChange = vi.fn();
    const title = renderOpen(onOpenChange);
    swipe(title, 60, 1000);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).not.toHaveStyle({ transform: "translateY(60px)" });
  });
});
