# UI

> The project IS a UI library, so this file is the design system reference. Source of truth for tokens, theming, classes, and brand rules.

## Brand non-negotiables

Verbatim from `SKILL.md` `§Non-negotiables` — these override any preference the user might express casually.

- **Voice:** declarative, technical, no hype. Sentence case. **No emoji. No exclamation marks.**
- **Color:** monochrome — black / white / cool grays. Accent is the inverse of the surface (`#0B0B0F` on light, `#F5F5F7` on dark per SKILL.md, but the live token in `colors_and_type.css:174` uses Signal Red `#E60000` as the `--accent` for both themes — see "Accent reconciliation" below). No chroma except functional semantic colors.
- **Type:** Bricolage Grotesque (display headlines, opsz + ss01 + wdth axes), Plus Jakarta Sans (body / UI chrome), Geist Mono (code, micro labels). All three OFL-1.1, self-hosted variable woff2. Tight negative letterspacing on headings (`-0.035em` to `-0.008em`).
- **Borders:** 1px hairlines, 4px radius default. No thick borders, no decorative shadows.
- **Motion:** fast (140–220ms), `out-quart` (`cubic-bezier(0.25, 1, 0.5, 1)`) default. No bouncy nav, no stagger-for-the-sake-of-it. **Honor `prefers-reduced-motion`** when adding animations.
- **Icons:** Lucide, 1.5px stroke, `currentColor`. Icon + label always unless unambiguous.
- **Imagery:** avoided in-product. No stock photos, no illustrations, no generative art.

### Accent reconciliation

`SKILL.md` describes a "true monochrome accent" pattern (inverse of surface). The live tokens in `colors_and_type.css:174` (`--accent: #E60000`) and the README's "Signal Red on Cod Gray" tagline use Signal Red as the chromatic accent. Treat **Signal Red as the canonical accent** in code, and "monochrome inverse accent" as the brand voice for environments where chroma is not available (e.g., printable mocks, very minimal contexts). When in doubt, follow the actual CSS variable.

## Token system

All tokens are CSS custom properties declared in `colors_and_type.css`. Components reference them via `var(--*)` — never hard-coded values.

### Color (semantic, theme-aware)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg-0` | `#FFFFFF` | `#1C1C1C` | Page background |
| `--bg-1` | `#FFFFFF` | `#2B2B2B` | Card/panel |
| `--bg-2` | `#F5F5F5` | `#3D3D3D` | Raised, hover |
| `--bg-3` | `#E5E5E5` | `#4A4A4A` | Pressed, sunken |
| `--bg-inverse` | `#1C1C1C` | `#FFFFFF` | Buttons, chips |
| `--fg-1` | `#1C1C1C` | `#FFFFFF` | Primary text |
| `--fg-2` | `#3D3D3D` | `#CCCCCC` | Secondary |
| `--fg-3` | `#5A5A5A` | `#A6A6A6` | Tertiary, metadata |
| `--fg-4` | `#A6A6A6` | `#5A5A5A` | Disabled / hint |
| `--border-1/2/3` | rgba ladder | rgba ladder | Default → emphasized → focus |
| `--accent` | `#E60000` | `#E60000` | Signal Red (primary action, danger) |
| `--accent-soft` / `--accent-soft-2` | rgba(230,0,0,.08/.16) | rgba(230,0,0,.14/.24) | Hover wash, selection |
| `--success / --warning / --danger / --info` | semantic | semantic | Note: in light mode `--success: #1C1C1C` (mono); warning `#D98E2B`, danger `#E60000`, info `#2D73D9` |
| `--shadow-xs/sm/md/lg/focus` | soft, low-spread | deeper alpha | Elevation hierarchy |

### Brand palette (theme-invariant, prefer semantic tokens)

`--brand-red-{50..900}` and `--brand-gray-{50..900}` are declared on `:root` for swatch use. **Prefer the semantic tokens** above for component styling — using brand-* directly bypasses the theme system.

### Type scale

Declared on `:root` (`colors_and_type.css:60-74`). Modular, tight letterspacing.

| Token | Size | Line height | Letter spacing | Class |
|-------|------|-------------|----------------|-------|
| display | 64px | 1.02 | -0.035em | `.rcs-display`, `h1.display` |
| h1 | 44px | 1.06 | -0.028em | `h1`, `.rcs-h1` |
| h2 | 32px | 1.12 | -0.022em | `h2`, `.rcs-h2` |
| h3 | 22px | 1.25 | -0.014em | `h3`, `.rcs-h3` |
| h4 | 17px | 1.35 | -0.008em | `h4`, `.rcs-h4` |
| body | 15px | 1.55 | 0 | `p`, `.rcs-body` |
| small | 13px | 1.5 | 0 | `.rcs-small`, `small` |
| micro | 11px | 1.4 | 0.04em | `.rcs-micro`, `.rcs-label` (mono + uppercase — the dev-tool signature) |
| code | 13.5px | 1.55 | — | `code`, `kbd`, `samp`, `pre`, `.rcs-code` |

Font families: `--font-display: "Bricolage Grotesque", ...`, `--font-sans: "Plus Jakarta Sans", ...`, `--font-mono: "Geist Mono", ...`. Fonts are self-hosted via `@font-face` from `assets/fonts/*.woff2` — three variable woff2 files (Bricolage carries wght 200–800, opsz 12–96, wdth 75–100; Plus Jakarta carries wght 200–800; Geist Mono carries wght 100–900). No CDN, no `@import` from Google Fonts — air-gapped-safe by default. h1/h2/h3 use `--font-display` with `font-optical-sizing: auto` and `font-feature-settings: "ss01", "kern"` for the editorial alt-glyph set.

### Spacing (4px base)

`--space-{0,1,2,3,4,5,6,8,10,12,16,20,24}` mapping to `0/4/8/12/16/20/24/32/40/48/64/80/96` px. The `SpaceSize` token type (`src/tokens.ts:30`) is `"xs" | "sm" | "md" | "lg" | "xl" | number`.

### Radius

`--radius-{xs,sm,md,lg,xl,full}` = `2/4/6/8/12/9999` px. **Default is `--radius-sm` = 4px** (Linear-style). Token type `Radius` (`src/tokens.ts:32`) is `"none" | "sm" | "md" | "lg" | "pill" | "circle" | number`.

### Motion

| Token | Value |
|-------|-------|
| `--ease-out-quart` (default) | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--ease-spring` (use sparingly) | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--dur-instant / fast / base / slow` | `80ms / 140ms / 220ms / 380ms` |

The brand bar is **fast and crisp**: `--dur-fast` for hover/press transitions, `--dur-base` for layout/disclosure changes. `--dur-slow` is for full-page transitions only.

`prefers-reduced-motion` is **not** honored globally in `colors_and_type.css` today. When adding animations, wrap them in `@media (prefers-reduced-motion: no-preference)` or set durations to `0ms` under `(prefers-reduced-motion: reduce)`.

### Focus ring

```css
:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);   /* 0 0 0 3px rgba(230, 0, 0, 0.28|.45) */
  border-radius: var(--radius-sm);
}
```

This is project-wide (`colors_and_type.css:325-329`). Don't override per-component unless the element's natural border-radius requires a different ring.

## Theming usage

Mount once near the root:

```tsx
import { ThemeProvider, ToastRegion } from "@ossrandom/design-system";
import "@ossrandom/design-system/styles.css";

<ThemeProvider mode="light">      {/* or "dark"; omit `mode` for self-managed via useTheme().toggle() */}
  <App />
  <ToastRegion />
</ThemeProvider>
```

`ThemeProvider` writes `data-theme` and (optionally) `--accent` / `--font-sans` / `--font-mono` to `document.documentElement` (`src/components/theme.tsx:30-46`). It is **global, not scoped** — one provider per document. If `mode` is omitted entirely, `useTheme()` outside the provider falls back to `prefers-color-scheme` (`src/components/theme.tsx:60-64`).

## CSS class system (`.rcs-*`)

251 classes, BEM-ish:

- **Block:** `.rcs-button`, `.rcs-input`, `.rcs-card`, …
- **Modifier:** `.rcs-button--primary`, `.rcs-button--lg`, `.rcs-button--block`
- **Element:** `.rcs-button-spinner`, `.rcs-input-affix`, `.rcs-modal-backdrop`

Composition is via `cx()` from `src/internal/cx.ts`:

```tsx
const cls = cx(
  "rcs-button",
  `rcs-button--${variant}`,
  `rcs-button--${size}`,
  shape !== "rect" && `rcs-button--${shape}`,
  block && "rcs-button--block",
  className,
);
```

Sample real-world pattern from `src/components/buttons.tsx:30-37`. The trailing `className` slot lets consumers extend styling without overrides via `!important`.

## ui_kits — reference layouts

`ui_kits/<kit>/index.html` is loadable directly in a browser. Each kit shows how the brand renders in a different context:

| Kit | Files | What it demonstrates |
|-----|-------|----------------------|
| `marketing/` | Hero, Nav, FeatureGrid, CLIShowcase, Pricing, Footer | A landing page using only design tokens — dot-grid hero, eyebrow micro-labels, monochrome with red CTAs. |
| `app/` | Sidebar, Topbar, ServicesGrid, LogTail, CommandMenu | A self-hosted dashboard pattern (Linear/Supabase analog). |
| `docs/` | DocsSidebar, Article, TOC | Docs-site layout with sidebar + article + TOC. |

These are JSX, **not** TypeScript, **not** part of the published package, **not** type-checked. They consume tokens via `var(--*)` and the same `.rcs-*` classes. Use them as visual references, not as importable React components.

## preview/ — design-spec cards

39 single-purpose HTML files, one per concept (e.g., `components-buttons.html` shows button states with hex annotations). They use plain CSS, **not** `.rcs-*` classes — they're brand-spec exhibits, not React component demos. Loaded directly in a browser (no server). Shared base in `preview/_card.css`.

A11y / quality guarantees these provide:

- Color samples annotate hex codes
- State coverage (default / hover / press / focus / disabled) is explicit
- Typography cards show real ink-on-paper rendering at correct sizes

When changing token values, update the relevant preview card so the visual reference stays accurate.

## Accessibility baseline

Verified patterns in component code:

- **Focus ring:** site-wide `:focus-visible` (above) — never override to `outline: none` without a replacement.
- **Required `aria-label`** on `IconButton` (compile-time required via `src/components.ts:54`).
- **`role="dialog" aria-modal="true"`** on Modal (`src/components/feedback.tsx:54`).
- **`aria-busy` / `aria-disabled`** on Button when `loading`/`disabled` (`src/components/buttons.tsx:48-49`).
- **`role="alert"`** on Alert (`src/components/feedback.tsx:19`).
- **`role="group"`** on ButtonGroup (`src/components/buttons.tsx:79`).
- **Esc-to-close** on Modal via `useEsc` hook (`src/components/feedback.tsx:35-50`).

Targets per `~/.claude/rules/ui.md`: WCAG AA contrast (≥ 4.5:1), full keyboard navigation, honor `prefers-reduced-motion` and `prefers-color-scheme`. The token values are designed for AA compliance; verify any new color choice against `--bg-*` backgrounds before shipping.

## Banned patterns (apply to any UI built against this brand)

- Gradient backgrounds used as decoration
- Stock illustrations / AI generative art
- Drop-shadow-on-everything
- Arbitrary border-radius / spacing values not from tokens
- Bouncy / staggered micro-interactions
- Emoji as section icons
- Lorem ipsum in shipped output
- Anything that introduces chroma outside the semantic palette
