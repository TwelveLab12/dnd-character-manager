import { z } from "zod";
import { describe, expect, it } from "vitest";
import { previewImport } from "./preview-import";

const widgetSchema = z.object({ id: z.string().min(1), name: z.string().min(1) });

describe("previewImport", () => {
  it("classifies new, identical and updated entities, and reports invalid ones", () => {
    const existing = [{ id: "a", name: "A" }];
    const rows = previewImport(
      [
        { id: "b", name: "B" }, // new
        { id: "a", name: "A" }, // identical
        { id: "a", name: "A2" }, // update
        { id: "" }, // invalid
      ],
      { schema: widgetSchema, existing },
    );

    expect(rows.map((row) => row.status)).toEqual(["new", "identical", "update", "invalid"]);
  });

  it("uses the default (name-based) label, or a custom labelFor when given", () => {
    const [defaultLabelRow] = previewImport([{ id: "a", name: "A" }], {
      schema: widgetSchema,
      existing: [],
    });
    expect(defaultLabelRow?.label).toBe("A");

    const [customLabelRow] = previewImport([{ id: "a", name: "A" }], {
      schema: widgetSchema,
      existing: [],
      labelFor: (raw) => `custom:${(raw as { id: string }).id}`,
    });
    expect(customLabelRow?.label).toBe("custom:a");
  });

  it("applies fillDefaults before validation", () => {
    const [row] = previewImport([{ name: "A" }], {
      schema: widgetSchema,
      existing: [],
      fillDefaults: (raw) => ({ ...(raw as object), id: "generated" }),
    });
    expect(row).toMatchObject({ status: "new", entity: { id: "generated", name: "A" } });
  });
});
