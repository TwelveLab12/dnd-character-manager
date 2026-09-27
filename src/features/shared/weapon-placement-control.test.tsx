import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { InventoryItem } from "@/domain/inventory";
import { WeaponPlacementControl } from "./weapon-placement-control";

const longsword: InventoryItem = {
  id: "longsword",
  name: "Épée longue",
  quantity: 1,
  equipped: true,
  weapon: {
    category: "martial",
    range: "melee",
    damageDice: "1d8",
    versatileDamageDice: "1d10",
    damageType: "slashing",
  },
};
const greatsword: InventoryItem = {
  id: "greatsword",
  name: "Épée à deux mains",
  quantity: 1,
  equipped: true,
  weapon: {
    category: "martial",
    range: "melee",
    damageDice: "2d6",
    damageType: "slashing",
    twoHanded: true,
  },
};

describe("WeaponPlacementControl", () => {
  it("offers the grip of a versatile weapon in hand, off hand greyed out when not allowed", async () => {
    const onPlace = vi.fn();
    const user = userEvent.setup();
    render(
      <WeaponPlacementControl
        item={longsword}
        character={{ dualWielder: false }}
        onPlace={onPlace}
      />,
    );

    const grip = screen.getByRole("radiogroup", { name: "Prise : Épée longue" });
    expect(within(grip).getByRole("radio", { name: "Principale" })).toBeChecked();
    expect(within(grip).getByRole("radio", { name: "Secondaire" })).toBeDisabled();
    expect(screen.getByText(/arme légère de corps à corps requise/)).toBeInTheDocument();

    await user.click(within(grip).getByRole("radio", { name: "Deux mains" }));
    expect(onPlace).toHaveBeenCalledWith("both");
  });

  it("shows the two-handed grip and its damage", () => {
    render(
      <WeaponPlacementControl
        item={{ ...longsword, hand: "both" }}
        character={{ dualWielder: true }}
        onPlace={() => {}}
      />,
    );
    const grip = screen.getByRole("radiogroup", { name: "Prise : Épée longue" });
    expect(within(grip).getByRole("radio", { name: "Deux mains" })).toBeChecked();
    expect(within(grip).getByRole("radio", { name: "Secondaire" })).toBeEnabled();
    expect(screen.getByText(/dégâts à deux mains \(1d10\)/)).toBeInTheDocument();
  });

  it("has no grip choice for a two-handed weapon or a weapon out of hand", () => {
    const { unmount } = render(
      <WeaponPlacementControl item={greatsword} character={{}} onPlace={() => {}} />,
    );
    expect(screen.queryByRole("radiogroup", { name: /^Prise/ })).not.toBeInTheDocument();
    unmount();

    render(
      <WeaponPlacementControl
        item={{ ...longsword, equipped: false }}
        character={{}}
        onPlace={() => {}}
      />,
    );
    expect(screen.queryByRole("radiogroup", { name: /^Prise/ })).not.toBeInTheDocument();
  });
});
