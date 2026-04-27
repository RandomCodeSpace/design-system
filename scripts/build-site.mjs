#!/usr/bin/env node
/**
 * Build the Pages docs site into `_site/` (or whatever path is passed).
 * Mirrors `.github/workflows/pages.yml` so playwright can run against
 * the same artifact CI deploys.
 *
 *   node scripts/build-site.mjs [outDir]
 *
 * Steps:
 *   1. Recreate <outDir>/
 *   2. Stage colors_and_type.css + assets/ + preview/ + ui_kits/
 *   3. Bundle src → <outDir>/docs/bundle/rcs.iife.js (esbuild IIFE)
 *   4. Run scripts/build-docs.mjs to write per-component pages
 */
import { existsSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const out = resolve(root, process.argv[2] || "_site");

console.log(`build-site → ${out}`);

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "docs/bundle"), { recursive: true });

cpSync(join(root, "colors_and_type.css"), join(out, "colors_and_type.css"));
for (const dir of ["assets", "preview", "ui_kits"]) {
  const src = join(root, dir);
  if (existsSync(src)) cpSync(src, join(out, dir), { recursive: true });
}

const esbuildBin = join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "esbuild.cmd" : "esbuild",
);
const r1 = spawnSync(esbuildBin, [
  "scripts/bundle-entry.ts",
  "--bundle",
  "--format=iife",
  "--global-name=RCS",
  `--outfile=${join(out, "docs/bundle/rcs.iife.js")}`,
  "--target=es2020",
  "--jsx=automatic",
  "--minify",
  '--define:process.env.NODE_ENV="production"',
], { stdio: "inherit" });
if (r1.status !== 0) process.exit(r1.status ?? 1);

const r2 = spawnSync(process.execPath, ["scripts/build-docs.mjs", out], { stdio: "inherit" });
if (r2.status !== 0) process.exit(r2.status ?? 1);

const r3 = spawnSync(process.execPath, ["scripts/build-llms.mjs", out], { stdio: "inherit" });
if (r3.status !== 0) process.exit(r3.status ?? 1);

console.log(`build-site ✓ ${out.replace(root + sep, "")}/`);
