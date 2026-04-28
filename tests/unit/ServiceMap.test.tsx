import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ServiceMap } from "../../src/charts/ServiceMap";
import type { ServiceNode, ServiceEdge } from "../../src/components";

const nodes: readonly ServiceNode[] = [
  { id: "api",   label: "API Gateway", status: "healthy" },
  { id: "auth",  label: "Auth",        status: "healthy" },
  { id: "users", label: "Users DB",    status: "degraded" },
];

const edges: readonly ServiceEdge[] = [
  { source: "api", target: "auth" },
  { source: "api", target: "users", status: "failing" },
];

describe("ServiceMap", () => {
  it("renders a wrapper without throwing for a small topology", () => {
    const { container } = render(<ServiceMap nodes={nodes} edges={edges} />);
    expect(container.firstElementChild).toBeTruthy();
  });

  it("does not throw with zero nodes and zero edges", () => {
    expect(() => render(<ServiceMap nodes={[]} edges={[]} />)).not.toThrow();
  });

  it("respects a fixed height prop", () => {
    const { container } = render(
      <ServiceMap nodes={nodes} edges={edges} height={420} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.height).toBe("420px");
  });
});
