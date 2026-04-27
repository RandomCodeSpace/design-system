import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../../src/components/navigation";

const items = [
  { key: "overview", label: "Overview" },
  { key: "logs", label: "Logs" },
  { key: "settings", label: "Settings" },
] as const;

describe("Tabs", () => {
  it("renders every tab label", () => {
    render(<Tabs items={items} />);
    for (const item of items) {
      expect(screen.getByRole("tab", { name: item.label })).toBeInTheDocument();
    }
  });

  it("defaults to the first item when no defaultValue/value", () => {
    render(<Tabs items={items} />);
    const first = screen.getByRole("tab", { name: "Overview" });
    expect(first).toHaveAttribute("aria-selected", "true");
  });

  it("respects defaultValue", () => {
    render(<Tabs items={items} defaultValue="logs" />);
    expect(screen.getByRole("tab", { name: "Logs" })).toHaveAttribute("aria-selected", "true");
  });

  it("calls onChange with the selected key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs items={items} onChange={onChange} />);
    await user.click(screen.getByRole("tab", { name: "Logs" }));
    expect(onChange).toHaveBeenCalledWith("logs");
  });

  it("supports controlled value (clicks do not change selection without onChange)", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} value="settings" />);
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Logs" }));
    // No onChange wired → still on settings
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders with empty items array without crashing", () => {
    render(<Tabs items={[]} />);
    // No tabs to assert, but render must not throw.
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });
});
