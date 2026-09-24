import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { describe, expect, it } from "vitest";
import type { Character } from "@/domain/character";
import type { CharacterFeature } from "@/domain/feature";
import { makeTestCharacter } from "@/test/fixtures";
import { FeaturesTab } from "./features-tab";

let latest: Character;

function Harness({ initial }: { initial: Character }) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    latest = draft;
  }, [draft]);
  return (
    <FeaturesTab
      draft={draft}
      onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
    />
  );
}

const EYES: CharacterFeature = {
  id: "eyes",
  name: "Yeux de la nuit",
  source: "Domaine du Crépuscule",
  description: "Vision dans le noir partagée.",
  usesMax: 3,
  usesCurrent: 3,
  recharge: "longRest",
};
const DESTROY: CharacterFeature = {
  id: "destroy",
  name: "Destruction des morts-vivants",
  source: "Clerc",
  description: "",
};
const VIGIL: CharacterFeature = {
  id: "vigil",
  name: "Bénédiction du vigilant",
  source: "Domaine du Crépuscule",
  description: "",
};

function renderTab(overrides: Partial<Character> = {}) {
  return render(
    <Harness
      initial={makeTestCharacter({
        classId: "clerc",
        subclassId: "crepuscule",
        level: 5,
        features: [EYES, DESTROY, VIGIL],
        ...overrides,
      })}
    />,
  );
}

describe("FeaturesTab", () => {
  it("groups features by source, each sorted by name", () => {
    renderTab();

    const sections = screen
      .getAllByRole("region")
      .map((section) => section.getAttribute("aria-label"))
      .filter(Boolean);
    expect(sections).toEqual(["Clerc", "Domaine du Crépuscule"]);
    const twilight = within(screen.getByRole("region", { name: "Domaine du Crépuscule" }))
      .getAllByRole("button", { expanded: false })
      .map((button) => button.textContent ?? "");
    expect(twilight[0]).toMatch(/^Bénédiction du vigilant/);
    expect(twilight[1]).toMatch(/^Yeux de la nuit/);
  });

  it("shows Channel Divinity and lets the player remove a rule option", async () => {
    const user = userEvent.setup();
    renderTab();

    const card = screen.getByRole("region", { name: "Canalisation divine" });
    expect(
      within(card).getByText(/1 utilisation au niveau 5 \(2 au niveau 6\)/),
    ).toBeInTheDocument();
    const turnUndead = within(card).getByRole("button", { name: /renvoi des morts-vivants/i });
    await user.click(turnUndead);
    expect(latest.removedClassResourceOptions).toEqual(["turn-undead"]);
    expect(turnUndead).toHaveTextContent("Retirée · Clerc");
  });

  it("edits a feature in place without moving it while its name and source change", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole("button", { name: /yeux de la nuit/i }));
    const name = screen.getByLabelText(/^nom$/i);
    await user.clear(name);
    await user.type(name, "Aube");
    expect(latest.features.find((feature) => feature.id === "eyes")?.name).toBe("Aube");
    expect(name).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Une utilisation de plus" }));
    expect(latest.features.find((feature) => feature.id === "eyes")).toMatchObject({
      usesMax: 4,
      usesCurrent: 4,
    });

    await user.click(screen.getByRole("radio", { name: "Canalisation divine" }));
    expect(latest.features.find((feature) => feature.id === "eyes")).toMatchObject({
      resourceId: "channel-divinity",
      usesMax: undefined,
    });
  });
});
