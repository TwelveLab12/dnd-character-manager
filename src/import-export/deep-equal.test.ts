import { describe, expect, it } from "vitest";
import { deepEqual } from "./deep-equal";

describe("deepEqual", () => {
  it("treats identical objects with a different key order as equal", () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("detects a changed nested value", () => {
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  it("compares arrays by position", () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("distinguishes objects with different keys", () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("handles primitives and null", () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(1, "1")).toBe(false);
  });
});
