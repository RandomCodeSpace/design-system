# Push to GitHub — quick guide

The project is configured for the repo at:

`https://github.com/RandomCodeSpace/design-system`

## Option A — Use the workspace's "Push to GitHub" button

If your project workspace UI shows a Push/Sync button next to the GitHub badge, that's the supported path. It pushes the whole project tree to the connected repo.

## Option B — Use the GitHub connector

If GitHub is connected in this workspace, a sync action is available from chat. Ask to "push to RandomCodeSpace/design-system" and the connector will sync the working tree.

## Option C — Download + push manually

```bash
# Download the project zip from the workspace, then:
unzip rcs-design-system.zip
cd rcs-design-system

git init
git add .
git commit -m "Initial commit: RandomCodeSpace Design System"

git branch -M main
git remote add origin https://github.com/RandomCodeSpace/design-system.git
git push -u origin main
```

## After the first push

1. Add `NPM_TOKEN` repo secret (Settings → Secrets and variables → Actions). `GITHUB_TOKEN` is automatic.
2. Verify CI runs green on `main` (typecheck → lint → test → build).
3. Cut a release: `pnpm version 0.1.0 && git push --follow-tags`.
4. Watch **Actions → Release** publish to npm + GitHub Packages and create the GitHub Release.

Full checklist: [`.github/SETUP.md`](./SETUP.md).
