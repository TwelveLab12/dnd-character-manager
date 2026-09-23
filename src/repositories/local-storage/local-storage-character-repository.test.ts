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
});
