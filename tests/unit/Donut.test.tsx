import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Donut } from "../../src/charts/Donut";

describe("Donut", () => {
  const segments = [
    { label: "Compute", value: 45 },
    { label: "Database", value: 25 },
    { label: "Cache", value: 18 },
    { label: "Other", value: 12 },
  ];

  it("renders one path per segment", () => {
    const { container } = render(<Donut segments={segments} />);
    expect(container.querySelectorAll("path").length).toBe(segments.length);
  });

  it("renders a center label and value when provided", () => {
    const { getByText } = render(
      <Donut segments={segments} centerLabel="cores" centerValue="847" />,
    );
    expect(getByText("cores")).toBeTruthy();
    expect(getByText("847")).toBeTruthy();
  });

  it("invokes onSegmentClick with the original segment + index", () => {
    let clicked: { label: string; index: number } | null = null;
    const { container } = render(
      <Donut
        segments={segments}
        onSegmentClick={(seg, i) => { clicked = { label: seg.label, index: i }; }}
      />,
    );
    const paths = container.querySelectorAll("path");
    fireEvent.click(paths[1]!);
    expect(clicked).toEqual({ label: "Database", index: 1 });
  });

  it("renders a legend when showLegend is set", () => {
    const { getByText } = render(<Donut segments={segments} showLegend />);
    for (const s of segments) expect(getByText(s.label)).toBeTruthy();
  });

  it("collapses gracefully on empty segments", () => {
    const { container } = render(<Donut segments={[]} />);
    expect(container.querySelectorAll("path").length).toBe(0);
  });
});
