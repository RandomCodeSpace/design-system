import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../../src/components/buttons";

describe("Button", () => {
  it("renders children as the accessible name", () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>X</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("sets aria-disabled when disabled", () => {
    render(<Button disabled>X</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });

  it("sets aria-busy when loading", () => {
    render(<Button loading>X</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("does not fire onClick when loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick} loading>X</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders without an onClick handler (no throw)", () => {
    expect(() => render(<Button>X</Button>)).not.toThrow();
  });

  it("merges a custom className with internal classes", () => {
    render(<Button className="custom-x">X</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom-x");
    expect(btn.className).toMatch(/rcs-button/);
  });

  it("forwards declared HTML attributes (id, type)", () => {
    render(<Button id="my-btn" type="submit">X</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("id", "my-btn");
    expect(btn).toHaveAttribute("type", "submit");
  });

  it("renders a spinner element when loading", () => {
    const { container } = render(<Button loading>X</Button>);
    expect(container.querySelector(".rcs-button-spinner")).not.toBeNull();
  });

  it("does not render a spinner when not loading", () => {
    const { container } = render(<Button>X</Button>);
    expect(container.querySelector(".rcs-button-spinner")).toBeNull();
  });

  it("supports rapid successive clicks (each fires onClick)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>X</Button>);
    const btn = screen.getByRole("button");
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("can be focused with the keyboard and activated with Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>X</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
