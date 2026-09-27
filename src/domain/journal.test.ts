import { describe, expect, it } from "vitest";
import type { JournalSession } from "./journal";
import {
  addNote,
  createSession,
  deleteNote,
  deleteSession,
  journalSessionsView,
  localDateKey,
  nextSessionNumber,
  todaySession,
  updateNote,
  updateSession,
} from "./journal";

function session(id: string, date: string, createdAt: string, notes: string[] = []) {
  return {
    id,
    date,
    createdAt,
    notes: notes.map((text, index) => ({
      id: `${id}-${index}`,
      text,
      createdAt: `${createdAt.slice(0, 11)}1${index}:00:00.000Z`,
    })),
  } satisfies JournalSession;
}

describe("journal de l'aventurier", () => {
  it("formats the local day as AAAA-MM-JJ", () => {
    expect(localDateKey(new Date(2026, 8, 7, 23, 30))).toBe("2026-09-07");
  });

  it("lists sessions newest first, numbered by play date, notes newest first", () => {
    const journal = [
      session("late-entry", "2026-09-13", "2026-09-30T08:00:00.000Z"),
      session("first", "2026-08-16", "2026-08-16T08:00:00.000Z", ["a", "b"]),
      session("latest", "2026-09-27", "2026-09-27T08:00:00.000Z"),
    ];
    const views = journalSessionsView(journal);
    expect(views.map((view) => [view.session.id, view.number])).toEqual([
      ["latest", 3],
      ["late-entry", 2],
      ["first", 1],
    ]);
    expect(views[2]?.notes.map((note) => note.text)).toEqual(["b", "a"]);
  });

  it("starts today's session with the first note, then reuses it", () => {
    const stamp = { id: "n1", now: "2026-09-27T18:00:00.000Z" };
    const started = addNote(
      [],
      "  Aldric ment  ",
      { today: "2026-09-27", newSessionId: "s1" },
      stamp,
    );
    expect(started).toEqual([
      {
        id: "s1",
        date: "2026-09-27",
        createdAt: stamp.now,
        notes: [{ id: "n1", text: "Aldric ment", createdAt: stamp.now }],
      },
    ]);

    const again = addNote(
      started,
      "Mot de passe",
      { today: "2026-09-27", newSessionId: "unused" },
      { id: "n2", now: "2026-09-27T19:00:00.000Z" },
    );
    expect(again).toHaveLength(1);
    expect(todaySession(again, "2026-09-27")?.notes.map((note) => note.id)).toEqual(["n1", "n2"]);
  });

  it("ignores blank notes", () => {
    const journal = [session("s", "2026-09-27", "2026-09-27T08:00:00.000Z")];
    expect(addNote(journal, "   ", { sessionId: "s" }, { id: "n", now: "x" })).toEqual(journal);
    expect(
      addNote([], "", { today: "2026-09-27", newSessionId: "s" }, { id: "n", now: "x" }),
    ).toEqual([]);
  });

  it("adds a note to a past session", () => {
    const journal = [session("old", "2026-08-16", "2026-08-16T08:00:00.000Z", ["a"])];
    const next = addNote(
      journal,
      "b",
      { sessionId: "old" },
      { id: "n", now: "2026-09-30T08:00:00.000Z" },
    );
    expect(next[0]?.notes.map((note) => note.text)).toEqual(["a", "b"]);
  });

  it("creates, edits and deletes a session", () => {
    const created = createSession(
      [],
      { date: "2026-09-20", title: "  " },
      { id: "s", now: "2026-09-30T08:00:00.000Z" },
    );
    expect(created[0]).not.toHaveProperty("title");

    const titled = updateSession(created, "s", { date: "2026-09-21", title: " Le convoi " });
    expect(titled[0]).toMatchObject({ date: "2026-09-21", title: "Le convoi" });
    expect(updateSession(titled, "s", { date: "2026-09-21", title: "" })[0]).not.toHaveProperty(
      "title",
    );
    expect(deleteSession(titled, "s")).toEqual([]);
  });

  it("edits and deletes a note", () => {
    const journal = [session("s", "2026-09-27", "2026-09-27T08:00:00.000Z", ["a", "b"])];
    expect(updateNote(journal, "s-0", " A ")[0]?.notes[0]?.text).toBe("A");
    expect(updateNote(journal, "s-0", " ")).toEqual(journal);
    expect(deleteNote(journal, "s-0")[0]?.notes.map((note) => note.id)).toEqual(["s-1"]);
  });

  it("predicts the number of a new session from its date", () => {
    const journal = [
      session("a", "2026-08-16", "2026-08-16T08:00:00.000Z"),
      session("b", "2026-09-27", "2026-09-27T08:00:00.000Z"),
    ];
    expect(nextSessionNumber(journal, "2026-09-01")).toBe(2);
    expect(nextSessionNumber(journal, "2026-10-11")).toBe(3);
  });
});
