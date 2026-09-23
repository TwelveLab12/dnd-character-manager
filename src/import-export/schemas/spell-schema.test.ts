import { describe, expect, it } from "vitest";
import { makeTestSpell } from "@/test/fixtures";
import { spellSchema } from "./spell-schema";

describe("spellSchema", () => {
  it("round-trips a valid Spell unchanged", () => {
    const spell = makeTestSpell();
    expect(spellSchema.parse(spell)).toEqual(spell);
  });

  it("defaults concentration, ritual and classes when omitted", () => {
    const {
      concentration: _concentration,
      ritual: _ritual,
      classes: _classes,
      ...rest
    } = makeTestSpell();
    const parsed = spellSchema.parse(rest);
    expect(parsed.concentration).toBe(false);
    expect(parsed.ritual).toBe(false);
    expect(parsed.classes).toEqual([]);
  });

  it("rejects a spell level outside 0-9", () => {
    expect(() => spellSchema.parse(makeTestSpell({ level: 10 }))).toThrow();
  });

  it("rejects a missing required field", () => {
    const { name: _name, ...rest } = makeTestSpell();
    expect(() => spellSchema.parse(rest)).toThrow();
  });
});
