/**
 * Bundle entry for the charts subpath live previews.
 *
 * Mirrors scripts/bundle-entry.ts but bundles only the chart components
 * plus the chart-only peer deps (uplot, d3-hierarchy, cytoscape,
 * cytoscape-cose-bilkent). React and ReactDOM's createRoot are bundled
 * inline so chart demos can render without sharing the main bundle's
 * React instance — this avoids the "two React instances in one tree"
 * footgun, since chart demos never nest inside core components.
 *
 * Heavy GPU peer deps (@deck.gl/core, @deck.gl/layers, d3-force) are
 * marked `--external` at bundle time. Chart components already have a
 * canvas2d / SVG fallback path when the WebGL handoff fails to import,
 * so the docs site renders charts via the canvas paths and skips
 * deck.gl entirely. That keeps the chart bundle ~700 KB instead of
 * pulling in another ~1.5 MB of WebGL machinery.
 *
 * Built by esbuild as IIFE → `window.RCSCharts = { Chart, Donut, …,
 * React, createRoot }`. Loaded only by chart docs pages, never by the
 * main docs site or playground.
 *
 * Used by:
 *   - scripts/build-site.mjs                    (bundle pass)
 *   - scripts/build-docs.mjs renderComponentPage (chart pages)
 */

import * as React from "react";
import { createRoot } from "react-dom/client";

export * from "../src/charts";
export { React, createRoot };
