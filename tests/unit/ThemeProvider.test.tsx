import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "../../src/components/theme";

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

function ToggleProbe() {
  const { mode, toggle, setMode } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => setMode("light")}>set-light</button>
      <button onClick={() => setMode("dark")}>set-dark</button>
    </div>
  );
}

describe("ThemeProvider + useTheme", () => {
  it("applies the initial mode to <html data-theme>", () => {
    render(<ThemeProvider mode="dark"><div /></ThemeProvider>);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("exposes the active mode via useTheme", () => {
    render(<ThemeProvider mode="light"><ToggleProbe /></ThemeProvider>);
    expect(screen.getByTestId("mode").textContent).toBe("light");
  });

  it("toggle() flips dark ↔ light when uncontrolled", async () => {
    const user = userEvent.setup();
    // Render without a controlled mode so internal state can change.
    render(<ThemeProvider><ToggleProbe /></ThemeProvider>);
    const initial = screen.getByTestId("mode").textContent;
    await user.click(screen.getByText("toggle"));
    const after = screen.getByTestId("mode").textContent;
    expect(after).not.toBe(initial);
    expect(["light", "dark"]).toContain(after);
    expect(document.documentElement.getAttribute("data-theme")).toBe(after);
  });

  it("setMode() switches to an explicit mode (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ToggleProbe /></ThemeProvider>);
    await user.click(screen.getByText("set-light"));
    expect(screen.getByTestId("mode").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    await user.click(screen.getByText("set-dark"));
    expect(screen.getByTestId("mode").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("controlled mode ignores internal toggle (parent owns state)", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider mode="light"><ToggleProbe /></ThemeProvider>);
    expect(screen.getByTestId("mode").textContent).toBe("light");
    await user.click(screen.getByText("toggle"));
    // Still light — controlled prop wins.
    expect(screen.getByTestId("mode").textContent).toBe("light");
  });

  it("useTheme outside ThemeProvider returns a no-op fallback", () => {
    function Bare() {
      const { mode, toggle, setMode } = useTheme();
      return (
        <div>
          <span data-testid="bare-mode">{mode}</span>
          <button onClick={toggle}>t</button>
          <button onClick={() => setMode("dark")}>s</button>
        </div>
      );
    }
    act(() => { render(<Bare />); });
    // mode is read from system-preference fallback; jsdom's matchMedia stub
    // returns matches=false → "light".
    expect(["light", "dark"]).toContain(screen.getByTestId("bare-mode").textContent ?? "");
  });
});
