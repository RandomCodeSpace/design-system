import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../../src/components/feedback";

describe("Modal", () => {
  it("renders nothing visible when open is false", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Title">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("renders title and children when open", () => {
    render(
      <Modal open onClose={() => {}} title="My title">
        <p>Body content</p>
      </Modal>,
    );
    expect(screen.getByText("My title")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="x">
        <p>body</p>
      </Modal>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose on Escape when closeOnEsc is false", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} closeOnEsc={false} title="x">
        <p>body</p>
      </Modal>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders footer content when provided", () => {
    render(
      <Modal open onClose={() => {}} title="x" footer={<button>Confirm</button>}>
        <p>body</p>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });
});
