import { describe, expect, it } from "vitest";
import type { BeastForm } from "@/domain/wild-shape";
import {
  mergeBeastForms,
  parseBeastFormImportEntries,
  previewBeastFormImport,
} from "./beast-form-importer";

const wolf = {
  name: "Loup",
  challengeRating: "1/4",
  strength: 12,
  dexterity: 15,
  constitution: 12,
  armorClass: 13,
  maxHitPoints: 11,
  speed: 12,
  attacks: [
    {
      name: "Morsure",
      attackBonus: 4,
      damageDice: "2d4",
      damageBonus: 2,
      damageType: "piercing",
    },
  ],
};

describe("import de formes sauvages", () => {
  it("accepts an array or a { wildShapeForms } object and derives missing ids from names", () => {
    const parsed = parseBeastFormImportEntries(JSON.stringify({ wildShapeForms: [wolf, {}] }));
    expect(parsed.ok).toBe(true);
    const rows = previewBeastFormImport(parsed.ok ? parsed.entries : [], []);
    expect(rows[0]?.status).toBe("new");
    expect(rows[0]?.entity?.id).toBe("loup");
    expect(rows[0]?.entity?.attacks[0]?.id).toBe("morsure");
    expect(rows[1]?.status).toBe("invalid");
  });

  it("updates a form with the same id instead of duplicating it", () => {
    const existing = previewBeastFormImport([wolf], [])[0]!.entity!;
    const stronger: BeastForm = { ...existing, maxHitPoints: 15 };
    expect(previewBeastFormImport([{ ...wolf, maxHitPoints: 15 }], [existing])[0]?.status).toBe(
      "update",
    );
    expect(mergeBeastForms([existing], [stronger])).toEqual({
      forms: [stronger],
      added: 0,
      updated: 1,
    });
  });
});
