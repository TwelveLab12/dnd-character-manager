import { describe, expect, it } from "vitest";
import type { Character } from "../character";
import { makeTestCharacter } from "@/test/fixtures";
import { describeChanges } from "./activity-changes";

const cleric = makeTestCharacter({
  classId: "clerc",
  level: 3,
  hitPoints: { current: 20, temporary: 0 },
  concentration: { active: false },
  inventory: [
    {
      id: "dagger",
      name: "Dague",
      quantity: 2,
      weapon: { category: "simple", range: "melee", damageDice: "1d4", damageType: "piercing" },
    },
  ],
});

function keys(after: Partial<Character>) {
  return describeChanges(cleric, { ...cleric, ...after });
}

describe("describeChanges", () => {
  it("reports nothing when nothing changed", () => {
    expect(describeChanges(cleric, { ...cleric })).toEqual([]);
  });

  it("labels hit points, spell slots, class resources and hit dice", () => {
    expect(
      keys({
        hitPoints: { current: 12, temporary: 5 },
        spellSlotsUsed: { "2": 1 },
        classResourcesUsed: { "channel-divinity": 1 },
        hitDiceUsed: 1,
      }),
    ).toEqual([
      { key: "hp", label: "PV", from: 20, to: 12, category: "hit-points" },
      { key: "hp-temp", label: "PV temporaires", from: 0, to: 5, category: "hit-points" },
      { key: "hit-dice", label: "Dés de vie (d8)", from: 3, to: 2, category: "hit-points" },
      { key: "slot:2", label: "Emplacements niv. 2", from: 2, to: 1, category: "spells" },
      {
        key: "resource:channel-divinity",
        label: "Canalisation divine",
        from: 1,
        to: 0,
        category: "resources",
      },
    ]);
  });

  it("names the concentration spell and reports the dying status", () => {
    const changes = describeChanges(
      cleric,
      {
        ...cleric,
        hitPoints: { current: 0, temporary: 0 },
        concentration: { active: true, spellId: "bless" },
      },
      { spellName: (id) => (id === "bless" ? "Bénédiction" : undefined) },
    );
    expect(changes).toContainEqual({
      key: "status",
      label: "État",
      from: "Conscient",
      to: "Mourant",
      category: "status",
    });
    expect(changes).toContainEqual({
      key: "concentration",
      label: "Concentration",
      from: "non",
      to: "Bénédiction",
      category: "status",
    });
  });

  it("tracks quantities, weapon placement and coins", () => {
    const [dagger] = cleric.inventory;
    expect(
      keys({
        inventory: [{ ...dagger!, quantity: 1, equipped: true }],
        currency: { platinum: 0, gold: 15, electrum: 0, silver: 0, copper: 0 },
      }),
    ).toEqual([
      { key: "quantity:dagger", label: "Dague (quantité)", from: 2, to: 1, category: "inventory" },
      {
        key: "placement:dagger",
        label: "Dague",
        from: "Prête",
        to: "En main",
        category: "inventory",
      },
      { key: "coin:gold", label: "po", from: 0, to: 15, category: "inventory" },
    ]);
  });
});
