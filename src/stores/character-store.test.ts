import { describe, expect, it } from "vitest";
import { makeTestCharacter } from "@/test/fixtures";
import { InMemoryCharacterRepository } from "@/test/fakes";
import { createCharacterStore } from "./character-store";

describe("createCharacterStore", () => {
  it("starts empty and not loading", () => {
    const store = createCharacterStore(new InMemoryCharacterRepository());
    expect(store.getState().characters).toEqual([]);
    expect(store.getState().isLoading).toBe(false);
  });

  it("loads characters from the repository", async () => {
    const repository = new InMemoryCharacterRepository();
    const character = makeTestCharacter();
    await repository.create(character);

    const store = createCharacterStore(repository);
    await store.getState().load();

    expect(store.getState().characters).toEqual([character]);
    expect(store.getState().isLoading).toBe(false);
    expect(store.getState().error).toBeNull();
  });

  it("creates a character and reflects it immediately in state", async () => {
    const repository = new InMemoryCharacterRepository();
    const store = createCharacterStore(repository);
    const character = makeTestCharacter();

    await store.getState().create(character);

    expect(store.getState().characters).toEqual([character]);
    expect(await repository.getById(character.id)).toEqual(character);
  });

  it("removes a character and reflects it immediately in state", async () => {
    const repository = new InMemoryCharacterRepository();
    const character = makeTestCharacter();
    await repository.create(character);
    const store = createCharacterStore(repository);
    await store.getState().load();

    await store.getState().remove(character.id);

    expect(store.getState().characters).toEqual([]);
    expect(await repository.getById(character.id)).toBeNull();
  });

  it("surfaces a repository error from load() without throwing", async () => {
    const repository = new InMemoryCharacterRepository();
    repository.list = () => Promise.reject(new Error("boom"));
    const store = createCharacterStore(repository);

    await store.getState().load();

    expect(store.getState().error).toBe("boom");
    expect(store.getState().isLoading).toBe(false);
  });
});
