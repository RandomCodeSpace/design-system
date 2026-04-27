import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "../../src/components/form-controls";

describe("Switch", () => {
  it("renders with role=switch", () => {
    render(<Switch label="Wifi" />);
    expect(screen.getByRole("switch", { name: "Wifi" })).toBeInTheDocument();
  });

  it("toggles on click (uncontrolled)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="x" onChange={onChange} />);
    const sw = screen.getByRole("switch");
    await user.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("respects defaultChecked", () => {
    render(<Switch label="x" defaultChecked />);
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="x" disabled onChange={onChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("can be activated with the keyboard (Space)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="x" onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole("switch")).toHaveFocus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
