import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageClient } from "./local-storage-client";

describe("LocalStorageClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the fallback when nothing is stored", () => {
    const client = new LocalStorageClient<string[]>("widgets", []);
    expect(client.read()).toEqual([]);
  });

  it("round-trips written data", () => {
    const client = new LocalStorageClient<{ id: string }[]>("widgets", []);
    client.write([{ id: "a" }, { id: "b" }]);
    expect(client.read()).toEqual([{ id: "a" }, { id: "b" }]);
  });

  it("namespaces and versions the underlying key", () => {
    const client = new LocalStorageClient<number>("counter", 0);
    client.write(42);
    expect(window.localStorage.getItem("dnd-character-manager:v1:counter")).toBe(
      JSON.stringify({ schemaVersion: 1, data: 42 }),
    );
  });

  it("falls back to the default on corrupted JSON", () => {
    window.localStorage.setItem("dnd-character-manager:v1:widgets", "{not json");
    const client = new LocalStorageClient<string[]>("widgets", []);
    expect(client.read()).toEqual([]);
  });

  it("falls back to the default on a schema version mismatch", () => {
    window.localStorage.setItem(
      "dnd-character-manager:v1:widgets",
      JSON.stringify({ schemaVersion: 999, data: ["stale"] }),
    );
    const client = new LocalStorageClient<string[]>("widgets", []);
    expect(client.read()).toEqual([]);
  });

  it("migrates data from an older version and rewrites it in the current format", () => {
    window.localStorage.setItem(
      "dnd-character-manager:v1:widgets",
      JSON.stringify({ schemaVersion: 1, data: ["a"] }),
    );
    const client = new LocalStorageClient<string[]>("widgets", [], {
      schemaVersion: 2,
      migrate: (data, fromVersion) => (data as string[]).map((item) => `${item}@${fromVersion}`),
    });
    expect(client.read()).toEqual(["a@1"]);
    expect(window.localStorage.getItem("dnd-character-manager:v1:widgets")).toBe(
      JSON.stringify({ schemaVersion: 2, data: ["a@1"] }),
    );
  });

  it("does not migrate data from a newer version", () => {
    window.localStorage.setItem(
      "dnd-character-manager:v1:widgets",
      JSON.stringify({ schemaVersion: 3, data: ["future"] }),
    );
    const client = new LocalStorageClient<string[]>("widgets", [], {
      schemaVersion: 2,
      migrate: () => ["migrated"],
    });
    expect(client.read()).toEqual([]);
  });
});
