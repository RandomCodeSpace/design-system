# Setup checklist

After cloning to the new repo, do this once.

## 1. Install pnpm + dependencies

```bash
corepack enable
pnpm install
```

## 2. Add publish secrets

In **Settings → Secrets and variables → Actions** add:

| Secret      | Where to get it                                                    |
| ----------- | ------------------------------------------------------------------ |
| `NPM_TOKEN` | npmjs.com → Access Tokens → Granular → "Publish for @ossrandom"   |

`GITHUB_TOKEN` is provided automatically by Actions — no setup needed for the GitHub Packages publish.

## 3. Configure environments (recommended)

**Settings → Environments → New environment → `npm`**
Add a required reviewer so npm publishes need a manual approval click. The release workflow's `publish-npm` job is already wired to this environment.

## 4. Verify CI is green

Push a small commit to `main`. The CI workflow (`ci.yml`) should run typecheck → lint → test → build.

## 5. Cut your first release

```bash
pnpm version 0.1.0     # bumps package.json + creates v0.1.0 tag
git push --follow-tags
```

Watch **Actions → Release** — the four-job pipeline should:

1. **Build & verify** — typecheck, build, refuse to continue if tag ≠ `package.json` version
2. **Publish · npm** — `npm publish --provenance --access public`
3. **Publish · GitHub Packages** — same package, registry rewritten to `https://npm.pkg.github.com`
4. **GitHub Release** — auto-generated notes + attached `.tgz` tarball

## Rollback

If something publishes wrong:

```bash
npm unpublish @ossrandom/design-system@0.1.0 --registry=https://registry.npmjs.org
gh release delete v0.1.0 --yes
git push --delete origin v0.1.0
```

(npm only allows unpublish within 72h of publish. After that, deprecate + cut a patch.)
