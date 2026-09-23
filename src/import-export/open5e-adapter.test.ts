import { describe, expect, it } from "vitest";
import type { Open5eV1Spell, Open5eV2Spell } from "./open5e-adapter";
import { mapOpen5eSpell, mapOpen5eV1Spell, mapOpen5eV2Spell } from "./open5e-adapter";

// Ces fixtures reproduisent la STRUCTURE réelle des réponses open5e (vérifiée en direct contre
// api.open5e.com le 2026-09-23, ex : /v1/spells/fireball/ et /v2/spells/srd_fireball/) mais avec
// un nom/texte inventés — voir docs/adr/0004-json-import-export-open5e-schema.md : aucun texte de
// sort du SRD n'est reproduit dans ce repo, y compris dans les fixtures de test.
const open5eV1Fixture: Open5eV1Spell = {
  slug: "test-bolt",
  name: "Test Bolt",
  desc: "A bolt of test energy streaks toward its target.",
  higher_level: "The test damage increases by 1d6 for each slot level above 3rd.",
  range: "150 feet",
  requires_verbal_components: true,
  requires_somatic_components: true,
  requires_material_components: true,
  material: "A tiny ball of test residue.",
  can_be_cast_as_ritual: false,
  duration: "instantaneous",
  requires_concentration: false,
  casting_time: "1 action",
  level_int: 3,
  school: "evocation",
  dnd_class: "Sorcerer, Wizard",
  document__title: "5e Core Rules",
};

const open5eV2Fixture: Open5eV2Spell = {
  key: "test_test-ward",
  name: "Test Ward",
  desc: "An invisible barrier of test energy protects you.",
  higher_level: "",
  school: { name: "abjuration" },
  classes: [{ name: "Cleric" }, { name: "Paladin" }],
  level: 1,
  range_text: "Self",
  ritual: false,
  casting_time: "action",
  verbal: true,
  somatic: true,
  material: false,
  material_specified: "",
  duration: "1 minute",
  concentration: true,
  document: { name: "System Reference Document 5.1" },
};

describe("mapOpen5eV1Spell", () => {
  it("maps every field to the canonical Spell shape", () => {
    expect(mapOpen5eV1Spell(open5eV1Fixture)).toEqual({
      id: "test-bolt",
      name: "Test Bolt",
      level: 3,
      school: "Evocation",
      castingTime: "1 action",
      range: "150 feet",
      components: {
        verbal: true,
        somatic: true,
        material: true,
        materialDescription: "A tiny ball of test residue.",
      },
      duration: "Instantaneous",
      concentration: false,
      ritual: false,
      description: "A bolt of test energy streaks toward its target.",
      higherLevel: "The test damage increases by 1d6 for each slot level above 3rd.",
      classes: ["Sorcerer", "Wizard"],
      source: "5e Core Rules",
    });
  });

  it("omits empty optional fields rather than keeping blank strings", () => {
    const spell = mapOpen5eV1Spell({ ...open5eV1Fixture, higher_level: "", material: "" });
    expect(spell.higherLevel).toBeUndefined();
    expect(spell.components.materialDescription).toBeUndefined();
  });
});

describe("mapOpen5eV2Spell", () => {
  it("maps every field to the canonical Spell shape", () => {
    expect(mapOpen5eV2Spell(open5eV2Fixture)).toEqual({
      id: "test_test-ward",
      name: "Test Ward",
      level: 1,
      school: "Abjuration",
      castingTime: "1 action",
      range: "Self",
      components: {
        verbal: true,
        somatic: true,
        material: false,
        materialDescription: undefined,
      },
      duration: "1 minute",
      concentration: true,
      ritual: false,
      description: "An invisible barrier of test energy protects you.",
      higherLevel: undefined,
      classes: ["Cleric", "Paladin"],
      source: "System Reference Document 5.1",
    });
  });

  it("falls back to a generic label for an unmapped casting_time slug", () => {
    const spell = mapOpen5eV2Spell({ ...open5eV2Fixture, casting_time: "long_rest" });
    expect(spell.castingTime).toBe("Long rest");
  });
});

describe("mapOpen5eSpell", () => {
  it("auto-detects a v1 payload", () => {
    expect(mapOpen5eSpell(open5eV1Fixture).id).toBe("test-bolt");
  });

  it("auto-detects a v2 payload", () => {
    expect(mapOpen5eSpell(open5eV2Fixture).id).toBe("test_test-ward");
  });

  it("rejects an unrecognized payload", () => {
    expect(() => mapOpen5eSpell({ foo: "bar" })).toThrow(/non reconnu/);
  });
});
