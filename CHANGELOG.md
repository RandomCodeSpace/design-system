# Changelog

All notable changes to `@ossrandom/design-system` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed — `ServiceMap`

- **Visual refresh.** Nodes are now small dots (was: `round-rectangle` 80 × 36 cards). Diameter is computed from each node's degree (in + out edge count) using `√degree` scaling — 6 px (isolated) → 28 px (densest hub) — so hubs surface visually without dwarfing leaves. Status now drives the **fill color** (`success` / `warning` / `danger`), not just a border accent.
- **Node labels moved below the dot** (was: centered, inside the card). Light weight, no background pill — pills covered edges. Z-order keeps dots above edges and labels beside them.
- **Edges now declare direction and labels.**
  - Cytoscape path: `target-arrow-shape: triangle`, `arrow-scale: 0.9`. `ServiceEdge.label` is rendered with `text-rotation: autorotate` but `text-opacity: 0` until the edge enters a focus set.
  - deck.gl path: already directional via `ArcLayer` (gradient `source → target`); no behavior change.
- **Hover / touch focus highlight.** Hovering or tapping a node dims everything else to ~18 % opacity and lights the focused node (accent border, weight 500), its incident edges (accent stroke, 2 px, edge label revealed), and its direct neighbors. Hovering an edge lights both endpoints. Touch start triggers the same focus on the canvas path. `pointerleave` and an empty-area click clear focus.
- **WebGL highlight is in-place.** The deck.gl path builds an adjacency map up front and re-renders highlight state via `inst.setProps({ layers })` with `updateTriggers` keyed on the focus id — no full context re-init per hover.

### Internal

- New `computeDegrees(nodes, edges)` and `degreeRadius(deg, max)` helpers in `src/charts/ServiceMap.tsx`. `PositionedNode` extended with a precomputed `degree` field threaded through both rendering paths.
- New Cytoscape stylesheet classes `.rcs-dim`, `.rcs-focus`, `.rcs-focus-edge`, `.rcs-neighbor` with 120 ms transitions on opacity, color, and border-width.
- Tiny `cssEscape()` polyfill for Cytoscape ID selectors when `CSS.escape` is unavailable.

## [0.3.0] — 2026-04-28

### Added

- **Charts module** at the new `@ossrandom/design-system/charts` subpath — opt-in to keep the main entry zero-dep:
  - **`Chart`** — line / area / bar / scatter time-series. Renders with `uplot` (canvas) when installed; falls back to inline SVG for small datasets. Auto-handoff to WebGL via `@deck.gl/core` + `@deck.gl/layers` once a series crosses ~100k points. Pan / zoom / crosshair / synced cursors across stacked panels; tabular tooltips with `Signal Red` accent.
  - **`Sparkline`** — zero-dep inline SVG. `data: number[]`, optional `showArea`. Designed to drop into `Stat` tiles (80×24 default). Handles flat (range = 0) inputs without NaN.
  - **`Donut`** + **`RadialGauge`** — zero-dep SVG. `Donut` takes typed `DonutSegment[]`, optional center label / value, optional legend, per-segment click handler. `RadialGauge` is a 270° arc with `tone: "good" | "warning" | "bad"`.
  - **`UptimeBar`** — 90-day status grid on canvas. `UptimeCell[]` with `status: "operational" | "degraded" | "outage" | "maintenance" | "no-data"`; cursor-tracking tooltip; quadtree picking.
  - **`Treemap`** — squarified treemap. Loads `d3-hierarchy` lazily; falls back to a built-in squarify pass when not installed. Canvas2d at any size, WebGL handoff on `>50k` leaves.
  - **`ServiceMap`** — directed graph for production topology. Loads `cytoscape` + `cytoscape-cose-bilkent` lazily; falls back to a small force-directed canvas. Status-keyed node strokes (`healthy` / `degraded` / `failing` / `unknown`), arrow markers on edges, drag-to-pan, scroll-to-zoom.

- **Optional peer deps** (`peerDependenciesMeta`): `uplot`, `d3-hierarchy`, `d3-force`, `cytoscape`, `cytoscape-cose-bilkent`, `@deck.gl/core`, `@deck.gl/layers`. The main entry imports none of them — install only what the charts you render require.

- **Chart theming**: `readChartTheme()` + `onThemeChange()` exported from `/charts` — hook a custom renderer to the same tokens (`--accent`, `--fg-1`, `--bg-2`, `--font-mono`, …) and re-render on `data-theme` swap.

- **Tokens**: `--elevation-tooltip` for chart tooltips; engine-badge surfaces `[data-engine]` attribute on chart roots — opt-in dev badge via `--rcs-show-engine: 1`.

### Notes

No breaking changes. Existing imports from `@ossrandom/design-system` continue to work unchanged. To use charts:

```tsx
import { Chart, Sparkline, Donut } from "@ossrandom/design-system/charts";
```

…and `pnpm add` the peer deps for the charts you render.

## [0.2.1] — 2026-04-27

### Fixed

- **Node ESM resolution.** `dist/*.js` and `dist/*.d.ts` now ship with explicit `.js` extensions on relative imports (e.g. `from "./components/buttons.js"`). Previously tsc emitted extensionless paths under `moduleResolution: "Bundler"`, which Node's strict ESM loader rejects with `Cannot find module …/components/buttons`. Build now post-processes emitted files via `scripts/build-assets.mjs`.

  This was a latent bug in `0.2.0` (and inherited by `0.1.x`) — only surfaced now because consumers previously linked the package via `link:`, which routed Vite/Vitest through source resolution. Pulling the published tarball under strict ESM caught it.

## [0.2.0] — 2026-04-27

A premium-typography release with new compact `PageHeader` variants, scrollable `Tabs`, broader a11y prop forwarding, and a richer token palette (elevation, focus, inset highlights). Drop-in for `0.1.x` consumers — no public API removals.

### Added

- **Typography overhaul.** Self-hosted variable-font stack:
  - **Bricolage Grotesque** (display) — variable woff2, axes `wght 200–800` + `opsz 12–96` + `wdth 75–100`. OFL-1.1.
  - **Plus Jakarta Sans** (body / UI chrome) — variable woff2, `wght 200–800`. OFL-1.1.
  - **Geist Mono** (code, micro labels) — variable woff2, `wght 100–900`. OFL-1.1.

  h1/h2/h3 use `--font-display` with `font-optical-sizing: auto` and `font-feature-settings: "ss01", "kern"` for the editorial alt-glyph set. New `--font-display` token alongside `--font-sans` / `--font-mono`. See `LICENSE-FONTS.txt` for the full OFL text.

- **`PageHeader`**:
  - `size: "xs"` — slim ~34px app-bar variant for detail screens with a back affordance.
  - `inlineSubtitle` — collapses subtitle inline with the title (`title · subtitle`) for app-bar / brand headers.
  - `backInline` — renders the back affordance as an icon-only chevron inside the title row instead of a "← Back" link above it (Linear / GitHub / Notion pattern).
  - Vertical padding exposed as `--rcs-page-header-py` / `--rcs-page-header-px` so tab strips and consumers derive offsets cleanly across sizes.

- **`Tabs`**: `scrollable` prop — horizontally scrollable nav with hidden scrollbar + gradient fade on the right edge.

- **`BaseProps`**: `aria-label`, `aria-labelledby`, `aria-describedby` (forwarded by `Input`, `Textarea`, `Button`, `IconButton`).

- **Tokens**:
  - Elevation: `--elevation-card`, `--elevation-popover`, `--elevation-modal`, `--elevation-toast`.
  - Inset highlights: `--inset-highlight`, `--inset-shade` for premium button dimension.
  - 2-stop focus ring: `0 0 0 2px var(--bg-0), 0 0 0 4px var(--accent)` for clearer surface separation.

- **Tests**: 11 vitest test files (~110 tests) covering core components.

### Changed

- **`src/components.d.ts` → `src/components.ts`**. Same content (types-only, hand-written) — now lints/typechecks alongside the rest of the source. Consumer imports unchanged (`import type { XProps } from "@ossrandom/design-system"`). `dist/components.d.ts` is still emitted by tsc.
- **Contrast.** `--fg-3` darkened from `#5A5A5A` → `#4F4F4F` (light theme) to clear WCAG AAA on body backgrounds.
- **`PageHeader --sm`** vertical padding tightened (`--space-3` → `--space-2`); inline back chevron at `sm` is 24px (was 28px).
- **iOS auto-zoom guard.** At `(max-width: 768px), (pointer: coarse)`, `.rcs-input-wrap` and `.rcs-textarea` font-size is pinned at 16px to suppress Safari's focus-zoom behaviour.
- **`prefers-reduced-motion`** is now honored globally — animations collapse to ≤1ms duration when the user opts out.
- **`Modal`** uses the refined `rcs-pop-in` enter animation; entrance respects `prefers-reduced-motion`.

### Removed

- `Inter-{Regular,Medium,SemiBold}.woff2` and `JetBrainsMono-{Regular,Medium,SemiBold}.woff2` — superseded by the three variable woff2 files above. Token name aliases (`--font-sans`, `--font-mono`) preserved; only the underlying font family changes.
- Google Fonts `@import` from `colors_and_type.css` — fully self-hosted, air-gapped-safe by default.

### Migration notes

- **Token names are stable.** `--font-sans` and `--font-mono` resolve to the new families automatically.
- If you target the old Inter or JetBrains Mono `font-family` strings directly in consumer CSS, update them to `"Plus Jakarta Sans"` / `"Geist Mono"` (or use `var(--font-sans)` / `var(--font-mono)`).
- If you wrote `import type { ... } from "../components"` against the source (rare), no change needed — module resolution still works against the renamed `components.ts`.

## [0.1.1] — 2026-04-26

Initial public release with ~50 components, design tokens, and a single bundled stylesheet.
