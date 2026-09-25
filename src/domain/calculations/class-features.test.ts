import { describe, expect, it } from "vitest";
import { makeTestCharacter, makeTestSpell } from "@/test/fixtures";
import {
  computeAlwaysPreparedSpells,
  computeClassResourceOptions,
  effectiveArmorProficiencies,
  effectiveWeaponProficiencies,
  grantedProficiencies,
  ruleClassResourceOptions,
  ruleProficiencyGrants,
  toggleProficiency,
} from "./class-features";
import { playAvailableSpellIds, spellDomain } from "./spell-availability";

const library = [
  makeTestSpell({ id: "lueur", name: "Lueur féerique (Faerie Fire)" }),
  makeTestSpell({ id: "sommeil", name: "Sommeil (Sleep)" }),
  makeTestSpell({ id: "moonbeam", name: "Lueur de Lune (Moonbeam)", level: 2 }),
  makeTestSpell({ id: "see-invis", name: "Voir l’Invisibilité", level: 2 }),
];

function twilightCleric(level: number) {
  return makeTestCharacter({ classId: "clerc", subclassId: "crepuscule", level });
}

describe("computeAlwaysPreparedSpells (Domaine du Crépuscule)", () => {
  it("grants the level-1 domain spells at cleric level 1", () => {
    expect(
      computeAlwaysPreparedSpells(twilightCleric(1), library).map(({ spell }) => spell?.id),
    ).toEqual(["lueur", "sommeil"]);
  });

  it("adds the level-3 spells at cleric level 3, matching French or English names", () => {
    expect(
      computeAlwaysPreparedSpells(twilightCleric(3), library).map(({ spell }) => spell?.id),
    ).toEqual(["lueur", "sommeil", "moonbeam", "see-invis"]);
  });

  it("reports a domain spell missing from the library", () => {
    const [aura] = computeAlwaysPreparedSpells(twilightCleric(5), library).slice(4);
    expect(aura).toEqual({ reference: expect.objectContaining({ name: "Aura de vitalité" }) });
  });

  it("grants nothing without a known subclass", () => {
    expect(
      computeAlwaysPreparedSpells(makeTestCharacter({ classId: "clerc", level: 5 }), library),
    ).toEqual([]);
  });

  it("makes domain spells available in play, tagged with the domain", () => {
    const character = twilightCleric(3);
    expect(playAvailableSpellIds(character, library)).toEqual(
      expect.arrayContaining(["lueur", "sommeil", "moonbeam", "see-invis"]),
    );
    expect(spellDomain(character, "moonbeam", library)).toBe("Domaine du Crépuscule");
  });
});

describe("effective proficiencies", () => {
  it("unions the sheet with the class and domain grants", () => {
    const character = makeTestCharacter({
      classId: "clerc",
      subclassId: "crepuscule",
      armorProficiencies: [],
      weaponProficiencies: [],
    });
    expect(effectiveArmorProficiencies(character).sort()).toEqual(
      ["heavy", "light", "medium", "shield"].sort(),
    );
    expect(effectiveWeaponProficiencies(character).sort()).toEqual(["martial", "simple"]);
  });

  it("keeps the sheet's proficiencies for a class outside the registry", () => {
    const character = makeTestCharacter({ weaponProficiencies: ["martial"] });
    expect(effectiveWeaponProficiencies(character)).toEqual(["martial"]);
  });

  it("drops the grants removed for this character, everywhere", () => {
    const character = makeTestCharacter({
      classId: "clerc",
      subclassId: "crepuscule",
      removedArmorProficiencies: ["heavy"],
      removedWeaponProficiencies: ["martial"],
    });
    expect(effectiveArmorProficiencies(character)).not.toContain("heavy");
    expect(effectiveWeaponProficiencies(character)).toEqual(["simple"]);
    expect(
      grantedProficiencies(character).find((grant) => grant.source === "Domaine du Crépuscule"),
    ).toMatchObject({ armor: [], weapons: [] });
    expect(ruleProficiencyGrants(character)[1]).toMatchObject({
      armor: ["heavy"],
      weapons: ["martial"],
    });
  });
});

describe("toggleProficiency", () => {
  const order = ["light", "medium", "heavy", "shield"] as const;

  it("records a removed grant and restores it when checked again", () => {
    const removed = toggleProficiency(
      order,
      { manual: [], removed: [], granted: true },
      "shield",
      false,
    );
    expect(removed).toEqual({ manual: undefined, removed: ["shield"] });
    const restored = toggleProficiency(
      order,
      { manual: [], removed: ["shield"], granted: true },
      "shield",
      true,
    );
    expect(restored).toEqual({ manual: undefined, removed: undefined });
  });

  it("adds and removes a proficiency outside the rules, in a stable order", () => {
    expect(
      toggleProficiency(order, { manual: ["shield"], removed: [], granted: false }, "light", true),
    ).toEqual({ manual: ["light", "shield"], removed: undefined });
    expect(
      toggleProficiency(order, { manual: ["light"], removed: [], granted: false }, "light", false),
    ).toEqual({ manual: undefined, removed: undefined });
  });
});

describe("computeClassResourceOptions", () => {
  it("drops the options removed for this character, which the rules still list", () => {
    const character = { ...twilightCleric(2), removedClassResourceOptions: ["turn-undead"] };
    expect(
      computeClassResourceOptions(character, "channel-divinity").map((option) => option.id),
    ).toEqual(["twilight-sanctuary"]);
    expect(
      ruleClassResourceOptions(character, "channel-divinity").map((option) => option.id),
    ).toEqual(["turn-undead", "twilight-sanctuary"]);
  });

  it("lists Turn Undead and Twilight Sanctuary from cleric level 2", () => {
    expect(computeClassResourceOptions(twilightCleric(2), "channel-divinity")).toEqual([
      { id: "turn-undead", name: "Renvoi des morts-vivants", source: "Clerc" },
      {
        id: "twilight-sanctuary",
        name: "Sanctuaire du Crépuscule",
        source: "Domaine du Crépuscule",
      },
    ]);
  });

  it("lists only the class option without a known domain, none before level 2", () => {
    expect(
      computeClassResourceOptions(
        makeTestCharacter({ classId: "clerc", level: 2 }),
        "channel-divinity",
      ).map((option) => option.id),
    ).toEqual(["turn-undead"]);
    expect(computeClassResourceOptions(twilightCleric(1), "channel-divinity")).toEqual([]);
  });
});

describe("Cercle des spores (Druide)", () => {
  const sporesLibrary = [
    makeTestSpell({ id: "chill", name: "Contact glacial (Chill Touch)", level: 0 }),
    makeTestSpell({ id: "blind", name: "Cécité / Surdité (Blindness/Deafness)", level: 2 }),
    makeTestSpell({ id: "repose", name: "Préservation des morts (Gentle Repose)", level: 2 }),
  ];

  function sporesDruid(level: number) {
    return makeTestCharacter({ classId: "druide", subclassId: "spores", level });
  }

  it("grants Chill Touch at level 2, then the level-3 circle spells", () => {
    expect(
      computeAlwaysPreparedSpells(sporesDruid(2), sporesLibrary).map(({ spell }) => spell?.id),
    ).toEqual(["chill"]);
    expect(
      computeAlwaysPreparedSpells(sporesDruid(3), sporesLibrary).map(({ spell }) => spell?.id),
    ).toEqual(["chill", "blind", "repose"]);
  });

  it("lists Beast Shape and Symbiotic Entity as Wild Shape options from level 2", () => {
    expect(computeClassResourceOptions(sporesDruid(2), "wild-shape")).toEqual([
      { id: "beast-shape", name: "Forme de bête", source: "Druide" },
      { id: "symbiotic-entity", name: "Entité symbiotique", source: "Cercle des spores" },
    ]);
    expect(computeClassResourceOptions(sporesDruid(1), "wild-shape")).toEqual([]);
  });

  it("grants the druid's armor proficiencies", () => {
    expect(effectiveArmorProficiencies(sporesDruid(3))).toEqual(["light", "medium", "shield"]);
  });
});
