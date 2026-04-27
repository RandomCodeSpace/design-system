# Changelog

All notable changes to `@ossrandom/design-system` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
