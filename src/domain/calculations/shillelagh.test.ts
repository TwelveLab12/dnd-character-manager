import { describe, expect, it } from "vitest";
import type { Character } from "../character";
import type { InventoryItem } from "../inventory";
import type { Spell } from "../spell";
import { makeTestCharacter } from "@/test/fixtures";
import { applyLongRest, applyShortRest } from "./rest";
import {
  isShillelaghSpell,
  isShillelaghWeapon,
  knowsShillelagh,
  reconcileShillelagh,
  shillelaghItemId,
  startShillelagh,
} from "./shillelagh";
import { castSpell } from "./spell-casting";
import { computeWeaponAttack } from "./weapon-attack";

const quarterstaff: InventoryItem = {
  id: "staff",
  name: "Bâton",
  quantity: 1,
  equipped: true,
  weapon: {
    category: "simple",
    range: "melee",
    damageDice: "1d6",
    versatileDamageDice: "1d8",
    damageType: "bludgeoning",
  },
};
const club: InventoryItem = {
  id: "club",
  name: "Gourdin",
  quantity: 1,
  equipped: true,
  hand: "off",
  weapon: {
    category: "simple",
    range: "melee",
    damageDice: "1d4",
    damageType: "bludgeoning",
    light: true,
  },
};
const dagger: InventoryItem = {
  id: "dagger",
  name: "Dague",
  quantity: 1,
  equipped: true,
  weapon: { category: "simple", range: "melee", damageDice: "1d4", damageType: "piercing" },
};

const spell: Spell = {
  id: "spell-shillelagh",
  name: "Gourdin magique",
  level: 0,
  school: "Transmutation",
  castingTime: "1 action bonus",
  range: "Contact",
  components: { verbal: true, somatic: true, material: true },
  duration: "1 minute",
  concentration: false,
  ritual: false,
  description: "",
  classes: ["Druide"],
};

function druid(overrides: Partial<Character> = {}): Character {
  return makeTestCharacter({
    classId: "druide",
    level: 3,
    abilityScores: {
      strength: 8,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 17,
      charisma: 10,
    },
    weaponProficiencies: ["simple"],
    inventory: [quarterstaff, club, dagger],
    knownSpellIds: [spell.id],
    ...overrides,
  });
}

describe("Gourdin magique", () => {
  it("recognizes the spell and eligible weapons by name", () => {
    expect(isShillelaghSpell(spell)).toBe(true);
    expect(isShillelaghSpell({ ...spell, name: "Shillelagh" })).toBe(true);
    expect(isShillelaghSpell({ ...spell, name: "Gourdin" })).toBe(false);
    expect(isShillelaghWeapon(quarterstaff)).toBe(true);
    expect(isShillelaghWeapon({ ...club, name: "Gourdin clouté" })).toBe(true);
    expect(isShillelaghWeapon(dagger)).toBe(false);
  });

  it("knows the spell only if it is known or prepared", () => {
    expect(knowsShillelagh(druid(), [spell])).toBe(true);
    expect(knowsShillelagh(druid({ knownSpellIds: [] }), [spell])).toBe(false);
  });

  it("uses the spellcasting ability and a d8 on the enchanted weapon", () => {
    const character = druid({ shillelagh: { itemId: "staff" } });
    const attack = computeWeaponAttack(character, quarterstaff);
    // Sagesse 17 (+3) + maîtrise +2, au lieu de Force 8 (-1).
    expect(attack?.ability).toBe("wisdom");
    expect(attack?.attackBonus).toBe(5);
    expect(attack?.damage).toBe("1d8+3");
    expect(attack?.shillelagh).toBe(true);
    expect(attack?.attackTerms[0]?.label).toBe("Sagesse");
    expect(attack?.damageNotes.some((note) => note.startsWith("Gourdin magique"))).toBe(true);
    // Les autres armes gardent la Force.
    expect(computeWeaponAttack(character, dagger)?.damage).toBe("1d4-1");
  });

  it("keeps a d8 when a versatile quarterstaff is held in both hands", () => {
    const twoHanded = { ...quarterstaff, hand: "both" as const };
    const character = druid({ inventory: [twoHanded], shillelagh: { itemId: "staff" } });
    expect(computeWeaponAttack(character, twoHanded)?.damage).toBe("1d8+3");
  });

  it("is cast on the weapon in the main hand first", () => {
    expect(castSpell(druid(), spell, { type: "cantrip" }).shillelagh).toEqual({ itemId: "staff" });
    expect(startShillelagh(druid(), "club")).toEqual({ shillelagh: { itemId: "club" } });
    expect(startShillelagh(druid({ inventory: [dagger] }))).toEqual({});
  });

  it("ends when the weapon leaves the hand", () => {
    const character = druid({ shillelagh: { itemId: "staff" } });
    const sheathed = { inventory: [{ ...quarterstaff, equipped: false }, club, dagger] };
    expect(reconcileShillelagh(character, sheathed).shillelagh).toBeUndefined();
    expect(shillelaghItemId({ ...character, ...sheathed })).toBeUndefined();
    expect(reconcileShillelagh(character, {})).toEqual({});
  });

  it("ends on any rest", () => {
    const character = druid({ shillelagh: { itemId: "staff" } });
    expect(applyShortRest(character).shillelagh).toBeUndefined();
    expect("shillelagh" in applyShortRest(character)).toBe(true);
    expect("shillelagh" in applyLongRest(character)).toBe(true);
  });
});
