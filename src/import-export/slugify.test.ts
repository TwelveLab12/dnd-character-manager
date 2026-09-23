import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it.each([
    ["Fireball", "fireball"],
    ["Fire Bolt", "fire-bolt"],
    ["Éclair", "eclair"],
    ["  Spell!! Name  ", "spell-name"],
    ["Melf's Acid Arrow", "melf-s-acid-arrow"],
  ])("turns %s into %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});
