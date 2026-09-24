import { describe, expect, it } from "vitest";
import { makeTestSpell } from "@/test/fixtures";
import type { KnownSpellsPatch } from "./spell-preparation";
import {
  addKnownSpells,
  countPreparedSpells,
  removeKnownSpell,
  setSpellDomain,
  setSpellPreparation,
  spellBelongsToClass,
  spellPreparationState,
} from "./spell-preparation";

const BASE: KnownSpellsPatch = {
  knownSpellIds: ["cure", "moonbeam", "bless"],
  preparedSpellIds: ["cure"],
  spellTags: [{ spellId: "moonbeam", domain: "Domaine de la Lune", alwaysPrepared: true }],
};

describe("spellPreparationState", () => {
  it("reads none, prepared and always", () => {
    expect(spellPreparationState(BASE, "bless")).toBe("none");
    expect(spellPreparationState(BASE, "cure")).toBe("prepared");
    expect(spellPreparationState(BASE, "moonbeam")).toBe("always");
  });

  it("lets always win over legacy data holding both states", () => {
    const legacy = { ...BASE, preparedSpellIds: ["moonbeam"] };
    expect(spellPreparationState(legacy, "moonbeam")).toBe("always");
  });
});

describe("setSpellPreparation", () => {
  it("un-prepares a prepared spell when it becomes always-prepared", () => {
    const next = setSpellPreparation(BASE, "cure", "always");
    expect(next.preparedSpellIds).toEqual([]);
    expect(next.spellTags).toContainEqual({ spellId: "cure", alwaysPrepared: true });
  });

  it("drops always-prepared but keeps the domain when a spell becomes prepared", () => {
    const next = setSpellPreparation(BASE, "moonbeam", "prepared");
    expect(next.preparedSpellIds).toEqual(["cure", "moonbeam"]);
    expect(next.spellTags).toEqual([
      { spellId: "moonbeam", domain: "Domaine de la Lune", alwaysPrepared: false },
    ]);
  });

  it("removes an empty tag and the prepared id when set to none", () => {
    const always = setSpellPreparation(BASE, "bless", "always");
    const next = setSpellPreparation({ ...always, preparedSpellIds: ["bless"] }, "bless", "none");
    expect(next.preparedSpellIds).toEqual([]);
    expect(next.spellTags.some((tag) => tag.spellId === "bless")).toBe(false);
  });
});

describe("setSpellDomain", () => {
  it("adds, then clears a domain tag", () => {
    const tagged = setSpellDomain(BASE, "bless", "Domaine de la Vie");
    expect(tagged.spellTags).toContainEqual({
      spellId: "bless",
      domain: "Domaine de la Vie",
      alwaysPrepared: false,
    });
    expect(setSpellDomain(tagged, "bless", "").spellTags).toEqual(BASE.spellTags);
  });
});

describe("addKnownSpells / removeKnownSpell", () => {
  it("adds without duplicates", () => {
    expect(addKnownSpells(BASE, ["bless", "aid"]).knownSpellIds).toEqual([
      "cure",
      "moonbeam",
      "bless",
      "aid",
    ]);
  });

  it("removes a spell from known, prepared and tags", () => {
    expect(removeKnownSpell(BASE, "moonbeam")).toEqual({
      knownSpellIds: ["cure", "bless"],
      preparedSpellIds: ["cure"],
      spellTags: [],
    });
    expect(removeKnownSpell(BASE, "cure").preparedSpellIds).toEqual([]);
  });
});

describe("spellBelongsToClass", () => {
  it("matches French and English class labels", () => {
    expect(spellBelongsToClass(makeTestSpell({ classes: ["Cleric"] }), "clerc")).toBe(true);
    expect(spellBelongsToClass(makeTestSpell({ classes: ["Magicien", "Clerc"] }), "clerc")).toBe(
      true,
    );
    expect(spellBelongsToClass(makeTestSpell({ classes: ["Wizard"] }), "clerc")).toBe(false);
  });
});

describe("countPreparedSpells", () => {
  it("counts only known, leveled, prepared spells (not cantrips nor always-prepared)", () => {
    const library = [
      makeTestSpell({ id: "cure", level: 1 }),
      makeTestSpell({ id: "moonbeam", level: 2 }),
      makeTestSpell({ id: "bless", level: 1 }),
      makeTestSpell({ id: "light", level: 0 }),
    ];
    const character = {
      ...BASE,
      knownSpellIds: [...BASE.knownSpellIds, "light"],
      preparedSpellIds: ["cure", "moonbeam", "light", "unknown"],
    };
    expect(countPreparedSpells(character, library)).toBe(1);
  });
});
