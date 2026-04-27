// Post-tsc step: write dist/styles.css + copy bundled fonts.
//
// dist/styles.css is the concatenation of design tokens
// (colors_and_type.css) and component CSS (src/styles.css). The
// woff2 files referenced by @font-face rules in colors_and_type.css
// are copied to dist/assets/fonts/ so consumers receive a fully
// self-contained, air-gap-safe stylesheet.

import { readFileSync, writeFileSync, cpSync, rmSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
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

// Rewrite extensionless relative ESM imports (`from "./foo"`) to
// include `.js` so Node's strict ESM loader can resolve them. tsc with
// `moduleResolution: "Bundler"` keeps source extensionless — fine inside
// a bundler, but breaks under Node ESM. We patch the emitted .js + .d.ts
// here rather than forcing source-side extensions across every component.
const RELATIVE_IMPORT = /((?:^|\s)(?:import|export)\s*(?:[\s\S]*?)\sfrom\s*|\bimport\s*\(\s*)(["'])(\.{1,2}\/[^"']+?)(["'])/g;
const HAS_EXTENSION = /\.(?:[mc]?js|json|css|d\.ts)$/;
function rewriteRelativeImports(source) {
  return source.replace(RELATIVE_IMPORT, (match, lead, q1, path, q2) => {
    if (HAS_EXTENSION.test(path)) return match;
    return `${lead}${q1}${path}.js${q2}`;
  });
}
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".js") || full.endsWith(".d.ts")) out.push(full);
  }
  return out;
}
let rewritten = 0;
for (const file of walk(distDir)) {
  const original = readFileSync(file, "utf8");
  const next = rewriteRelativeImports(original);
  if (next !== original) {
    writeFileSync(file, next, "utf8");
    rewritten += 1;
  }
}

console.log(`build-assets: dist/styles.css + dist/assets/fonts/ written; ${rewritten} files patched for ESM imports`);
