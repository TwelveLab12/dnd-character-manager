import { describe, expect, it } from "vitest";
import { makeTestSpell } from "@/test/fixtures";
import { LocalStorageSpellRepository } from "@/repositories/local-storage/local-storage-spell-repository";
import { createSpellStore } from "./spell-store";

describe("createSpellStore", () => {
  it("starts empty and not loading", () => {
    window.localStorage.clear();
    const store = createSpellStore(new LocalStorageSpellRepository());
    expect(store.getState().spells).toEqual([]);
    expect(store.getState().isLoading).toBe(false);
  });

  it("loads spells from the repository", async () => {
    window.localStorage.clear();
    const repository = new LocalStorageSpellRepository();
    const spell = makeTestSpell();
    await repository.upsertMany([spell]);

    const store = createSpellStore(repository);
    await store.getState().load();

    expect(store.getState().spells).toEqual([spell]);
  });

  it("upserts spells and reflects added/updated counts immediately in state", async () => {
    window.localStorage.clear();
    const repository = new LocalStorageSpellRepository();
    const store = createSpellStore(repository);

    const firstResult = await store.getState().upsertMany([makeTestSpell({ id: "fireball" })]);
    expect(firstResult).toEqual({ added: 1, updated: 0, skipped: 0 });
    expect(store.getState().spells).toHaveLength(1);

    const secondResult = await store
      .getState()
      .upsertMany([makeTestSpell({ id: "fireball", level: 5 })]);
    expect(secondResult).toEqual({ added: 0, updated: 1, skipped: 0 });
    expect(store.getState().spells).toEqual([expect.objectContaining({ level: 5 })]);
  });

  it("removes a spell", async () => {
    window.localStorage.clear();
    const repository = new LocalStorageSpellRepository();
    const store = createSpellStore(repository);
    await store.getState().upsertMany([makeTestSpell({ id: "fireball" })]);

    await store.getState().remove("fireball");

    expect(store.getState().spells).toEqual([]);
  });
});
