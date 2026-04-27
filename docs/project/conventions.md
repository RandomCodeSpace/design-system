# Conventions

> Rules for safely modifying this codebase. The "Don't refactor" section is the most important — please read it before any restructuring.

## Adding a new component

The exact recipe (verified against `src/index.tsx`, `src/components.ts`, `src/components/buttons.tsx`):

1. **Pick a category file** under `src/components/` — `buttons.tsx`, `inputs.tsx`, `feedback.tsx`, etc. If your component genuinely doesn't fit any category, create a new file (`src/components/<category>.tsx`). One category per file.
2. **Add the prop interface to `src/components.ts`**, in the matching section. Conventions for the interface:
   - Extend `BaseProps` (`{ id, className, style, "data-testid" }` from `src/components.ts:25-30`).
   - Mark every field `readonly`.
   - Strict event signatures — `(e: MouseEvent<HTMLButtonElement>) => void`, never `(e: any) => void` and never bare `Function`.
   - `readonly` on array props — `readonly TableColumn<T>[]`, etc.
   - Discriminated unions for variants when shape differs by mode (e.g., `status: "error" | "warning" | ...`).
   - Token unions from `src/tokens.ts` (`Size`, `SpaceSize`, `Radius`, `Direction`, …) — don't redefine local string literals.
3. **Implement in the category file:**
   - Use `import type { XProps, YProps } from "../components"` (note: imports from `"../components"` resolve to `components.ts`).
   - Use `import { cx } from "../internal/cx"` for className composition.
   - For ref-bearing native elements: `React.forwardRef<HTMLElement, XProps>(function X(props, ref) { ... })`.
   - For composite/layout components: plain `function X(props: XProps): React.ReactElement`.
4. **Add CSS rules to `src/styles.css`** in the matching section comment (e.g., `BUTTONS`, `INPUTS`, `FEEDBACK`). Use `.rcs-<block>` and `.rcs-<block>--<modifier>` naming. Reference token CSS variables — never hard-coded color/spacing values.
5. **Add a re-export line to `src/index.tsx`** under the matching `// ─── ... ───` section. Keep it grouped by category.
6. **Add a brand-spec preview card** under `preview/components-<thing>.html` if the component introduces new visual primitives. Annotate hex codes and show all states (default / hover / press / focus / disabled).

Counter-examples — patterns to **avoid**:

- Per-component subdirectory (`src/components/Button/index.tsx`) — flat files only.
- Co-located `*.module.css` or styled-components — all styling lives in `src/styles.css`.
- Importing types via `"./components.ts"` or relative paths with the file extension — let module resolution find it via `from "../components"`.
- Re-exporting a component from anywhere other than `src/index.tsx`.

## Type discipline

- **Generics over string-keyed objects.** `Select<V>`, `Combobox<V>`, `Tabs<K>`, `Menu<K>`, `RadioGroup<V>`, `Table<T>` — preserve when editing. Widening to `string` or `unknown` removes the compile-time guarantee from consumers.
- **`readonly` everywhere.** Props are `readonly`; arrays in props are `readonly T[]`. The intent is to communicate "this value will not be mutated" to consumers — not just internal docs.
- **`BaseProps` extension is mandatory.** `id`, `className`, `style`, and `data-testid` must remain consumer-controllable on every public component.
- **Strict event types.** `MouseEvent<HTMLButtonElement>`, `ChangeEvent<HTMLInputElement>`, `KeyboardEvent`, `FocusEvent`. Don't fall back to `React.SyntheticEvent` unless genuinely polymorphic.
- **Token unions from `src/tokens.ts`.** Do not introduce a local `type Size = "xs" | "sm" | ...` in a component file when one already exists in tokens.
- **Discriminated unions** for variants whose semantics differ — e.g., `status: "error"` may require additional props that `status: "default"` doesn't. See `InputStatus` (`src/components.ts:68`).

## CSS conventions

- **Class names: `.rcs-<block>` + `.rcs-<block>--<modifier>` + `.rcs-<block>-<element>`.** No global classes (`.button`, `.card`) — they would collide with consumer styles.
- **Reference tokens via `var(--*)`.** Never hard-code color, spacing, or radius values; the entire theme system breaks if you do.
- **No CSS-in-JS, no inline `style` for design.** Inline `style` is acceptable for consumer-overridable, dimensional, or computed values (e.g., `style={{ gridTemplateColumns: ... }}`). Visual design always lives in `src/styles.css`.
- **Default radius is 4px (`--radius-sm`).** Anything else needs a justification.
- **Borders are 1px hairlines** (`--border-1` rgba). Thicker borders are reserved for emphasis (`--border-2/3`).
- **Motion uses `--ease-out-quart` and `--dur-fast`/`--dur-base`** unless there's a specific reason otherwise. Bouncy / spring easings are off the menu.

## Things to avoid

These are easy mistakes that will get caught in review.

- **Adding runtime dependencies.** React/ReactDOM are peer-only (`package.json:44-46`). Anything else is a discussion.
- **Importing `clsx`/`classnames`/`tailwind-merge`.** Use `cx()` from `src/internal/cx.ts`.
- **Re-introducing a Google Fonts `@import` in `colors_and_type.css`.** Removed in favor of self-hosted variable woff2 (Bricolage Grotesque + Plus Jakarta Sans + Geist Mono, OFL-1.1). Any public-internet font fetch contradicts the offline-safe stance.
- **Splitting `src/components.ts` into per-component files.** See "Don't refactor" below.
- **Renaming `.rcs-*` classes.** They're a public-ish API — consumers may target them in their own stylesheets.
- **Adding chroma outside the existing palette.** Monochrome surfaces + Signal Red accent + functional semantic colors only.
- **Using `style={{ color: "..." }}`, hex values inline, or arbitrary spacing.** Always tokens.
- **Adding emoji, exclamation marks, or marketing tone in copy.** SKILL.md `§Non-negotiables`.

## Don't refactor

Patterns that look "wrong" but are deliberate. **Read the reasoning before "fixing".**

- **`src/components.ts` (single ~693-line file) is the entire public-API surface, not split into per-component types.** Reasons: (a) reviewers see the whole public-API surface in one file, (b) component authors write the type contract first then implement against it, (c) module resolution from `import type { XProps } from "../components"` only works because of this single file. Splitting it would require updating every component file's import line and breaks the intended workflow. The file is `.ts` (was `.d.ts` pre-0.2.0) so it lints/typechecks alongside the rest of the source — keep it runtime-export-free (interfaces + `type` aliases only).
- **`.rcs-*` class prefix.** Verbose, but namespacing is intentional — collisions with consumer CSS are a known cost of un-namespaced libraries.
- **No CSS-in-JS / no Tailwind.** Single bundled stylesheet is the design — avoids runtime style-injection, plays well with SSR, ships one CSS file. Don't migrate.
- **Build CSS concatenation is an inline Node script in `package.json:37`** instead of a separate `scripts/build-css.mjs`. It's two `readFileSync`s; the indirection costs more than it saves. Don't extract.
- **`src/styles.css` is inside `src/` but excluded from `tsconfig.build.json`** (`tsconfig.build.json:9`). Co-location with the components is intentional; the exclusion is the workaround.
- **`pnpm preview` just `echo`s a hint** instead of running a server. The HTML files are deliberately serverless — open them directly. Don't introduce vite/parcel/webpack.
- **`ui_kits/*.jsx` are loose JSX, not in `tsconfig.json`.** They are reference layouts, not part of the package. Don't promote them to TypeScript or wire them into the build.
- **Inline Node concat uses `require('fs')` even though `package.json:18` is `"type": "module"`.** `node -e` with `require` runs in CJS scope; works fine. Don't "fix" to `import`.
- **CI's `lint` and `test` steps have `continue-on-error: true`.** Tracked deferrals — comment in `.github/workflows/ci.yml:34-39` says "remove once eslint config lands" / "remove once tests land". Remove the flags as those land; don't drop the steps.
- **`src/components/page.tsx` is small (58 lines) and `theme.tsx` is small (65 lines).** They could be merged with another category file, but the per-category-file rule is more important for discoverability. Don't merge.

## Style of comments and code

- File-level docblock at the top of each component file — small, descriptive (see `src/components/buttons.tsx:1-4`).
- Section comments inside files use `// ─── Section ───` or `// ═══ SECTION ═══` Unicode rules.
- Inline comments are sparse — present only where intent isn't obvious from code (`src/components/theme.tsx:60` for the `useTheme` outside-provider behavior).
- Prefer named function components (`function Button(...)`) over arrow function consts when paired with `forwardRef` — it gives correct displayName.

## Naming

- Components: `PascalCase`.
- Files: `kebab-case.tsx` for category buckets (`form-controls.tsx`, `data-display.tsx`).
- Types: `PascalCase` interfaces (`ButtonProps`), `PascalCase` aliases (`ButtonVariant`).
- CSS: `kebab-case` (`.rcs-button-group--vertical`).
- CSS variables: `kebab-case` (`--bg-1`, `--font-sans`).
- Module-internal helpers: `camelCase` (`useEsc`, `cx`, `uid`).

## Commit / branch hygiene

- Conventional-commit-style subjects (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- Atomic commits — one logical change per commit.
- Feature branch by default; do not commit directly to `main` unless the change is trivial and explicitly authorized.
- The current `checkpoint: pre-yolo` commits on `main` are auto-checkpoints from a session; collapse or amend before pushing if appropriate.

## Release discipline

- Cut releases via `pnpm version <patch|minor|major>` only — it bumps `package.json` and creates the matching `vX.Y.Z` tag (`.github/RELEASING.md`).
- The release workflow refuses to publish if the tag doesn't match `package.json` version (`.github/workflows/release.yml:54-60`).
- Both `npm` and `GitHub Packages` publish from the same artifact and the same `@ossrandom` scope.
- See `docs/project/build-and-run.md` for the full pipeline.
