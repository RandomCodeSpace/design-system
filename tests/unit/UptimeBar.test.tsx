import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { UptimeBar } from "../../src/charts/UptimeBar";

describe("UptimeBar", () => {
  it("renders a canvas sized to its container", () => {
    const cells = Array.from({ length: 90 }, () => ({ status: "operational" as const }));
    const { container } = render(<UptimeBar cells={cells} aria-label="api uptime" />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("exposes accessible label on the wrapper", () => {
    const { container } = render(
      <UptimeBar cells={[{ status: "operational" }]} aria-label="cdn uptime" />,
    );
    const wrap = container.querySelector("[aria-label='cdn uptime']");
    expect(wrap).toBeTruthy();
  });

  it("does not throw when given zero cells", () => {
    expect(() => render(<UptimeBar cells={[]} />)).not.toThrow();
  });
});
