# @ossrandom/design-system

> RandomCodeSpace Design System — strongly-typed React component library.

Signal Red on Cod Gray. Bricolage Grotesque headlines (opsz + ss01), Plus Jakarta Sans body, Geist Mono code — all OFL-1.1, self-hosted variable woff2. Built for developer tooling.

**📖 [Live docs · live previews · playground](https://randomcodespace.github.io/design-system/)** — auto-generated component reference at `randomcodespace.github.io/design-system`.

**🤖 For AI agents** — point your tooling at [`llms.txt`](https://randomcodespace.github.io/design-system/llms.txt) (concise) or [`llms-full.txt`](https://randomcodespace.github.io/design-system/llms-full.txt) (every prop signature + canonical example). Both auto-regenerate on every push.

[![CI](https://github.com/RandomCodeSpace/design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/RandomCodeSpace/design-system/actions/workflows/ci.yml)
[![E2E](https://github.com/RandomCodeSpace/design-system/actions/workflows/e2e.yml/badge.svg)](https://github.com/RandomCodeSpace/design-system/actions/workflows/e2e.yml)
[![Release](https://github.com/RandomCodeSpace/design-system/actions/workflows/release.yml/badge.svg)](https://github.com/RandomCodeSpace/design-system/actions/workflows/release.yml)
[![Pages](https://github.com/RandomCodeSpace/design-system/actions/workflows/pages.yml/badge.svg)](https://randomcodespace.github.io/design-system/)

## Install

From npm (default):

```bash
npm install @ossrandom/design-system
# or
pnpm add @ossrandom/design-system
```

From the GitHub Packages mirror — **note the different scope**:

```bash
# .npmrc in the consuming project
@randomcodespace:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<PAT with read:packages>
```

```bash
npm install @randomcodespace/design-system
```

> **Why two scopes?** GitHub Packages requires the npm scope to match the
> repo owner (`RandomCodeSpace` → `@randomcodespace`), so the GHP mirror
> publishes as `@randomcodespace/design-system`. The canonical npm package
> stays `@ossrandom/design-system`. Same source, same version, same
> contents — only the package name differs. Imports inside your code
> match whichever one you installed (e.g. `from "@randomcodespace/design-system"`
> if you pulled from GHP).

## Usage

```tsx
import type { ButtonProps, TableColumn } from "@ossrandom/design-system";
import { Button, Table, ThemeProvider, toast } from "@ossrandom/design-system";
import "@ossrandom/design-system/styles.css";

interface Service { id: string; region: "us-east-1" | "eu-central-1"; cpu: number; }

const columns: readonly TableColumn<Service>[] = [
  { key: "id",     title: "ID",     dataKey: "id" },
  { key: "region", title: "Region", dataKey: "region" },
  { key: "cpu",    title: "CPU",    dataKey: "cpu", render: (cpu) => `${cpu}%` },
];

export function Dashboard({ services }: { services: readonly Service[] }) {
  return (
    <ThemeProvider mode="light">
      <Table<Service> columns={columns} data={services} rowKey="id" />
      <Button variant="primary" onClick={() => toast.show({ title: "Deploying…" })}>
        Deploy
      </Button>
    </ThemeProvider>
  );
}
```

## What's in the box

- **50+ React components** — Buttons, Inputs, Form controls, Layout primitives, Navigation, Feedback, Data display, Chat, Code/Markdown/Terminal/RTE, plus `ThemeProvider` + imperative `toast`
- **Charts** (opt-in subpath) — `Chart` (line/area/bar/scatter), `Sparkline`, `Donut`, `RadialGauge`, `UptimeBar`, `Treemap`, `ServiceMap` — see [Charts](#charts) below
- **Strongly-typed token unions** (`Size`, `SpaceSize`, `Radius`, `ThemeMode`, `BrandColor`, `Direction`, `Axis`, …)
- **Generic components**: `Select<V>`, `Combobox<V>`, `Tabs<K>`, `Menu<K>`, `RadioGroup<V>`, `Table<T>`
- **Strict TypeScript** — full type definitions emitted to `dist/`, source maps + declaration maps included
- **Single CSS file** at `dist/styles.css` (tokens + component styles concatenated; light + dark themes via `data-theme` on `<html>`)
- **Zero runtime deps** — only `react` + `react-dom` (peer)

## Project layout

```
src/
  index.tsx              public entry — re-exports everything (runtime + types)
  tokens.ts              design token unions
  components.ts          prop interfaces (types-only, hand-written)
  styles.css             component styles (concatenated into dist/styles.css)
  internal/cx.ts         className composer + uid helper
  components/
    buttons.tsx          Button, IconButton, ButtonGroup
    inputs.tsx           Input, NumberInput, PinInput, Textarea
    selects.tsx          Select, Combobox
    form-controls.tsx    Checkbox, RadioGroup, Switch, Slider, DatePicker,
                         DateRangePicker, FileUpload, FormField
    badges.tsx           Badge, StatusDot
    layout.tsx           Card, Space, ScrollDiv, Divider, Grid (+ Grid.Col)
    navigation.tsx       Tabs, Menu, Breadcrumb, Pagination, Steps
    feedback.tsx         Alert, Modal, Drawer, Progress, Skeleton, Spin,
                         Tooltip, toast, ToastRegion
    data-display.tsx     Table, Stat, Avatar, Timeline
    chat.tsx             Chat
    code.tsx             CodeBlock, Markdown, Terminal, RichTextEditor
    page.tsx             PageHeader, AppShell
    theme.tsx            ThemeProvider, useTheme
preview/                 39 design-gallery HTML cards
ui_kits/                 marketing / app / docs reference layouts (JSX)
assets/                  brand marks (light + dark variants)
colors_and_type.css      design tokens — CSS variables (--bg-0, --accent, …)
```

### Editing components

Each component file is self-contained: edit it, the public entry (`src/index.tsx`)
already re-exports it. Add a new component by creating a file under
`src/components/`, exporting it, and adding one re-export line to `src/index.tsx`.

The CSS shipped with each component uses `.rcs-*` class names defined in
`src/styles.css`. Tokens (colors, spacing, radii, shadows, motion) live in
`colors_and_type.css` at the project root and are theme-swappable via
`data-theme="light|dark"` on the document element.

### Mounting the toast region

`toast.show()` enqueues toasts onto an in-memory store. Render `<ToastRegion />`
once near the root of your app to display them — typically inside `ThemeProvider`:

```tsx
import { ThemeProvider, ToastRegion, toast } from "@ossrandom/design-system";

<ThemeProvider mode="light">
  <App />
  <ToastRegion />
</ThemeProvider>
```

## Charts

Charts ship behind an opt-in subpath because they pull heavier peer deps. The main entry stays zero-dep — you only pay for charts if you import them.

```tsx
import {
  Chart, Sparkline, Donut, RadialGauge,
  UptimeBar, Treemap, ServiceMap,
} from "@ossrandom/design-system/charts";
```

Install the peer deps for the charts you actually render:

| Component                 | Peer dep                                       | Fallback                            |
| ------------------------- | ---------------------------------------------- | ----------------------------------- |
| `Chart` (time-series)     | `uplot`                                        | SVG renderer (small datasets only)  |
| `Sparkline`               | —                                              | inline SVG, zero deps               |
| `Donut` / `RadialGauge`   | —                                              | inline SVG, zero deps               |
| `UptimeBar`               | —                                              | canvas2d, zero deps                 |
| `Treemap`                 | `d3-hierarchy`                                 | canvas2d squarify                   |
| `ServiceMap`              | `cytoscape` + `cytoscape-cose-bilkent`         | force-directed canvas               |

Charts auto-handoff to WebGL (`@deck.gl/core`, `@deck.gl/layers`) when the dataset crosses an engine threshold (`Chart` ≥100k points; `ServiceMap` ≥200 nodes). The `data-engine` attribute on the rendered root reflects the active backend (`svg` / `canvas` / `webgl`); set `--rcs-show-engine: 1` to surface a dev badge.

All chart components read tokens via `readChartTheme()` and re-render on `data-theme` swap — `Signal Red` accent, mono micro-labels, tabular numerics out of the box.

#### `ServiceMap` — interaction model

`ServiceMap` is a directed graph; semantics live in the data, not the visuals on top of it.

- **Direction.** Edges flow `source → target` with arrowheads at the target end. The deck.gl path uses `ArcLayer` (gradient source/target colors); the canvas path uses Cytoscape's bezier curve with a `triangle` arrow.
- **Node size = degree.** Each dot's radius is computed from `in + out` edge count using `√degree` scaling — 3 px (isolated) → 14 px (densest hub). Hubs surface visually without dwarfing leaves.
- **Status drives fill.** `healthy` / `degraded` / `failing` / `unknown` map to the `success` / `warning` / `danger` / `fg-3` tokens. Failing edges paint in `danger`.
- **Labels.** Node labels sit below each dot in a light weight (`font-weight: 400`, `color: --fg-3`) so they don't compete with edges. Edge labels (`label?: string` on `ServiceEdge`) are rendered but hidden by default — they reveal only when their edge is in the focus set.
- **Hover / touch focus.** Hovering or tapping a node dims the rest of the graph to ~18 % opacity and lights the focused node, its incident edges, its neighbors, and the edge labels for those incident edges. Hovering an edge lights the edge plus both endpoints. `pointerleave` clears the focus state.
- **Engine handoff.** Auto resolves to `webgpu` › `webgl` › `canvas` based on `nodes + edges` count vs. the threshold. The deck.gl path uses an internal adjacency map and `setProps({ layers })` to re-render highlight state without rebuilding the WebGL context.

```tsx
<ServiceMap
  nodes={[
    { id: "lb",  label: "load-balancer", status: "healthy" },
    { id: "au",  label: "auth-service",  status: "degraded" },
    { id: "bl",  label: "billing",       status: "failing" },
    /* … */
  ]}
  edges={[
    { source: "lb", target: "au", label: "http" },
    { source: "au", target: "bl", label: "grpc · 5xx", status: "failing" },
    /* … */
  ]}
  height={440}
  onNodeClick={(n) => console.log("node:", n.id)}
/>
```

```tsx
<Chart
  type="line"
  series={[{ id: "p99", label: "p99 latency", data: points }]}
  height={240}
/>

<Sparkline data={[12, 19, 14, 22, 28, 24, 31]} />

<Donut
  segments={[
    { label: "Compute",  value: 45 },
    { label: "Database", value: 25 },
    { label: "Cache",    value: 18 },
    { label: "Other",    value: 12 },
  ]}
  centerLabel="cores"
  centerValue="847"
  showLegend
/>
```

## Local development

```bash
pnpm install
pnpm typecheck            # tsc --noEmit
pnpm lint                 # eslint src/**/*.{ts,tsx}
pnpm test                 # vitest — 128 unit tests, jsdom + RTL
pnpm test:coverage        # vitest with v8 coverage
pnpm build                # emits dist/ with .d.ts + .js + styles.css
pnpm build:site           # builds the full Pages site → _site/
pnpm test:e2e:install     # one-time: download Playwright Chromium
pnpm test:e2e             # 28 e2e tests against the built _site (desktop + mobile)
```

The build script runs `tsc -p tsconfig.build.json` then concatenates `colors_and_type.css` + `src/styles.css` into `dist/styles.css`. The result is a publish-ready `dist/` folder containing `.js`, `.d.ts`, source maps, declaration maps, and the merged stylesheet.

**CI:** `ci.yml` runs typecheck → lint → test → build on every push/PR. `e2e.yml` runs the Playwright suite. `pages.yml` redeploys the docs site (and `llms.txt`) on every push to `main`.

## Releases

Releases go out automatically when you push a SemVer tag (`v0.1.0`, `v0.2.0-rc.1`, …) — see [`.github/workflows/release.yml`](.github/workflows/release.yml). The pipeline:

1. **Build & verify** — typecheck, build, then refuse to publish if the tag (`v$X.Y.Z`) doesn't match `package.json` version
2. **Publish · npm** — `npm publish --provenance --access public` to the public registry
3. **Publish · GitHub Packages** — same package, registry rewritten to `https://npm.pkg.github.com`, auth via `GITHUB_TOKEN`
4. **GitHub Release** — auto-generated notes, with the `.tgz` tarball attached

Both registries publish under the same scope (`@ossrandom/design-system`).

Cutting a release:

```bash
pnpm version minor   # bumps package.json + creates v0.2.0 tag
git push --follow-tags
```

See [`.github/SETUP.md`](.github/SETUP.md) for required secrets (`NPM_TOKEN` only — `GITHUB_TOKEN` is automatic).

## License

MIT — see [`LICENSE`](./LICENSE). Free to use, fork, modify, and ship.
