import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, NumberInput } from "../../src/components/inputs";

describe("Input", () => {
  it("renders a textbox with the given placeholder", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("accepts user keystrokes (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="x" />);
    const input = screen.getByPlaceholderText("x") as HTMLInputElement;
    await user.type(input, "hello");
    expect(input.value).toBe("hello");
  });

  it("calls onChange with the new value on each keystroke", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="x" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("x"), "hi");
    expect(onChange).toHaveBeenCalledTimes(2);
    // Implementation passes (value, event) — assert on the value arg only.
    expect(onChange.mock.calls[onChange.mock.calls.length - 1][0]).toBe("hi");
  });

  it("respects controlled `value`", () => {
    render(<Input placeholder="x" value="locked" onChange={() => {}} />);
    expect((screen.getByPlaceholderText("x") as HTMLInputElement).value).toBe("locked");
  });

  it("does not accept input when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="x" disabled onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("x"), "x");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("NumberInput", () => {
  it("starts empty when no defaultValue", () => {
    const { container } = render(<NumberInput placeholder="qty" />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value === "" || input.value === "0").toBe(true);
  });

  it("calls onChange with a number when typed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<NumberInput placeholder="qty" onChange={onChange} />);
    const input = container.querySelector("input") as HTMLInputElement;
    await user.type(input, "42");
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(typeof last).toBe("number");
    expect(last).toBe(42);
  });
});
