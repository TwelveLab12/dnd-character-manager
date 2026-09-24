import { beforeEach, describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { LocalStorageCharacterRepository } from "./local-storage-character-repository";

describe("LocalStorageCharacterRepository", () => {
  let repository: LocalStorageCharacterRepository;

  beforeEach(() => {
    window.localStorage.clear();
    repository = new LocalStorageCharacterRepository();
  });

  it("starts empty", async () => {
    expect(await repository.list()).toEqual([]);
    expect(await repository.getById("missing")).toBeNull();
  });

  it("creates and lists a character", async () => {
    const character = makeTestCharacter();
    await repository.create(character);
    expect(await repository.list()).toEqual([character]);
    expect(await repository.getById(character.id)).toEqual(character);
  });

  it("rejects creating a character with a duplicate id", async () => {
    await repository.create(makeTestCharacter());
    await expect(repository.create(makeTestCharacter())).rejects.toThrow(/already exists/);
  });

  it("updates a character and bumps updatedAt", async () => {
    const character = makeTestCharacter();
    await repository.create(character);

    const updated = await repository.update(character.id, { ...character, name: "New Name" });

    expect(updated.name).toBe("New Name");
    expect(updated.updatedAt).not.toBe(character.updatedAt);
    expect(await repository.getById(character.id)).toEqual(updated);
  });

  it("rejects updating a character that does not exist", async () => {
    await expect(repository.update("missing", makeTestCharacter())).rejects.toThrow(/not found/);
  });

  it("deletes a character", async () => {
    const character = makeTestCharacter();
    await repository.create(character);
    await repository.delete(character.id);
    expect(await repository.list()).toEqual([]);
  });

  it("deleting an unknown id is a no-op", async () => {
    await expect(repository.delete("missing")).resolves.toBeUndefined();
  });

  it("upserts new characters as additions", async () => {
    const result = await repository.upsertMany([
      makeTestCharacter({ id: "a" }),
      makeTestCharacter({ id: "b" }),
    ]);
    expect(result).toEqual({ added: 2, updated: 0, skipped: 0 });
    expect(await repository.list()).toHaveLength(2);
  });

  it("upserting an existing id counts as an update and replaces the record", async () => {
    await repository.upsertMany([makeTestCharacter({ id: "a", level: 3 })]);
    const result = await repository.upsertMany([makeTestCharacter({ id: "a", level: 5 })]);

    expect(result).toEqual({ added: 0, updated: 1, skipped: 0 });
    expect(await repository.getById("a")).toMatchObject({ level: 5 });
  });

  it("migrates characters stored in the original format instead of dropping them", async () => {
    const {
      spellSlotsUsed: _used,
      classResourcesUsed: _res,
      ...current
    } = makeTestCharacter({
      id: "legacy",
      class: "Clerc",
      level: 3,
    });
    window.localStorage.setItem(
      "dnd-character-manager:v1:characters",
      JSON.stringify({
        schemaVersion: 1,
        data: [{ ...current, spellSlots: [{ level: 1, total: 4, used: 1 }] }],
      }),
    );

    const [migrated] = await new LocalStorageCharacterRepository().list();
    expect(migrated).toMatchObject({ id: "legacy", classId: "clerc", spellSlotsUsed: { "1": 1 } });
    expect(
      JSON.parse(window.localStorage.getItem("dnd-character-manager:v1:characters") ?? "{}"),
    ).toMatchObject({ schemaVersion: 4 });
  });

  it("derives subclassId for characters stored in version 2, keeping their choices", async () => {
    const character = makeTestCharacter({
      id: "v2",
      classId: "clerc",
      subclass: "Domaine du Crépuscule",
      features: [{ id: "pool", name: "Canalisation divine", source: "Clerc", description: "" }],
    });
    window.localStorage.setItem(
      "dnd-character-manager:v1:characters",
      JSON.stringify({ schemaVersion: 2, data: [character] }),
    );

    const [migrated] = await new LocalStorageCharacterRepository().list();
    expect(migrated).toEqual({ ...character, subclassId: "crepuscule" });
  });
});
