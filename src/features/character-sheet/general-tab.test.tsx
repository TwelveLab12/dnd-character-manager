import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Character } from "@/domain/character";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { makeTestCharacter } from "@/test/fixtures";
import { GeneralTab } from "./general-tab";

let latest: Character;

function Harness({ initial }: { initial: Character }) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    latest = draft;
  }, [draft]);
  return (
    <GeneralTab
      draft={draft}
      onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
    />
  );
}

function renderTab(overrides: Partial<Character> = {}) {
  return render(
    <RepositoryProvider>
      <StoreProvider>
        <Harness initial={makeTestCharacter(overrides)} />
      </StoreProvider>
    </RepositoryProvider>,
  );
}

describe("GeneralTab", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses one list per class: a known class sets both the rules id and the label", async () => {
    const user = userEvent.setup();
    renderTab({ class: "Paladin", classId: undefined });

    expect(screen.getByRole("textbox", { name: "Nom de la classe" })).toHaveValue("Paladin");
    expect(screen.getAllByText("Texte libre").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("combobox", { name: "Classe" }));
    await user.click(await screen.findByRole("option", { name: "Clerc" }));

    expect(latest.classId).toBe("clerc");
    expect(latest.class).toBe("Clerc");
    expect(screen.queryByRole("textbox", { name: "Nom de la classe" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Domaine divin" })).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Classe" }));
    await user.click(await screen.findByRole("option", { name: /autre/i }));
    expect(latest.classId).toBeUndefined();
    expect(screen.getByRole("textbox", { name: "Nom de la classe" })).toHaveValue("Clerc");
  });

  it("steps the level between 1 and 20", async () => {
    const user = userEvent.setup();
    renderTab({ level: 19 });

    await user.click(screen.getByRole("button", { name: "Monter le niveau" }));
    expect(latest.level).toBe(20);
    expect(screen.getByRole("button", { name: "Monter le niveau" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Baisser le niveau" }));
    expect(latest.level).toBe(19);
  });

  it("switches max HP to rolled dice and no longer edits current HP", async () => {
    const user = userEvent.setup();
    renderTab({ classId: "clerc", level: 3 });

    expect(screen.queryByLabelText(/pv actuels/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/pv temporaires/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Dés lancés" }));
    expect(latest.hitPointMethod).toBe("rolled");
    await user.type(screen.getByRole("spinbutton", { name: "Résultat du d8 au niveau 2" }), "7");
    expect(latest.hitPointRolls?.[0]).toBe(7);
  });

  it("lets each character remove or add proficiencies, even those granted by the class", async () => {
    const user = userEvent.setup();
    renderTab({ classId: "clerc" });

    const shield = screen.getByRole("button", { name: /bouclier/i });
    expect(shield).toHaveAttribute("aria-pressed", "true");
    expect(shield).toHaveTextContent("Clerc");

    await user.click(shield);
    expect(latest.removedArmorProficiencies).toEqual(["shield"]);
    expect(shield).toHaveAttribute("aria-pressed", "false");
    expect(shield).toHaveTextContent("Retirée · Clerc");

    await user.click(shield);
    expect(latest.removedArmorProficiencies).toBeUndefined();

    await user.click(screen.getByRole("button", { name: /^lourde/i }));
    expect(latest.armorProficiencies).toEqual(["heavy"]);

    await user.click(screen.getByRole("button", { name: /armes courantes/i }));
    expect(latest.removedWeaponProficiencies).toEqual(["simple"]);
  });

  it("picks a theme from cards", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole("radio", { name: /séluné/i }));
    expect(latest.themeId).toBe("selune");
    await user.click(screen.getByRole("radio", { name: /par défaut/i }));
    expect(latest.themeId).toBeUndefined();
  });
});
