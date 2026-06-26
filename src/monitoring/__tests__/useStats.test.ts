import { describe, it, expect } from "vitest";
import { appendCapped, HISTORY_CAP, type History } from "@/monitoring/hooks/useStats";

describe("useStats rolling buffer (appendCapped)", () => {
  it("appends a new value to an empty buffer", () => {
    const next = appendCapped(new Map(), "compliance-backend", 12.5, HISTORY_CAP);
    expect(next.get("compliance-backend")).toEqual([12.5]);
  });

  it("appends per poll, preserving order (oldest → newest)", () => {
    let h: History = new Map();
    for (const v of [1, 2, 3]) h = appendCapped(h, "c", v, HISTORY_CAP);
    expect(h.get("c")).toEqual([1, 2, 3]);
  });

  it("caps length at `cap`, dropping the oldest values", () => {
    let h: History = new Map();
    const cap = 5;
    for (let i = 0; i < 12; i++) h = appendCapped(h, "c", i, cap);
    const arr = h.get("c")!;
    expect(arr).toHaveLength(cap);
    // Most-recent `cap` values are 7..11.
    expect(arr).toEqual([7, 8, 9, 10, 11]);
  });

  it("never exceeds HISTORY_CAP under sustained polling", () => {
    let h: History = new Map();
    for (let i = 0; i < HISTORY_CAP * 3; i++) h = appendCapped(h, "c", i, HISTORY_CAP);
    const arr = h.get("c")!;
    expect(arr).toHaveLength(HISTORY_CAP);
    expect(arr[arr.length - 1]).toBe(HISTORY_CAP * 3 - 1);
  });

  it("tracks independent buffers per container key", () => {
    let h: History = new Map();
    h = appendCapped(h, "a", 1, HISTORY_CAP);
    h = appendCapped(h, "b", 99, HISTORY_CAP);
    h = appendCapped(h, "a", 2, HISTORY_CAP);
    expect(h.get("a")).toEqual([1, 2]);
    expect(h.get("b")).toEqual([99]);
  });

  it("returns a new Map (immutable update) without mutating the input", () => {
    const before: History = new Map([["c", [1]]]);
    const after = appendCapped(before, "c", 2, HISTORY_CAP);
    expect(after).not.toBe(before);
    expect(before.get("c")).toEqual([1]);
    expect(after.get("c")).toEqual([1, 2]);
  });
});
