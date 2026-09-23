import { beforeEach, describe, expect, it } from "vitest";
import { makeTestSpell } from "@/test/fixtures";
import { LocalStorageSpellRepository } from "./local-storage-spell-repository";

describe("LocalStorageSpellRepository", () => {
  let repository: LocalStorageSpellRepository;

  beforeEach(() => {
    window.localStorage.clear();
    repository = new LocalStorageSpellRepository();
  });

  it("upserts new spells as additions", async () => {
    const result = await repository.upsertMany([
      makeTestSpell({ id: "fireball" }),
      makeTestSpell({ id: "shield" }),
    ]);
    expect(result).toEqual({ added: 2, updated: 0, skipped: 0 });
    expect(await repository.list()).toHaveLength(2);
  });

  it("upserting an existing id counts as an update and replaces the record", async () => {
    await repository.upsertMany([makeTestSpell({ id: "fireball", level: 3 })]);
    const result = await repository.upsertMany([makeTestSpell({ id: "fireball", level: 5 })]);

    expect(result).toEqual({ added: 0, updated: 1, skipped: 0 });
    expect(await repository.getById("fireball")).toMatchObject({ level: 5 });
  });

  it("deletes a spell", async () => {
    await repository.upsertMany([makeTestSpell({ id: "fireball" })]);
    await repository.delete("fireball");
    expect(await repository.getById("fireball")).toBeNull();
  });

  it("clears every spell", async () => {
    await repository.upsertMany([
      makeTestSpell({ id: "fireball" }),
      makeTestSpell({ id: "shield" }),
    ]);
    await repository.clear();
    expect(await repository.list()).toEqual([]);
  });
});
