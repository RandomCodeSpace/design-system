/**
 * Chart theme adapter
 * ───────────────────
 * Reads design-token CSS variables from computed styles so chart colors
 * track light/dark mode automatically, and exposes a curated multi-series
 * palette derived from the brand.
 *
 * The mono base (var(--fg-1) / --fg-3) is the primary "ink" for axes
 * and gridlines; series get a small categorical palette tuned to read
 * well against both light and dark surfaces.
 */

export interface ChartTheme {
  readonly fg1: string;
  readonly fg2: string;
  readonly fg3: string;
  readonly fg4: string;
  readonly bg1: string;
  readonly bg2: string;
  readonly bg3: string;
  readonly border1: string;
  readonly border2: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  /** Categorical palette for multi-series charts. Index 0 is always the accent. */
  readonly series: readonly string[];
  /** Font stacks resolved from CSS vars. */
  readonly fontSans: string;
  readonly fontMono: string;
  readonly mode: "light" | "dark";
}

const FALLBACK: ChartTheme = {
  fg1: "#1C1C1C", fg2: "#3D3D3D", fg3: "#5A5A5A", fg4: "#A6A6A6",
  bg1: "#FFFFFF", bg2: "#FAFAFA", bg3: "#F5F5F5",
  border1: "#E5E5E5", border2: "#D4D4D4",
  accent: "#E60000", accentSoft: "rgba(230,0,0,0.08)",
  success: "#1F9E5C", warning: "#D98E2B", danger: "#E60000", info: "#2D73D9",
  series: ["#E60000", "#1C1C1C", "#5A5A5A", "#2D73D9", "#1F9E5C", "#D98E2B", "#9E0000", "#A6A6A6"],
  fontSans: "Inter, system-ui, sans-serif",
  fontMono: "'JetBrains Mono', monospace",
  mode: "light",
};

/** Read a CSS custom property from documentElement, with fallback. */
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Snapshot the current theme from CSS variables. Re-call on theme change. */
export function readChartTheme(): ChartTheme {
  if (typeof window === "undefined") return FALLBACK;

  const mode = (document.documentElement.getAttribute("data-theme") as "light" | "dark") ?? "light";
  const fg1 = cssVar("--fg-1", FALLBACK.fg1);
  const fg2 = cssVar("--fg-2", FALLBACK.fg2);
  const fg3 = cssVar("--fg-3", FALLBACK.fg3);
  const fg4 = cssVar("--fg-4", FALLBACK.fg4);
  const bg1 = cssVar("--bg-1", FALLBACK.bg1);
  const bg2 = cssVar("--bg-2", FALLBACK.bg2);
  const bg3 = cssVar("--bg-3", FALLBACK.bg3);
  const border1 = cssVar("--border-1", FALLBACK.border1);
  const border2 = cssVar("--border-2", FALLBACK.border2);
  const accent = cssVar("--accent", FALLBACK.accent);
  const accentSoft = cssVar("--accent-soft", FALLBACK.accentSoft);
  const success = cssVar("--success", FALLBACK.success);
  const warning = cssVar("--warning", FALLBACK.warning);
  const danger = cssVar("--danger", FALLBACK.danger);
  const info = cssVar("--info", FALLBACK.info);

  // Categorical series palette — accent first, then a mono+chromatic
  // sequence tuned for distinguishability with the brand.
  const series: readonly string[] = mode === "dark"
    ? [accent, "#F5F5F5", "#A6A6A6", "#5BA0F2", "#3FBE83", "#E5A65A", "#FF6464", "#7A7A7A"]
    : [accent, "#1C1C1C", "#5A5A5A", "#2D73D9", "#1F9E5C", "#D98E2B", "#9E0000", "#A6A6A6"];

  return {
    fg1, fg2, fg3, fg4, bg1, bg2, bg3, border1, border2,
    accent, accentSoft, success, warning, danger, info,
    series,
    fontSans: cssVar("--font-sans", FALLBACK.fontSans),
    fontMono: cssVar("--font-mono", FALLBACK.fontMono),
    mode,
  };
}

/**
 * Subscribe to theme changes (data-theme attr swaps). Returns an unsubscribe.
 * Use inside a useEffect to refresh charts when the user toggles dark mode.
 */
export function onThemeChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => { /* no-op */ };
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
