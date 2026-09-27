import { describe, expect, it } from "vitest";
import type { ActivityEntry } from "@/domain/activity-log";
import { buildActivityEntry } from "@/domain/activity-log";
import { InMemoryActivityLogRepository, InMemoryCharacterRepository } from "@/test/fakes";
import { makeTestCharacter } from "@/test/fixtures";
import { createActivityLogStore } from "./activity-log-store";
import { createCharacterStore } from "./character-store";

const NOW = new Date("2026-09-27T12:00:00.000Z");

function damage(from: number, to: number, at: string): ActivityEntry {
  return buildActivityEntry(
    [{ key: "hp", label: "PV", from, to, category: "hit-points" }],
    undefined,
    { id: `${at}-${to}`, at },
  )!;
}

describe("activity log store", () => {
  it("records rapid actions in order, merging them", async () => {
    const repository = new InMemoryActivityLogRepository();
    const store = createActivityLogStore(repository, () => NOW);

    await Promise.all([
      store.getState().record("c1", damage(10, 9, "2026-09-27T11:59:00.000Z")),
      store.getState().record("c1", damage(9, 8, "2026-09-27T11:59:01.000Z")),
      store.getState().record("c1", damage(8, 7, "2026-09-27T11:59:02.000Z")),
    ]);

    expect(store.getState().entries.c1).toHaveLength(1);
    expect((await repository.list("c1"))[0]?.changes[0]).toMatchObject({ from: 10, to: 7 });
  });

  it("prunes old entries on load and when the retention shrinks", async () => {
    const repository = new InMemoryActivityLogRepository();
    await repository.save("c1", [
      damage(5, 4, "2026-08-01T00:00:00.000Z"),
      damage(4, 3, "2026-09-10T00:00:00.000Z"),
    ]);
    const store = createActivityLogStore(repository, () => NOW);

    await store.getState().load("c1");
    expect(store.getState().entries.c1).toHaveLength(1);

    await store.getState().setRetention(7);
    expect(store.getState().entries.c1).toEqual([]);
    expect(repository.retention).toBe(7);
  });

  it("keeps the most recent half when storage is full, and never throws", async () => {
    const repository = new InMemoryActivityLogRepository();
    await repository.save("c1", [
      damage(20, 19, "2026-09-27T10:00:00.000Z"),
      damage(19, 18, "2026-09-27T10:30:00.000Z"),
      damage(18, 17, "2026-09-27T11:00:00.000Z"),
    ]);
    const store = createActivityLogStore(repository, () => NOW);
    let calls = 0;
    const save = repository.save.bind(repository);
    repository.save = async (characterId, entries) => {
      calls += 1;
      if (calls === 1) {
        throw new Error("QuotaExceededError");
      }
      return save(characterId, entries);
    };

    await store.getState().record("c1", damage(17, 16, NOW.toISOString()));
    expect(calls).toBe(2);
    const kept = await repository.list("c1");
    expect(kept.map((entry) => entry.changes[0]?.to)).toEqual([17, 16]);
  });

  it("clears a character's history, also when the character is deleted", async () => {
    const repository = new InMemoryActivityLogRepository();
    const logStore = createActivityLogStore(repository, () => NOW);
    await logStore.getState().record("c1", damage(10, 9, NOW.toISOString()));

    const characters = new InMemoryCharacterRepository();
    const characterStore = createCharacterStore(characters, {
      onRemove: (id) => logStore.getState().clear(id),
    });
    await characterStore.getState().create(makeTestCharacter({ id: "c1" }));
    await characterStore.getState().remove("c1");

    expect(await repository.list("c1")).toEqual([]);
    expect(logStore.getState().entries.c1).toEqual([]);
  });
});
