import { describe, expect, it } from "vitest";
import type { ActivityChange, ActivityEntry } from "./activity-log";
import {
  MAX_ACTIVITY_ENTRIES,
  appendActivity,
  buildActivityEntry,
  pruneActivity,
} from "./activity-log";

const NOW = new Date("2026-09-27T12:00:00.000Z");

function hp(from: number, to: number): ActivityChange {
  return { key: "hp", label: "PV", from, to, category: "hit-points" };
}

function entry(changes: ActivityChange[], at: string, id = at): ActivityEntry {
  return buildActivityEntry(changes, undefined, { id, at })!;
}

describe("buildActivityEntry", () => {
  it("titles an entry from its changes, or uses the intent", () => {
    expect(entry([hp(10, 7)], NOW.toISOString()).title).toBe("Dégâts");
    expect(entry([hp(7, 10)], NOW.toISOString()).title).toBe("Soins");
    const cast = buildActivityEntry(
      [],
      { title: "Lumière lancé", category: "spells" },
      { id: "1", at: NOW.toISOString() },
    );
    expect(cast).toMatchObject({ title: "Lumière lancé", category: "spells", changes: [] });
    expect(cast?.mergeKey).toBeUndefined();
  });

  it("drops an entry with neither change nor intent", () => {
    expect(buildActivityEntry([], undefined, { id: "1", at: NOW.toISOString() })).toBeUndefined();
  });
});

describe("appendActivity", () => {
  const options = { now: NOW, retention: 30 as const };

  it("merges close actions on the same values", () => {
    const first = entry([hp(30, 29)], "2026-09-27T11:59:00.000Z", "a");
    const merged = appendActivity(
      [first],
      entry([hp(29, 22)], "2026-09-27T11:59:40.000Z", "b"),
      options,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: "a", title: "Dégâts", changes: [hp(30, 22)] });
  });

  it("keeps separate entries when too far apart or on other values", () => {
    const first = entry([hp(30, 29)], "2026-09-27T11:50:00.000Z", "a");
    expect(
      appendActivity([first], entry([hp(29, 28)], "2026-09-27T11:59:00.000Z"), options),
    ).toHaveLength(2);
    const temp = entry(
      [{ key: "hp-temp", label: "PV temporaires", from: 0, to: 5, category: "hit-points" }],
      "2026-09-27T11:50:10.000Z",
    );
    expect(appendActivity([first], temp, options)).toHaveLength(2);
  });

  it("removes a merged entry that went back to its starting value", () => {
    const first = entry([hp(30, 29)], "2026-09-27T11:59:00.000Z");
    expect(
      appendActivity([first], entry([hp(29, 30)], "2026-09-27T11:59:05.000Z"), options),
    ).toEqual([]);
  });
});

describe("pruneActivity", () => {
  it("drops entries older than the retention, keeps everything when unlimited", () => {
    const old = entry([hp(1, 2)], "2026-08-01T00:00:00.000Z");
    const recent = entry([hp(2, 3)], "2026-09-20T00:00:00.000Z");
    expect(pruneActivity([old, recent], { now: NOW, retention: 30 })).toEqual([recent]);
    expect(pruneActivity([old, recent], { now: NOW, retention: 7 })).toEqual([]);
    expect(pruneActivity([old, recent], { now: NOW, retention: null })).toEqual([old, recent]);
  });

  it("caps the number of entries, keeping the most recent", () => {
    const many = Array.from({ length: MAX_ACTIVITY_ENTRIES + 5 }, (_, index) =>
      entry([hp(index, index + 1)], NOW.toISOString(), String(index)),
    );
    const pruned = pruneActivity(many, { now: NOW, retention: null });
    expect(pruned).toHaveLength(MAX_ACTIVITY_ENTRIES);
    expect(pruned[0]?.id).toBe("5");
  });
});
