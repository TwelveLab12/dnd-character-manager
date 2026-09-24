import { describe, expect, it } from "vitest";
import type { InventoryItem } from "./inventory";
import { adjustItemQuantity, totalInventoryWeight } from "./inventory";

const inventory: InventoryItem[] = [
  { id: "torch", name: "Torches", quantity: 2, weight: 0.5 },
  { id: "symbol", name: "Symbole sacré", quantity: 1 },
];

describe("adjustItemQuantity", () => {
  it("changes only the targeted item and never goes below zero", () => {
    expect(adjustItemQuantity(inventory, "torch", 3)[0]?.quantity).toBe(5);
    expect(adjustItemQuantity(inventory, "torch", -5)[0]?.quantity).toBe(0);
    expect(adjustItemQuantity(inventory, "torch", -1)[1]).toBe(inventory[1]);
  });
});

describe("totalInventoryWeight", () => {
  it("multiplies unit weight by quantity and ignores items without weight", () => {
    expect(totalInventoryWeight(inventory)).toBe(1);
    expect(totalInventoryWeight([])).toBe(0);
  });
});
