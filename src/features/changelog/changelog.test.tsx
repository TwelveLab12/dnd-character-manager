import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CHANGELOG, LATEST_CHANGELOG_ID } from "./changelog-entries";
import { ChangelogPage } from "./changelog-page";
import { resetChangelogVisitForTests } from "./use-changelog-seen";

const STORAGE_KEY = "dnd-character-manager:changelog-seen";

describe("CHANGELOG", () => {
  it("has unique ids, valid dates, newest first, and content in every entry", () => {
    expect(new Set(CHANGELOG.map((entry) => entry.id)).size).toBe(CHANGELOG.length);
    for (const entry of CHANGELOG) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.changes.length).toBeGreaterThan(0);
    }
    const dates = CHANGELOG.map((entry) => entry.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});

describe("ChangelogPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetChangelogVisitForTests();
  });

  it("marks the entries added since the last visit, then the latest as seen", () => {
    const previous = CHANGELOG[2]!;
    window.localStorage.setItem(STORAGE_KEY, previous.id);

    render(<ChangelogPage />);

    for (const entry of CHANGELOG.slice(0, 2)) {
      expect(within(screen.getByRole("article", { name: entry.title })).getByText("Nouveau"));
    }
    expect(
      within(screen.getByRole("article", { name: previous.title })).queryByText("Nouveau"),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(LATEST_CHANGELOG_ID);
  });

  it("marks nothing as new on a first visit", () => {
    render(<ChangelogPage />);
    expect(screen.queryByText("Nouveau")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(LATEST_CHANGELOG_ID);
  });

  it("shows what the player has to do", () => {
    render(<ChangelogPage />);
    const withAction = CHANGELOG.find((entry) => entry.action)!;
    expect(
      within(screen.getByRole("article", { name: withAction.title })).getByText(withAction.action!),
    ).toBeInTheDocument();
  });
});
