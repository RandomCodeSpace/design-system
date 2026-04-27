// Post-tsc step: write dist/styles.css + copy bundled fonts.
//
// dist/styles.css is the concatenation of design tokens
// (colors_and_type.css) and component CSS (src/styles.css). The
// woff2 files referenced by @font-face rules in colors_and_type.css
// are copied to dist/assets/fonts/ so consumers receive a fully
// self-contained, air-gap-safe stylesheet.

import { readFileSync, writeFileSync, cpSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(repoRoot, "dist");
const fontsSrc = resolve(repoRoot, "assets/fonts");
const fontsDst = resolve(distDir, "assets/fonts");

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const tokens = readFileSync(resolve(repoRoot, "colors_and_type.css"), "utf8");
const components = readFileSync(resolve(repoRoot, "src/styles.css"), "utf8");
const concatenated = `${tokens}\n${components}`;

// Refuse to ship a stylesheet that pulls fonts from a public CDN —
// breaks air-gapped consumers and leaks a request to Google.
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(concatenated)) {
  throw new Error(
    "build-assets: refusing to write dist/styles.css — public CDN font reference found. " +
      "Remove from colors_and_type.css and rebuild.",
  );
}

writeFileSync(resolve(distDir, "styles.css"), concatenated, "utf8");

if (!existsSync(fontsSrc)) {
  throw new Error(`build-assets: ${fontsSrc} missing — woff2 files are required.`);
}
// Clear the destination first so a font swap doesn't leave orphaned
// woff2s from a previous build alongside the current set.
rmSync(fontsDst, { recursive: true, force: true });
cpSync(fontsSrc, fontsDst, { recursive: true });

// Sanity: assert the emitted types index is present. The d.ts pass
// is fragile — silent absence broke v0.1.0 — so fail loudly here.
const componentsDts = resolve(distDir, "components.d.ts");
if (!existsSync(componentsDts)) {
  throw new Error(
    `build-assets: ${componentsDts} missing — tsc did not emit the types aggregator. ` +
      "Make sure src/components.ts (not .d.ts) is the source.",
  );
}

console.log("build-assets: dist/styles.css + dist/assets/fonts/ written");
