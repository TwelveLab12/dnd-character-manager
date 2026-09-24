import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { describe, expect, it } from "vitest";
import type { Character } from "@/domain/character";
import type { InventoryItem } from "@/domain/inventory";
import { makeTestCharacter } from "@/test/fixtures";
import { InventoryTab } from "./inventory-tab";

let latest: Character;

function Harness({ initial }: { initial: Character }) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    latest = draft;
  }, [draft]);
  return (
    <InventoryTab
      draft={draft}
      onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
    />
  );
}

const MACE: InventoryItem = {
  id: "mace",
  name: "Masse d’armes",
  quantity: 1,
  weight: 2,
  weapon: { category: "simple", range: "melee", damageDice: "1d6", damageType: "bludgeoning" },
};
const ROPE: InventoryItem = { id: "rope", name: "Corde de chanvre", quantity: 1 };
const BOLTS: InventoryItem = { id: "bolts", name: "carreaux", quantity: 20 };
const CHAIN: InventoryItem = {
  id: "chain",
  name: "Cotte de mailles",
  quantity: 1,
  armor: { category: "heavy", baseArmorClass: 16 },
};

function renderTab(inventory: InventoryItem[]) {
  return render(<Harness initial={makeTestCharacter({ inventory })} />);
}

function itemNames(group: string): string[] {
  return within(screen.getByRole("region", { name: group }))
    .getAllByRole("button", { expanded: false })
    .map((button) => button.textContent ?? "");
}

describe("InventoryTab", () => {
  it("groups gear and bag, each sorted by name regardless of case", () => {
    renderTab([ROPE, MACE, BOLTS, CHAIN]);

    const gear = itemNames("Armes & armures");
    expect(gear[0]).toMatch(/^Cotte de mailles/);
    expect(gear[1]).toMatch(/^Masse d’armes/);
    const bag = itemNames("Sac");
    expect(bag[0]).toMatch(/^carreaux/);
    expect(bag[1]).toMatch(/^Corde de chanvre/);
  });

  it("opens one item at a time and edits it with the fields of its type", async () => {
    const user = userEvent.setup();
    renderTab([MACE, ROPE]);

    await user.click(screen.getByRole("button", { name: /masse d’armes/i }));
    expect(screen.getByText("Attaque calculée")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Finesse" }));
    expect(latest.inventory[0]?.weapon?.finesse).toBe(true);

    await user.click(screen.getByRole("button", { name: /corde de chanvre/i }));
    expect(screen.queryByText("Attaque calculée")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(1);

    await user.click(screen.getByRole("radio", { name: "Arme" }));
    expect(latest.inventory[1]?.weapon).toBeDefined();
    expect(screen.getByText("Attaque calculée")).toBeInTheDocument();
  });

  it("adds a typed item already open, then removes it", async () => {
    const user = userEvent.setup();
    renderTab([]);

    await user.click(screen.getByRole("button", { name: "Ajouter une armure" }));
    expect(latest.inventory[0]?.armor).toEqual({ category: "light", baseArmorClass: 11 });
    expect(screen.getByRole("radio", { name: "Légère" })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("radio", { name: "Lourde" }));
    expect(latest.inventory[0]?.armor).toEqual({ category: "heavy", baseArmorClass: 16 });

    await user.click(screen.getByRole("button", { name: /supprimer l’objet/i }));
    expect(latest.inventory).toEqual([]);
  });
});
