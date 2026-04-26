# @ossrandom/design-system

> RandomCodeSpace Design System — strongly-typed React component library.

Signal Red on Cod Gray. Inter for UI, JetBrains Mono for code. Built for self-hosted developer tooling.

[![CI](https://github.com/RandomCodeSpace/design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/RandomCodeSpace/design-system/actions/workflows/ci.yml)
[![Release](https://github.com/RandomCodeSpace/design-system/actions/workflows/release.yml/badge.svg)](https://github.com/RandomCodeSpace/design-system/actions/workflows/release.yml)

## Install

From npm (default):

```bash
npm install @ossrandom/design-system
# or
pnpm add @ossrandom/design-system
```

From the GitHub Packages mirror (same package, same scope, alternate registry):

```bash
npm install @ossrandom/design-system --registry=https://npm.pkg.github.com
```

Both registries publish the same name (`@ossrandom/design-system`); the mirror is published from the release workflow using the auto-provided `GITHUB_TOKEN`.

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

- **49 working React components** — Buttons, Inputs, Form controls, Layout primitives, Navigation, Feedback, Data display, Chat, Code/Markdown/Terminal/RTE, plus `ThemeProvider` + imperative `toast`
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
  components.d.ts        prop interfaces (types-only)
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

## Local development

```bash
pnpm install
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint src/**/*.{ts,tsx}
pnpm test            # vitest
pnpm build           # emits dist/ with .d.ts + .js + styles.css
pnpm preview         # open preview/responsive-check.html
```

The build script runs `tsc -p tsconfig.build.json` then concatenates `colors_and_type.css` + `src/styles.css` into `dist/styles.css`. The result is a publish-ready `dist/` folder containing `.js`, `.d.ts`, source maps, declaration maps, and the merged stylesheet. CI runs typecheck → lint → test → build on every push and PR.

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
