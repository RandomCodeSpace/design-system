/**
 * Sparkline — minimal smoke test.
 * Chart components live behind the optional "/charts" subpath and
 * depend on optional peer deps; Sparkline is dependency-free (pure
 * SVG) so it's the easiest one to exercise in jsdom. Heavier charts
 * are covered by playwright e2e against the live docs pages.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Sparkline } from "../../src/charts/Sparkline";

describe("Sparkline", () => {
  it("renders an SVG with a polyline for non-empty data", () => {
    const { container } = render(<Sparkline data={[1, 4, 2, 8, 5, 9, 3]} aria-label="trend" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-label")).toBe("trend");
    expect(container.querySelector("polyline")).toBeTruthy();
  });

  it("renders a flat empty placeholder for empty data", () => {
    const { container } = render(<Sparkline data={[]} />);
    const el = container.querySelector(".rcs-sparkline--empty");
    expect(el).toBeTruthy();
  });

  it("renders an area path when showArea is set", () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} showArea />);
    expect(container.querySelector("path")).toBeTruthy();
    expect(container.querySelector("polyline")).toBeTruthy();
  });

  it("is a single horizontal line when all values are equal", () => {
    // Range = 0 case must not produce NaN coordinates.
    const { container } = render(<Sparkline data={[5, 5, 5, 5, 5]} />);
    const polyline = container.querySelector("polyline");
    expect(polyline).toBeTruthy();
    const points = polyline?.getAttribute("points") ?? "";
    // No NaN, no Infinity in the points string.
    expect(points).not.toMatch(/NaN|Infinity/);
  });
});
