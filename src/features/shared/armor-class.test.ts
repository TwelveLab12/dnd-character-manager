import { describe, expect, it } from "vitest";
import { formatArmorClassBreakdown } from "./armor-class";

describe("formatArmorClassBreakdown", () => {
  it("joins parts with signed operators", () => {
    expect(
      formatArmorClassBreakdown({
        total: 17,
        breakdown: [
          { label: "Cuirasse", value: 14 },
          { label: "Dex", value: -1 },
          { label: "Bouclier", value: 2 },
          { label: "Bouclier de la foi", value: 2 },
        ],
        warnings: [],
      }),
    ).toBe("Cuirasse 14 − Dex 1 + Bouclier 2 + Bouclier de la foi 2");
  });
});
