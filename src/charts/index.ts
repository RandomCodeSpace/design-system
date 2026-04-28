/**
 * Charts module entry — opt-in subpath import.
 *
 *   import { Chart, Donut, Treemap, ServiceMap } from "@ossrandom/design-system/charts";
 *
 * Charts pull in heavier peer deps (uplot, d3-hierarchy, cytoscape) which
 * are loaded lazily; only the components you actually render trigger their
 * dynamic imports. Install the ones you use:
 *
 *   pnpm add uplot                      # Chart, Sparkline (optional, falls back to SVG)
 *   pnpm add d3-hierarchy               # Treemap
 *   pnpm add cytoscape cytoscape-cose-bilkent   # ServiceMap
 */
export { Chart } from "./Chart";
export { Sparkline } from "./Sparkline";
export { Donut, RadialGauge } from "./Donut";
export { UptimeBar } from "./UptimeBar";
export { Treemap } from "./Treemap";
export { ServiceMap } from "./ServiceMap";

export { readChartTheme, onThemeChange } from "./theme";
export type { ChartTheme } from "./theme";

// Re-export public types for convenience
export type {
  ChartProps, ChartSeries, ChartType, ChartPoint,
  SparklineProps,
  DonutProps, DonutSegment,
  RadialGaugeProps,
  UptimeBarProps, UptimeCell, UptimeStatus,
  TreemapProps, TreemapNode,
  ServiceMapProps, ServiceNode, ServiceEdge,
} from "../components";
