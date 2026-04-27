import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "../../src/components/form-controls";

describe("Checkbox", () => {
  it("renders with a label as accessible name", () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeInTheDocument();
  });

  it("starts unchecked by default", () => {
    render(<Checkbox label="x" />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("respects defaultChecked for uncontrolled use", () => {
    render(<Checkbox label="x" defaultChecked />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("toggles state when clicked (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="x" />);
    const cb = screen.getByRole("checkbox");
    expect(cb).not.toBeChecked();
    await user.click(cb);
    expect(cb).toBeChecked();
    await user.click(cb);
    expect(cb).not.toBeChecked();
  });

  it("calls onChange with the new checked value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="x" onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("respects controlled `checked` and ignores user clicks without onChange", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="x" checked={true} />);
    const cb = screen.getByRole("checkbox");
    expect(cb).toBeChecked();
    await user.click(cb);
    // controlled without onChange → React holds the value
    expect(cb).toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="x" disabled onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders an indeterminate state on the underlying input", () => {
    render(<Checkbox label="x" indeterminate />);
    const cb = screen.getByRole("checkbox") as HTMLInputElement;
    expect(cb.indeterminate).toBe(true);
  });

  it("renders description text alongside the label", () => {
    render(<Checkbox label="Notify" description="We'll email you" />);
    expect(screen.getByText("We'll email you")).toBeInTheDocument();
  });
});
