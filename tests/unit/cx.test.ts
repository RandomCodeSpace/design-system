import { describe, it, expect } from "vitest";
import { cx, uid, noop } from "../../src/internal/cx";

describe("cx", () => {
  it("joins truthy parts with a single space", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("returns empty string for no input", () => {
    expect(cx()).toBe("");
  });

  it("skips falsy values: false, null, undefined, empty string", () => {
    expect(cx("a", false, "b", null, "c", undefined, "d", "")).toBe("a b c d");
  });

  it("collapses interior gaps without leading/trailing space", () => {
    expect(cx(false, "a", null, "b", false)).toBe("a b");
  });

  it("preserves single-class output without surrounding whitespace", () => {
    expect(cx("only")).toBe("only");
  });

  it("returns empty string when all parts are falsy", () => {
    expect(cx(false, null, undefined, "")).toBe("");
  });

  it("treats empty-string class names as falsy (no double space)", () => {
    expect(cx("", "a", "", "b")).toBe("a b");
  });

  it("does not deduplicate — duplicates are preserved", () => {
    expect(cx("a", "a", "b")).toBe("a a b");
  });
});

describe("uid", () => {
  it("returns a string with the given prefix", () => {
    expect(uid("custom")).toMatch(/^custom-\d+$/);
  });

  it("defaults the prefix to 'rcs'", () => {
    expect(uid()).toMatch(/^rcs-\d+$/);
  });

  it("produces a different value on each call", () => {
    const a = uid();
    const b = uid();
    expect(a).not.toBe(b);
  });

  it("monotonically increments across calls", () => {
    const a = uid("x");
    const b = uid("x");
    const numA = parseInt(a.split("-")[1], 10);
    const numB = parseInt(b.split("-")[1], 10);
    expect(numB).toBe(numA + 1);
  });
});

describe("noop", () => {
  it("returns undefined and accepts no args without throwing", () => {
    expect(noop()).toBeUndefined();
  });
});
