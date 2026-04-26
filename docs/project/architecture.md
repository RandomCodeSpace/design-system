# Architecture

> Companion to `PROJECT_SUMMARY.md`. Covers layering, types-vs-runtime separation, and the build pipeline.

## Layered model

```
                ┌─────────────────────────────────────────────────┐
 consumers ──▶  │  src/index.tsx                                  │   ESM entry; runtime + type re-exports
                └────────────────┬────────────────────────────────┘
                                 │ imports type, runtime
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
        ▼                                                 ▼
 ┌──────────────────────┐                    ┌────────────────────────────┐
 │  Types layer         │                    │  Runtime layer             │
 │                      │                    │                            │
 │  src/tokens.ts       │  ◀── (type-only) ──│  src/components/*.tsx      │
 │  src/components.d.ts │                    │  (13 files, ~2.5k LOC)     │
 │                      │                    │                            │
 │  Strict, hand-       │                    │  Each component uses:      │
 │  written, single     │                    │   • React 18 (peer)        │
 │  source of truth.    │                    │   • cx() from internal/    │
 │                      │                    │   • types from components/ │
 └──────────────────────┘                    └─────────────┬──────────────┘
                                                           │
                                                           ▼
                                              ┌────────────────────────┐
                                              │  Styles layer (CSS)    │
                                              │                        │
                                              │  colors_and_type.css   │  tokens (root, NOT in src/)
                                              │     +                  │
                                              │  src/styles.css        │  251 .rcs-* class rules
                                              │     ▼  build concat    │
                                              │  dist/styles.css       │
                                              └────────────────────────┘
```

### Strict types-vs-runtime split

- **Types are written by hand**, not generated. `src/components.d.ts` (648 lines) declares every `*Props` interface; `src/tokens.ts` (56 lines) declares the token unions. Both are imported with `import type { ... }`.
- **Each runtime component** (`src/components/<category>.tsx`) imports only its own props from `../components` — for example `src/components/buttons.tsx:6-8` imports `ButtonProps, IconButtonProps, ButtonGroupProps`.
- **`src/index.tsx` re-exports types and runtime separately**: `export type * from "./tokens"` and `export type * from "./components"` (`src/index.tsx:13-14`), then `export { Button, ... } from "./components/buttons"` etc. Consumers see one flat surface.

### Why a single `components.d.ts` instead of co-located prop interfaces

This is intentional. The pattern lets:

- A new component author write the prop interface first, then implement against a stable type contract.
- A reviewer scan the entire public API surface in one file (`docs/project/conventions.md` calls this out as a "don't refactor").
- TypeScript's `--isolatedModules` and pure type-only imports stay clean.

Splitting prop types into per-component files is a refactor that touches every `src/components/*.tsx` import line. Don't do it without explicit approval.

## Component implementation pattern

Verified from `src/components/buttons.tsx`, `src/components/feedback.tsx`, `src/components/theme.tsx`:

- **`React.forwardRef` for native-element components** that expose a ref (Button, Input, Textarea, etc.) — see `src/components/buttons.tsx:11`.
- **Plain function components for compound or layout primitives** (ButtonGroup, Card, Grid).
- **Hook-style composition** for cross-cutting behavior — `useEsc(active, handler)` in `src/components/feedback.tsx:35-42` is the local pattern. Do not pull in a hooks library.
- **className composition is always via `cx()`** from `src/internal/cx.ts` — string-concat falsy-pruning. `clsx`/`classnames` are intentionally absent.
- **A11y attributes are first-class.** `aria-label` is a required prop on `IconButton` (`src/components.d.ts:54`); `Button` sets `aria-busy`/`aria-disabled` based on `loading`/`disabled` (`src/components/buttons.tsx:48-49`); `Modal` uses `role="dialog" aria-modal="true"` (`src/components/feedback.tsx:54`).
- **No CSS-in-JS, no `style={...}` for design.** All visuals come from `.rcs-*` classes in `src/styles.css`. Inline `style` is only used for consumer-overridable shape (e.g., grid template columns, dimensional props passed in).

## Theme system

`src/components/theme.tsx`:

- `ThemeProvider` (controlled OR self-managed `mode`) sets `document.documentElement.dataset.theme` to `"light" | "dark"`. The CSS variable swap happens entirely in `colors_and_type.css` via `[data-theme="dark"]` selectors.
- Optional `accent` prop maps a `BrandColor` token to a hex via the `BRAND_HEX` lookup (`src/components/theme.tsx:13-23`) and writes it as an inline CSS variable on `<html>`. **This means `ThemeProvider` is global, not scoped** — multiple providers fight.
- Optional `fontFamily.{sans,mono}` prop overrides `--font-sans` / `--font-mono` inline.
- `useTheme()` outside a provider falls back to `prefers-color-scheme` and returns no-op setters (`src/components/theme.tsx:60-64`). This is by design but easy to miss.

## Toast subsystem

`feedback.tsx` exports both a `toast` imperative API and a `<ToastRegion />` component. The pattern (per `README.md:106-118`) is:

1. Mount `<ToastRegion />` once near the root inside `ThemeProvider`.
2. Anywhere in the tree, call `toast.show({ title, ... })` — the call enqueues into an in-memory store; `ToastRegion` subscribes and renders.

Treat `toast` as an imperative escape hatch from React's tree. Don't add per-call configuration that requires a Provider — the public API (`ToastApi` / `ToastOptions` in `src/components.d.ts:403-415`) is the contract.

## CSS architecture

Two stylesheets, concatenated at build time:

| File | Role | Lines | Notes |
|------|------|-------|-------|
| `colors_and_type.css` (repo root) | Tokens — colors, type, spacing, radii, motion, fonts, themes | 330 | Has `:root`, `[data-theme="light"]`, `[data-theme="dark"]`, and `prefers-color-scheme: dark` fallback. Declares `@font-face` for self-hosted Inter + JetBrains Mono. |
| `src/styles.css` | Component styles, sectioned by category | 916 | 251 `.rcs-*` class rules. Sections: BUTTONS, INPUTS, FORM, CHECKBOX·RADIO·SWITCH, SLIDER, SELECT·COMBOBOX, FILE UPLOAD, BADGES, CARDS·SPACE·LAYOUT, TABS·MENU·BREADCRUMB·PAGINATION·STEPS, FEEDBACK, TOAST, TABLE, STAT·AVATAR·TIMELINE, CHAT, CODE·MARKDOWN·TERMINAL·RTE, PAGE HEADER·APP SHELL. |

The build script (`package.json:37`) concatenates them in that order into `dist/styles.css`. The token file comes first so component styles can reference `var(--*)`.

`tsconfig.build.json:9` explicitly excludes `src/styles.css` so tsc doesn't try to "compile" it.

## Build pipeline (`pnpm build`)

```
pnpm build
 ├── tsc -p tsconfig.build.json        # emits dist/*.js, *.d.ts, *.map, *.d.ts.map
 └── node -e "fs.writeFileSync('dist/styles.css', fs.readFileSync('colors_and_type.css','utf8') + '\n' + fs.readFileSync('src/styles.css','utf8'))"
```

`tsconfig.build.json` extends `tsconfig.json` and:

- Sets `noEmit: false`, `emitDeclarationOnly: false` (parent `tsconfig.json` is `noEmit`-implied for editor/typecheck).
- Excludes tests, `node_modules`, `dist`, `preview`, and `src/styles.css`.
- Both configs use `"moduleResolution": "Bundler"` and `"jsx": "react-jsx"` (no React import required in `.tsx`).

`prepublishOnly` runs `typecheck && build` before any `npm publish` (`package.json:41`).

## CI / Release pipeline

See `docs/project/build-and-run.md` for full step-by-step. Summary:

- **CI** (`.github/workflows/ci.yml`): runs on push and PR to `main`. Steps: install → typecheck → lint (continue-on-error) → test (continue-on-error) → build → upload `dist/` artifact (push only). Concurrency-gated per ref.
- **Release** (`.github/workflows/release.yml`): triggered by `v*.*.*` tag push or `workflow_dispatch`. Four jobs: `build` (verifies tag matches `package.json` version, uploads dist artifact) → `publish-npm` (with provenance, uses `NPM_TOKEN`, gated by `environment: npm`) + `publish-gpr` (rewrites `publishConfig.registry` to GitHub Packages, uses `GITHUB_TOKEN`) → `github-release` (creates GitHub Release with `.tgz` attached and auto-generated notes).

## What lives outside the published package

- **`preview/`** — 39 standalone HTML brand-spec cards (one concept per file: `brand-*.html`, `colors-*.html`, `components-*.html`, `spacing-*.html`, `type-*.html`, `responsive-check.html`, `typescript-types.html`). They use plain CSS, not `.rcs-*` classes. Excluded from the npm tarball via `.npmignore:5`.
- **`ui_kits/{marketing,app,docs}/`** — 14 `.jsx` files + per-kit `index.html` + per-kit `README.md`. Loose JSX, no TypeScript, not in `tsconfig.json`'s `include`. Loaded by opening `ui_kits/<kit>/index.html` directly.
- **`assets/`** — brand SVG/PNG marks + woff2 fonts. The fonts are referenced by `colors_and_type.css` `@font-face` `src: url("assets/fonts/*.woff2")` (`colors_and_type.css:14-55`).
- **`screenshots/`** — `marketing-after.png`, `marketing-check.png`. Visual checks, not shipped.

These directories are content for the **skill** side of the repo (per `SKILL.md`) — Claude can copy from them when prototyping. None are part of the published `dist/`.
