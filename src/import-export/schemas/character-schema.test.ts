import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { characterSchema } from "./character-schema";

describe("characterSchema", () => {
  it("round-trips a valid Character unchanged", () => {
    const character = makeTestCharacter();
    expect(characterSchema.parse(character)).toEqual(character);
  });

  it("defaults createdAt/updatedAt and the array fields when omitted", () => {
    const {
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      savingThrowProficiencies: _saves,
      inventory: _inventory,
      ...rest
    } = makeTestCharacter();
    const parsed = characterSchema.parse(rest);

    expect(parsed.createdAt).toEqual(expect.any(String));
    expect(parsed.updatedAt).toEqual(expect.any(String));
    expect(parsed.savingThrowProficiencies).toEqual([]);
    expect(parsed.inventory).toEqual([]);
  });

  it("rejects a level outside 1-20", () => {
    expect(() => characterSchema.parse(makeTestCharacter({ level: 21 }))).toThrow();
  });

  it("rejects a missing required field", () => {
    const { name: _name, ...rest } = makeTestCharacter();
    expect(() => characterSchema.parse(rest)).toThrow();
  });

  it("accepts a character with spellcasting, inventory and features populated", () => {
    const character = makeTestCharacter({
      spellcasting: { ability: "wisdom", spellSaveDCOverride: 15 },
      spellSlots: [{ level: 1, total: 4, used: 1 }],
      inventory: [{ id: "item-1", name: "Rope", quantity: 1 }],
      features: [{ id: "feat-1", name: "Channel Divinity", source: "Cleric", description: "..." }],
    });
    expect(characterSchema.parse(character)).toEqual(character);
  });
});
