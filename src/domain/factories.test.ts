import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "./factories";

describe("createBlankCharacter", () => {
  it("fills neutral defaults from a minimal input", () => {
    const character = createBlankCharacter({ name: "Elara Duskwood", class: "Cleric" });

    expect(character.name).toBe("Elara Duskwood");
    expect(character.class).toBe("Cleric");
    expect(character.level).toBe(1);
    expect(character.abilityScores).toEqual({
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    });
    expect(character.inventory).toEqual([]);
    expect(character.features).toEqual([]);
  });

  it("generates a unique id for every call", () => {
    const a = createBlankCharacter({ name: "A", class: "Fighter" });
    const b = createBlankCharacter({ name: "B", class: "Fighter" });
    expect(a.id).not.toBe(b.id);
  });

  it("respects an explicit level", () => {
    const character = createBlankCharacter({ name: "A", class: "Wizard", level: 5 });
    expect(character.level).toBe(5);
  });
});
