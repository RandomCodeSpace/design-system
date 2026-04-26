/**
 * ThemeProvider + useTheme
 * ────────────────────────
 * Stamps `data-theme="light|dark"` on `<html>` so the CSS variables in
 * `colors_and_type.css` swap. Optionally accepts an accent override and
 * font-family overrides exposed as inline CSS variables.
 */
import * as React from "react";
import type { ThemeProviderProps, UseTheme } from "../components";
import type { ThemeMode, BrandColor } from "../tokens";

const ThemeContext = React.createContext<UseTheme | null>(null);

const BRAND_HEX: Record<BrandColor, string> = {
  "signal-red": "#E60000",
  "signal-red-700": "#9E0000",
  "signal-red-900": "#520000",
  "cod-gray": "#1C1C1C",
  "cod-gray-700": "#2B2B2B",
  "cod-gray-500": "#5A5A5A",
  "cod-gray-300": "#A6A6A6",
  "cod-gray-100": "#F5F5F5",
  "cod-gray-050": "#FAFAFA",
  "white": "#FFFFFF",
};

export function ThemeProvider(props: ThemeProviderProps): React.ReactElement {
  const { mode: controlledMode, accent, fontFamily, children } = props;
  const [internal, setInternal] = React.useState<ThemeMode>(controlledMode ?? "light");
  const mode = controlledMode ?? internal;

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  React.useEffect(() => {
    if (typeof document === "undefined" || !accent) return;
    document.documentElement.style.setProperty("--accent", BRAND_HEX[accent]);
  }, [accent]);

  React.useEffect(() => {
    if (typeof document === "undefined" || !fontFamily) return;
    if (fontFamily.sans) document.documentElement.style.setProperty("--font-sans", fontFamily.sans);
    if (fontFamily.mono) document.documentElement.style.setProperty("--font-mono", fontFamily.mono);
  }, [fontFamily]);

  const ctx: UseTheme = React.useMemo(() => ({
    mode,
    setMode: (m: ThemeMode) => setInternal(m),
    toggle: () => setInternal((m) => (m === "light" ? "dark" : "light")),
  }), [mode]);

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
}

export function useTheme(): UseTheme {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    // Fallback when used outside provider — read system preference, no-op setters
    const sysMode: ThemeMode = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return { mode: sysMode, setMode: () => { /* no provider */ }, toggle: () => { /* no provider */ } };
  }
  return ctx;
}
