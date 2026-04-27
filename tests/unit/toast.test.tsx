import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { toast, ToastRegion } from "../../src/components/feedback";

beforeEach(() => {
  // Wipe any toasts left over from a previous test.
  // The store is module-level — call dismiss on whatever id show returns.
});

describe("toast.show / ToastRegion", () => {
  it("show() returns a string id", () => {
    render(<ToastRegion />);
    let id: string;
    act(() => { id = toast.show({ title: "hi" }); });
    expect(typeof id!).toBe("string");
    expect(id!.length).toBeGreaterThan(0);
  });

  it("renders the toast title in the region", () => {
    render(<ToastRegion />);
    act(() => { toast.show({ title: "Saved" }); });
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("supports multiple concurrent toasts", () => {
    render(<ToastRegion />);
    act(() => {
      toast.show({ title: "First" });
      toast.show({ title: "Second" });
      toast.show({ title: "Third" });
    });
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("dismiss(id) removes the corresponding toast", () => {
    render(<ToastRegion />);
    let id: string;
    act(() => { id = toast.show({ title: "Will close" }); });
    expect(screen.getByText("Will close")).toBeInTheDocument();
    act(() => { toast.dismiss(id!); });
    expect(screen.queryByText("Will close")).not.toBeInTheDocument();
  });

  it("respects an explicit id passed in options", () => {
    render(<ToastRegion />);
    let id: string;
    act(() => { id = toast.show({ id: "custom-1", title: "Pinned" }); });
    expect(id!).toBe("custom-1");
    act(() => { toast.dismiss("custom-1"); });
    expect(screen.queryByText("Pinned")).not.toBeInTheDocument();
  });

  it("renders different severity classes", () => {
    const { container } = render(<ToastRegion />);
    act(() => {
      toast.show({ title: "Ok", severity: "success" });
      toast.show({ title: "No", severity: "danger" });
    });
    expect(container.querySelector('[class*="success"], [data-severity="success"]')).not.toBeNull();
    expect(container.querySelector('[class*="danger"], [data-severity="danger"]')).not.toBeNull();
  });

  it("toast.promise resolves with the underlying promise value", async () => {
    render(<ToastRegion />);
    const result = await act(async () => {
      return await toast.promise(
        Promise.resolve(42),
        { loading: "Working…", success: "Done", error: "Oops" },
      );
    });
    expect(result).toBe(42);
  });

  it("toast.promise rejects when the underlying promise rejects", async () => {
    render(<ToastRegion />);
    const onErr = vi.fn();
    await act(async () => {
      try {
        await toast.promise(
          Promise.reject(new Error("boom")),
          { loading: "…", success: "ok", error: "fail" },
        );
      } catch (e) {
        onErr(e);
      }
    });
    expect(onErr).toHaveBeenCalled();
  });
});
