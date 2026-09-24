import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { describe, expect, it } from "vitest";
import type { Character } from "@/domain/character";
import { makeTestCharacter } from "@/test/fixtures";
import { AbilitiesTab } from "./abilities-tab";

let latest: Character;

function Harness({ initial }: { initial: Character }) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    latest = draft;
  }, [draft]);
  return (
    <AbilitiesTab
      draft={draft}
      onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
    />
  );
}

function renderTab(overrides: Partial<Character> = {}) {
  return render(<Harness initial={makeTestCharacter(overrides)} />);
}

describe("AbilitiesTab", () => {
  it("steps a base score and updates its modifier", async () => {
    const user = userEvent.setup();
    renderTab({
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });

    const strength = screen.getByRole("group", { name: "Force" });
    await user.click(within(strength).getByRole("button", { name: "Monter Force" }));
    await user.click(within(strength).getByRole("button", { name: "Monter Force" }));
    expect(latest.abilityScores.strength).toBe(12);
    expect(within(strength).getByLabelText("Modificateur +1")).toBeInTheDocument();
  });

  it("lets the player remove a class saving throw, then restore it", async () => {
    const user = userEvent.setup();
    renderTab({ classId: "clerc", level: 1 });

    const charisma = within(screen.getByRole("group", { name: "Charisme" })).getByRole("button", {
      name: /maîtrise/i,
    });
    expect(charisma).toHaveAttribute("aria-pressed", "true");
    expect(charisma).not.toHaveTextContent("Clerc");

    await user.click(charisma);
    expect(latest.removedSavingThrowProficiencies).toEqual(["charisma"]);
    expect(charisma).toHaveAttribute("aria-pressed", "false");
    expect(charisma).toHaveTextContent("Retirée · Clerc");

    await user.click(charisma);
    expect(latest.removedSavingThrowProficiencies).toBeUndefined();
    expect(latest.savingThrowProficiencies).toEqual([]);
  });

  it("adds a saving throw outside the class and groups skills by ability", async () => {
    const user = userEvent.setup();
    renderTab({ classId: "clerc" });

    await user.click(
      within(screen.getByRole("group", { name: "Constitution" })).getByRole("button", {
        name: /maîtrise/i,
      }),
    );
    expect(latest.savingThrowProficiencies).toEqual(["constitution"]);

    const wisdomSkills = screen.getByRole("group", { name: "Compétences de Sagesse" });
    expect(within(wisdomSkills).getAllByRole("button")).toHaveLength(5);
    await user.click(within(wisdomSkills).getByRole("button", { name: /perception/i }));
    expect(latest.skillProficiencies).toContain("Perception");
    expect(screen.getByText(/maîtrisée$/)).toBeInTheDocument();
  });
});
