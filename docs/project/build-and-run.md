# Build & Run

> Build/test/release pipeline. The build is non-trivial because it composes a TypeScript emit with a CSS concatenation step and dual-publishes on release.

## Local environment

- `node >= 18.18` (`package.json:57`)
- `pnpm@9.12.0` (`package.json:58`) — corepack-resolvable

```bash
# from repo root
pnpm install                # uses pnpm-lock.yaml; CI uses --frozen-lockfile
```

## Scripts (`package.json:35-43`)

| Script | Command | Notes |
|--------|---------|-------|
| `typecheck` | `tsc --noEmit` | Uses `tsconfig.json` (strict, `rootDir: src/`). |
| `lint` | `eslint "src/**/*.{ts,tsx}"` | **Will fail today** — no eslint config file present. CI tolerates with `continue-on-error`. |
| `test` | `vitest run` | **No tests today** — exits successfully (no-op). Add tests under `src/` as `*.test.ts(x)`; `tsconfig.build.json` excludes them from emit. |
| `build` | `tsc -p tsconfig.build.json && node -e "..."` | Two-phase: TS emit, then CSS concat. See below. |
| `preview` | `echo 'Open preview/responsive-check.html in a browser'` | Not a server — load `preview/*.html` directly. |
| `prepublishOnly` | `pnpm run typecheck && pnpm run build` | Auto-runs before any `npm publish`. |
| `release` | `pnpm version` | Pass-through to npm version (use `pnpm version patch|minor|major`). |

## Build pipeline detail

```
pnpm build
  │
  ├── tsc -p tsconfig.build.json
  │      • input:  src/**/*.{ts,tsx}      (excludes src/styles.css and *.test.*)
  │      • output: dist/index.js
  │                dist/index.d.ts + .d.ts.map + .js.map
  │                dist/tokens.{js,d.ts,maps}
  │                dist/components.d.ts        (the hand-written types-only file, copied through)
  │                dist/components/<category>.{js,d.ts,maps}
  │                dist/internal/cx.{js,d.ts,maps}
  │
  └── node -e "
        require('fs').writeFileSync(
          'dist/styles.css',
          require('fs').readFileSync('colors_and_type.css','utf8') + '\n' +
          require('fs').readFileSync('src/styles.css','utf8')
        )
      "
        • input:  colors_and_type.css   (root-level token sheet)
        +         src/styles.css        (component sheet)
        • output: dist/styles.css       (single file consumers import)
```

`dist/styles.css` is the file consumers reach via the `./styles.css` subpath export (`package.json:31`). The order matters — tokens must come first so component rules can reference `var(--*)`.

`tsconfig.build.json` extends `tsconfig.json` and:

- Sets `noEmit: false`, `emitDeclarationOnly: false`.
- Excludes: `**/*.test.ts`, `**/*.test.tsx`, `node_modules`, `dist`, `preview`, **and `src/styles.css`** (so tsc doesn't try to compile a CSS file).
- Inherits parent's `outDir: dist`, `rootDir: src`, `moduleResolution: Bundler`, `jsx: react-jsx`, `declaration: true`, `declarationMap: true`, `sourceMap: true`.

## Package output (what consumers get)

`package.json:33` `files: ["dist", "src", "README.md"]` — the published tarball contains both compiled `dist/` and the source `src/` (so consumers can read source / debug). `.npmignore` excludes:

```
.github/, preview/, scrap/, *.test.*, *.spec.*, tsconfig.json, .eslintrc*, .prettierrc*, .editorconfig, node_modules/, coverage/, .cache/
```

`package.json:34` `sideEffects: ["**/*.css"]` keeps the styles from being tree-shaken when bundlers process the package.

Subpath exports (`package.json:22-32`):

| Subpath | Resolves to |
|---------|-------------|
| `@ossrandom/design-system` | `dist/index.js` (types: `dist/index.d.ts`) |
| `@ossrandom/design-system/tokens` | `dist/tokens.js` (types: `dist/tokens.d.ts`) |
| `@ossrandom/design-system/styles.css` | `dist/styles.css` |

## CI workflow (`.github/workflows/ci.yml`)

Triggered on push and PR to `main`. One job, sequential steps:

```
checkout
  → pnpm/action-setup@v4 (pnpm 9)
  → actions/setup-node@v4 (node 20, cache: pnpm)
  → pnpm install --frozen-lockfile
  → pnpm run typecheck       # MUST pass
  → pnpm run lint            # continue-on-error (no config yet)
  → pnpm run test            # continue-on-error (no tests yet)
  → pnpm run build           # MUST pass
  → upload dist/ artifact (push only, 7-day retention)
```

Concurrency-gated per ref so a new push cancels the previous run.

**The two `continue-on-error: true` flags are tracked deferrals** — drop them as eslint config and tests land. The workflow comment says so explicitly (`.github/workflows/ci.yml:35,39`).

## Release workflow (`.github/workflows/release.yml`)

Triggered by:

- Tag push matching `v*.*.*` (`v0.1.0`, `v0.2.0-rc.1`, `v1.0.0`, …)
- Manual `workflow_dispatch` with a `tag` input

### Pipeline (4 jobs)

```
       build (verify tag matches package.json, emit dist artifact)
            │
            ├──▶ publish-npm (gated by `environment: npm` — supports manual approval)
            │       ├── setup-node with registry-url=https://registry.npmjs.org, scope=@ossrandom
            │       └── npm publish --provenance --access public
            │            (NODE_AUTH_TOKEN = secrets.NPM_TOKEN)
            │
            └──▶ publish-gpr
                    ├── setup-node with registry-url=https://npm.pkg.github.com, scope=@ossrandom
                    ├── rewrite package.json → publishConfig.registry = https://npm.pkg.github.com
                    └── npm publish
                         (NODE_AUTH_TOKEN = secrets.GITHUB_TOKEN — automatic)
                            │
                            ▼
                       github-release (needs both publishes)
                            ├── npm pack from dist artifact → release-assets/*.tgz
                            └── softprops/action-gh-release@v2
                                  • generate_release_notes: true
                                  • files: release-assets/*.tgz
```

### Tag-version verification

`build` job step (`.github/workflows/release.yml:54-60`):

```bash
TAG="${GITHUB_REF_NAME#refs/tags/}"
PKG="v$(node -p "require('./package.json').version")"
if [ "$TAG" != "$PKG" ]; then
  echo "::error::Tag $TAG does not match package.json version $PKG"
  exit 1
fi
```

Pushing `v0.1.0` while `package.json:3` is `0.2.0` (or vice-versa) fails the build job and stops the entire pipeline. **Always** use `pnpm version` to bump — it sets both atomically.

### Permissions

`.github/workflows/release.yml:14-17`:

- `contents: write` — create the GitHub Release
- `packages: write` — publish to GitHub Packages
- `id-token: write` — npm provenance (sigstore signing)

### Required secrets

Per `.github/SETUP.md`:

- `NPM_TOKEN` — automation token from npmjs.com with publish rights to `@ossrandom`. Required.
- `GITHUB_TOKEN` — auto-provided by Actions. No setup needed.

Recommended: configure an `npm` environment (Settings → Environments) with a required reviewer so npm publishes need a manual approval click. The `publish-npm` job is already wired to it.

## Cutting a release

```bash
pnpm version 0.1.0          # first release; bumps package.json + creates v0.1.0 tag
git push --follow-tags

# subsequent
pnpm version patch          # 0.1.0 → 0.1.1
pnpm version minor          # 0.1.0 → 0.2.0
pnpm version major          # 0.1.0 → 1.0.0
git push --follow-tags
```

Watch **Actions → Release** for the four jobs. On success: package is on both registries, GitHub Release is published with `.tgz` attached and auto-generated notes.

### Rollback

Per `.github/SETUP.md`:

- `npm unpublish @ossrandom/design-system@<version>` (within npm's 72-hour window).
- For GitHub Packages: delete the version from the package's GitHub UI.
- Delete the GitHub Release and the tag (`git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z`).

Better path: **publish a higher version** (`pnpm version patch`) with the fix.

## Gotchas

- **Tag vs package.json mismatch.** The release workflow refuses the entire pipeline if they don't match — feature, not bug. Use `pnpm version`, not manual `git tag`.
- **`continue-on-error` on lint/test in CI.** Green CI does not mean lint or tests passed. Gate releases on a known-clean local run until those configs land.
- **`prepublishOnly` runs typecheck + build but not lint or test.** A manual `npm publish` (bypassing the workflow) is possible but skips lint/test. Use the workflow.
- **`publish-gpr` mutates `package.json` in-job** (`.github/workflows/release.yml:108-114`) by rewriting `publishConfig.registry`. The mutation is in-the-runner only — the source repo is unaffected. Don't try to commit this change.
- **`colors_and_type.css:12`'s Google Fonts `@import`** lands inside `dist/styles.css` after concatenation. For air-gapped consumers, delete that line in `colors_and_type.css` before publishing — once removed, browsers will rely entirely on the local `@font-face` rules and the bundled `assets/fonts/*.woff2`.
- **`.npmignore` excludes `*.test.*` and `*.spec.*`** — when tests land, they must live in `src/` and the `.npmignore` keeps them out of the tarball.
- **Inline node concat command uses `require('fs')`** even though the package is `"type": "module"` — `node -e` with `require` runs in CJS scope. Works as-is; don't refactor to `import` without wrapping.
- **`src/styles.css` is excluded from `tsconfig.build.json`** — if you remove that exclusion, tsc will error trying to "compile" CSS. Keep it excluded.
- **First-time GitHub setup** (per `.github/SETUP.md`): add `NPM_TOKEN`, configure the `npm` environment with a required reviewer, verify CI is green, then `pnpm version 0.1.0 && git push --follow-tags`.
