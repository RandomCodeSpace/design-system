#!/usr/bin/env node
/**
 * Auto-generate the entire docs site.
 *
 *   node scripts/build-docs.mjs <outDir>
 *
 * Produces:
 *   <outDir>/index.html                 (site landing)
 *   <outDir>/site.css                   (shared header/footer + global)
 *   <outDir>/apps/index.html            (sample apps gallery)
 *   <outDir>/dist/styles.css            (concat colors_and_type.css + src/styles.css)
 *   <outDir>/docs/index.html            (component reference, card grid)
 *   <outDir>/docs/docs.css              (per-component page styles)
 *   <outDir>/docs/runner.js             (Babel + render helper)
 *   <outDir>/docs/playground/index.html (editable playground)
 *   <outDir>/docs/<Name>/index.html     (one per runtime export)
 *
 * Source of truth (parsed from the repo):
 *   src/components.ts    (interfaces, supporting types)
 *   src/tokens.ts        (token unions)
 *   src/index.tsx        (runtime export → category file)
 *   src/charts/index.ts  (charts subpath exports — "Charts" category)
 *
 * Every component page renders the live React component via the IIFE
 * bundle plus Babel-standalone. There are no hand-written HTML cards.
 *
 * Pure Node built-ins.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { generateDemos } from "./component-examples.mjs";
import { extractInterfaces, extractTypeAliases, parseRuntimeExports, parseChartsExports } from "./parse-source.mjs";

const root = process.cwd();
const outDir = resolve(root, process.argv[2] || "_site");
mkdirSync(outDir, { recursive: true });

const componentsDts = readFileSync(join(root, "src/components.ts"), "utf8");
const tokensTs = readFileSync(join(root, "src/tokens.ts"), "utf8");
const indexTsx = readFileSync(join(root, "src/index.tsx"), "utf8");
const chartsIndexTs = (() => {
  try { return readFileSync(join(root, "src/charts/index.ts"), "utf8"); }
  catch { return ""; }
})();
const colorsAndTypeCss = readFileSync(join(root, "colors_and_type.css"), "utf8");
const componentStylesCss = readFileSync(join(root, "src/styles.css"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const REPO_URL = "https://github.com/RandomCodeSpace/design-system";

// ─── 1. Parse runtime exports + interfaces + token aliases ────────────
const runtimeExports = parseRuntimeExports(indexTsx);
const chartExports = parseChartsExports(chartsIndexTs);
const interfaces = extractInterfaces(componentsDts);
const componentTypeAliases = extractTypeAliases(componentsDts);
const tokenTypeAliases = extractTypeAliases(tokensTs);
const interfaceByName = new Map(interfaces.map((i) => [i.name, i]));

// ─── 3. Docs categories (better than 1:1 source mapping) ──────────────
const DOCS_CATEGORIES = [
  { id: "theme",      label: "Theme",             blurb: "Foundation. Mount once near the root.",      srcFiles: ["theme"] },
  { id: "layout",     label: "Layout",            blurb: "Surfaces, spacing, app shell.",              srcFiles: ["layout", "page"] },
  { id: "actions",    label: "Buttons & actions", blurb: "Anything you click to do something.",        srcFiles: ["buttons"] },
  { id: "forms",      label: "Forms & inputs",    blurb: "Text, selects, toggles, dates, files.",      srcFiles: ["inputs", "selects", "form-controls"] },
  { id: "data",       label: "Data display",      blurb: "Tables, stats, badges, avatars, timeline.",  srcFiles: ["data-display", "badges"] },
  { id: "navigation", label: "Navigation",        blurb: "Tabs, menus, breadcrumb, pagination.",       srcFiles: ["navigation"] },
  { id: "feedback",   label: "Feedback",          blurb: "Status, modals, toasts, tooltips.",          srcFiles: ["feedback"] },
  { id: "content",    label: "Content",           blurb: "Code, markdown, terminal, chat, RTE.",       srcFiles: ["code", "chat"] },
  { id: "charts",     label: "Charts",            blurb: "Opt-in subpath — Chart, Sparkline, Donut, RadialGauge, UptimeBar, Treemap, ServiceMap.", charts: true },
];

// Peer-dep callouts for chart pages.
const CHART_PEER_DEPS = {
  Chart:       ["uplot (canvas, default)", "@deck.gl/core + @deck.gl/layers (webgl/webgpu)"],
  Sparkline:   [],
  Donut:       [],
  RadialGauge: [],
  UptimeBar:   [],
  Treemap:     ["d3-hierarchy"],
  ServiceMap:  ["cytoscape + cytoscape-cose-bilkent (canvas)", "@deck.gl/core + @deck.gl/layers + d3-force (webgl)"],
};

// Canonical static code snippets per chart (charts aren't in the IIFE
// bundle, so their docs pages show static code rather than live render).
const CHART_DEMOS = {
  Chart: { title: "Time-series line chart",
    code: `<Chart\n  timestamps={[Date.now() - 60_000, Date.now() - 30_000, Date.now()]}\n  series={[{ id: "cpu", label: "CPU %", data: [35, 62, 78] }]}\n  height={240}\n/>` },
  Sparkline: { title: "Inline trend",
    code: `<Sparkline data={[12, 18, 22, 19, 25, 28, 35, 32, 42, 48]} width={120} height={32} />` },
  Donut: { title: "Capacity breakdown",
    code: `<Donut\n  segments={[\n    { label: "Compute",  value: 45 },\n    { label: "Database", value: 25 },\n    { label: "Cache",    value: 18 },\n    { label: "Other",    value: 12 },\n  ]}\n  centerLabel="cores" centerValue="847"\n/>` },
  RadialGauge: { title: "SLO gauge",
    code: `<RadialGauge value={94} max={100} label="30-day SLO" tone="good" />` },
  UptimeBar: { title: "30-day uptime",
    code: `<UptimeBar\n  cells={Array.from({ length: 30 }, (_, i) => ({\n    status: i === 12 ? "outage" : i === 19 ? "degraded" : "ok",\n    timestamp: Date.now() - (29 - i) * 86_400_000,\n  }))}\n/>` },
  Treemap: { title: "Resource breakdown",
    code: `<Treemap\n  nodes={{\n    id: "all", label: "All",\n    children: [\n      { id: "compute", label: "Compute", value: 100 },\n      { id: "storage", label: "Storage", value: 60 },\n      { id: "network", label: "Network", value: 40 },\n    ],\n  }}\n  height={320}\n/>` },
  ServiceMap: { title: "Service topology",
    code: `<ServiceMap\n  nodes={[\n    { id: "api",   label: "API Gateway", status: "healthy" },\n    { id: "auth",  label: "Auth",        status: "healthy" },\n    { id: "users", label: "Users DB",    status: "degraded" },\n  ]}\n  edges={[\n    { source: "api", target: "auth" },\n    { source: "api", target: "users", status: "failing" },\n  ]}\n  height={420}\n/>` },
};

function isChart(name) { return chartExports.has(name); }
function categoryForExport(name) {
  if (isChart(name)) return DOCS_CATEGORIES.find((c) => c.id === "charts");
  const f = runtimeExports.get(name);
  return f ? DOCS_CATEGORIES.find((c) => !c.charts && c.srcFiles?.includes(f)) : null;
}

const exportsByCategory = new Map(DOCS_CATEGORIES.map((c) => [c.id, []]));
for (const [name] of runtimeExports) {
  const cat = categoryForExport(name);
  if (cat) exportsByCategory.get(cat.id).push(name);
}
for (const [name] of chartExports) {
  exportsByCategory.get("charts").push(name);
}
const HOOKS = new Set(["useTheme", "toast"]);
const ALL_NAMES = [...runtimeExports.keys(), ...chartExports.keys()];

// ─── 4. Helpers ───────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function code(s) { return `<code>${escapeHtml(s)}</code>`; }
function findPropsFor(name) { return interfaceByName.get(name + "Props") || null; }
const TYPE_ALIASES = new Map([
  ...componentTypeAliases.map((a) => [a.name, a.value]),
  ...tokenTypeAliases.map((a) => [a.name, a.value]),
]);
function getDemos(name) { return generateDemos(name, findPropsFor(name), { typeAliases: TYPE_ALIASES }); }
function findRelatedTypes(iface) {
  if (!iface) return [];
  const set = new Set();
  for (const p of iface.props) for (const m of p.type.matchAll(/\b([A-Z]\w+)\b/g)) set.add(m[1]);
  return [...set].filter((n) => interfaceByName.has(n) && n !== iface.name && n !== "BaseProps" && !n.endsWith("Props")).map((n) => interfaceByName.get(n));
}
function encodeForUrl(s) { return encodeURIComponent(Buffer.from(s, "utf8").toString("base64")); }
// Path prefix from a given depth back to <outDir>/. depth=0 is site root.
function prefix(depth) { return depth === 0 ? "" : "../".repeat(depth); }

// ─── 5. Site-wide header + footer ─────────────────────────────────────
const NAV_ITEMS = [
  { id: "home",       label: "Home",        path: "" },
  { id: "components", label: "Components",  path: "docs/" },
  { id: "playground", label: "Playground",  path: "docs/playground/" },
  { id: "apps",       label: "Sample apps", path: "apps/" },
];

function renderHeader(active, depth) {
  const p = prefix(depth);
  const navHtml = NAV_ITEMS.map((n) => {
    const cls = n.id === active ? "active" : "";
    const href = n.path === "" ? (depth === 0 ? "./" : p) : `${p}${n.path}`;
    return `<a class="${cls}" href="${href}">${escapeHtml(n.label)}</a>`;
  }).join("");
  return `<header class="site-header">
  <a class="site-brand" href="${depth === 0 ? "./" : p}">
    <span class="site-brand-mark" aria-hidden="true"></span>
    <span class="site-brand-name">RandomCodeSpace</span>
    <span class="site-brand-tag">design system</span>
  </a>
  <nav class="site-nav" aria-label="Primary">${navHtml}</nav>
  <div class="site-header-right">
    <button class="site-theme-toggle" id="site-theme-toggle" aria-label="Toggle color theme" title="Toggle theme">
      <span class="theme-icon icon-light" aria-hidden="true">☀</span>
      <span class="theme-icon icon-dark" aria-hidden="true">☾</span>
    </button>
    <a href="${REPO_URL}" class="site-gh" title="View on GitHub" target="_blank" rel="noopener">
      <span class="site-gh-icon" aria-hidden="true">↗</span>
      <span>GitHub</span>
    </a>
  </div>
</header>`;
}

const THEME_INIT_SCRIPT = `<script>
(function() {
  var saved;
  try { saved = localStorage.getItem("rcs-theme"); } catch (e) {}
  var sys = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", saved || sys || "dark");
})();
</script>`;

const THEME_TOGGLE_SCRIPT = `<script>
(function() {
  var btn = document.getElementById("site-theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme") || "dark";
    var next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("rcs-theme", next); } catch (e) {}
  });
})();
</script>`;

function renderFooter(depth) {
  const p = prefix(depth);
  return `<footer class="site-footer">
  <div class="site-footer-col">
    <div class="site-footer-name">${escapeHtml(pkg.name)}</div>
    <div class="site-footer-meta">v${escapeHtml(pkg.version)} · MIT licensed</div>
  </div>
  <div class="site-footer-col">
    <a href="${p}docs/">Components</a>
    <a href="${p}docs/playground/">Playground</a>
    <a href="${p}apps/">Sample apps</a>
  </div>
  <div class="site-footer-col">
    <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub ↗</a>
    <a href="${REPO_URL}/blob/main/LICENSE" target="_blank" rel="noopener">License ↗</a>
    <a href="${REPO_URL}/issues" target="_blank" rel="noopener">Issues ↗</a>
  </div>
</footer>`;
}

// ─── 6. Site-wide CSS (header + footer + base) ────────────────────────
function renderSiteCss() {
  return `/* Shared site-wide styles: header, footer, base resets. Loaded by every page. */

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
body { margin: 0; background: var(--bg-0); color: var(--fg-1); font-family: var(--font-sans); }
body[data-page] { display: flex; flex-direction: column; min-height: 100vh; }
body[data-page] > main, body[data-page] > .layout { flex: 1; }
@media (max-width: 720px) { body { overflow-x: clip; } html { overflow-x: clip; } }

a { color: var(--accent); text-decoration: none; }
a:hover { opacity: 0.85; }
code { font-family: var(--font-mono); }

/* ── Site header ─────────────────────────────────────────────────────── */
.site-header {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; gap: 24px;
  padding: 0 24px; height: 52px;
  background: color-mix(in srgb, var(--bg-0) 92%, transparent);
  backdrop-filter: saturate(160%) blur(8px);
  -webkit-backdrop-filter: saturate(160%) blur(8px);
  border-bottom: 1px solid var(--border-1);
  font-size: 13px;
}
@media (max-width: 720px) {
  .site-header { padding: 0 14px; gap: 12px; }
  .site-gh > span:not(.site-gh-icon) { display: none; }
  .site-gh { padding: 6px 8px; }
  .site-header-right { gap: 8px; }
}
.site-brand { display: flex; align-items: center; gap: 10px; color: var(--fg-1); text-decoration: none; flex-shrink: 0; }
.site-brand:hover { opacity: 1; color: var(--fg-1); }
.site-brand-mark {
  width: 18px; height: 18px;
  background: var(--accent);
  border-radius: 4px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 60%, transparent),
              inset 0 -3px 0 0 var(--accent-press);
}
.site-brand-name { font-weight: 600; letter-spacing: -0.012em; font-size: 13.5px; }
.site-brand-tag {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--fg-3); padding-left: 10px; margin-left: 2px; border-left: 1px solid var(--border-1);
}
@media (max-width: 720px) { .site-brand-tag { display: none; } }

.site-nav { display: flex; align-items: center; gap: 2px; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.site-nav::-webkit-scrollbar { display: none; }
.site-nav a {
  padding: 6px 11px; border-radius: 4px; color: var(--fg-2); text-decoration: none;
  font-weight: 500; white-space: nowrap;
  transition: background 140ms cubic-bezier(0.25,1,0.5,1), color 140ms;
}
.site-nav a:hover { background: var(--bg-2); color: var(--fg-1); opacity: 1; }
.site-nav a.active { background: var(--bg-2); color: var(--fg-1); }

.site-header-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.site-gh {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--fg-2); text-decoration: none;
  padding: 6px 11px; border-radius: 4px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em;
  border: 1px solid var(--border-1);
}
.site-gh:hover { background: var(--bg-2); color: var(--fg-1); border-color: var(--border-2); opacity: 1; }
.site-gh-icon { color: var(--accent); }

.site-theme-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 28px;
  background: transparent; color: var(--fg-2);
  border: 1px solid var(--border-1); border-radius: 4px;
  cursor: pointer; padding: 0; font-size: 14px; line-height: 1;
  transition: background 140ms cubic-bezier(0.25,1,0.5,1), color 140ms, border-color 140ms;
}
.site-theme-toggle:hover { background: var(--bg-2); color: var(--fg-1); border-color: var(--border-2); }
.theme-icon { display: none; }
[data-theme="dark"] .icon-light { display: inline; }
[data-theme="light"] .icon-dark { display: inline; }

/* ── Site footer ─────────────────────────────────────────────────────── */
.site-footer {
  margin-top: auto;
  display: grid; grid-template-columns: 1fr auto auto; gap: 32px;
  padding: 32px 24px; border-top: 1px solid var(--border-1);
  font-size: 13px; color: var(--fg-3);
}
@media (max-width: 720px) { .site-footer { grid-template-columns: 1fr; gap: 16px; } }
.site-footer-col { display: flex; flex-direction: column; gap: 6px; }
.site-footer-col:nth-child(2), .site-footer-col:nth-child(3) {
  flex-direction: row; gap: 16px; flex-wrap: wrap; align-items: flex-start;
}
.site-footer-name { font-weight: 600; color: var(--fg-1); font-family: var(--font-mono); font-size: 12px; }
.site-footer-meta { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; }
.site-footer-col a { color: var(--fg-3); text-decoration: none; font-family: var(--font-mono); font-size: 11.5px; }
.site-footer-col a:hover { color: var(--accent); opacity: 1; }

/* ── Page-content wrapper ────────────────────────────────────────────── */
.page-wrap { max-width: 1080px; margin: 0 auto; padding: 56px 24px 80px; }
@media (max-width: 720px) {
  .page-wrap { padding: 32px 16px 56px; }
}
.page-back {
  display: inline-block; margin-bottom: 24px; color: var(--fg-3);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; text-decoration: none;
}
.page-back:hover { color: var(--fg-1); }
.eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--fg-3); margin: 0 0 16px;
  display: inline-flex; align-items: center; gap: 10px;
}
.eyebrow::before { content: ""; width: 20px; height: 1px; background: var(--border-2); }
h1.page-h1 { font-size: 56px; font-weight: 600; letter-spacing: -0.032em; line-height: 1.04; margin: 0 0 16px; }
h1.page-h1 br { display: inline; }
@media (max-width: 720px) {
  h1.page-h1 { font-size: 32px; line-height: 1.1; }
  h1.page-h1 br { display: none; }
}
p.lede { color: var(--fg-2); font-size: 16px; line-height: 1.55; margin: 0 0 32px; max-width: 64ch; }
@media (max-width: 720px) { p.lede { font-size: 15px; margin-bottom: 24px; } }

.section { margin: 0 0 56px; }
.section > h2 { font-size: 22px; font-weight: 600; letter-spacing: -0.014em; margin: 0 0 6px; }
.section > .blurb { color: var(--fg-2); font-size: 14px; margin: 0 0 4px; }
.section > .src { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); letter-spacing: 0.04em; margin: 0 0 18px; }

.grid {
  display: grid; gap: 1px; background: var(--border-1);
  border: 1px solid var(--border-1); border-radius: 4px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.grid.lg { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
a.card {
  display: block; padding: 16px 18px;
  background: var(--bg-1); color: var(--fg-1); text-decoration: none;
  transition: background 140ms cubic-bezier(0.25,1,0.5,1);
}
a.card:hover { background: var(--bg-2); opacity: 1; }
a.card .kind {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--fg-3); margin-bottom: 8px;
}
a.card .name { font-family: var(--font-mono); font-size: 14px; font-weight: 500; color: var(--fg-1); margin-bottom: 4px; }
a.card .desc { color: var(--fg-3); font-size: 12.5px; line-height: 1.55; }
a.card .meta { font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3); margin-top: 6px; }

.install {
  background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 4px;
  padding: 12px 16px; margin: 0 0 56px;
  font-family: var(--font-mono); font-size: 13px; color: var(--fg-1);
  display: flex; align-items: center; gap: 12px;
  overflow-x: auto; white-space: nowrap;
}
.install .install-prefix { color: var(--fg-3); }
@media (max-width: 720px) {
  .install { font-size: 12px; padding: 10px 14px; margin-bottom: 32px; }
}

.btn-primary {
  display: inline-block; padding: 8px 14px;
  background: var(--accent); color: var(--accent-fg); border-radius: 4px;
  font-family: var(--font-sans); font-size: 13px; font-weight: 500; text-decoration: none;
  transition: background 140ms cubic-bezier(0.25,1,0.5,1);
}
.btn-primary:hover { background: var(--accent-hover); opacity: 1; }
.btn-secondary {
  display: inline-block; padding: 8px 14px;
  background: var(--bg-2); color: var(--fg-1); border-radius: 4px; border: 1px solid var(--border-2);
  font-family: var(--font-sans); font-size: 13px; font-weight: 500; text-decoration: none;
  transition: background 140ms cubic-bezier(0.25,1,0.5,1);
}
.btn-secondary:hover { background: var(--bg-3); opacity: 1; }
`;
}

// ─── 7. Per-component page styles (sidebar layout) ────────────────────
function renderDocsCss() {
  return `/* Per-component page styles. Loaded only by /docs/ pages. */

.docs-layout {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  align-items: stretch;
}
.docs-aside-toggle { display: none; }
.docs-aside-backdrop { display: none; }

@media (max-width: 880px) {
  .docs-layout { grid-template-columns: 1fr; }
  .docs-aside {
    position: fixed; top: 52px; left: 0; bottom: 0;
    width: 280px; max-width: 86vw; z-index: 90;
    background: var(--bg-0);
    border-right: 1px solid var(--border-1) !important;
    border-bottom: none !important;
    transform: translateX(-100%);
    transition: transform 220ms cubic-bezier(0.25,1,0.5,1);
    box-shadow: 0 12px 28px rgba(0,0,0,0.18);
  }
  .docs-aside.open { transform: translateX(0); }
  .docs-aside-backdrop {
    display: block;
    position: fixed; inset: 52px 0 0 0; z-index: 85;
    background: color-mix(in srgb, var(--bg-0) 60%, transparent);
    opacity: 0; pointer-events: none;
    transition: opacity 220ms cubic-bezier(0.25,1,0.5,1);
  }
  .docs-aside-backdrop.open { opacity: 1; pointer-events: auto; }
  .docs-aside-toggle {
    display: inline-flex; align-items: center; gap: 10px;
    position: sticky; top: 52px; z-index: 80;
    padding: 0 16px; height: 44px;
    background: var(--bg-0); border: none;
    border-bottom: 1px solid var(--border-1);
    color: var(--fg-1); font-family: var(--font-mono); font-size: 11.5px;
    letter-spacing: 0.04em; text-transform: uppercase;
    cursor: pointer; width: 100%; justify-content: flex-start;
  }
  .docs-aside-toggle .hb-stack {
    display: inline-flex; flex-direction: column; gap: 3px;
  }
  .docs-aside-toggle .hb {
    display: block; width: 16px; height: 1.5px; background: var(--fg-2);
  }
}
.docs-aside {
  position: sticky; top: 52px; height: calc(100vh - 52px); overflow-y: auto;
  border-right: 1px solid var(--border-1); padding: 24px 18px 64px;
  font-size: 13px;
}
.docs-aside .filter {
  margin-bottom: 16px; padding: 0 0 16px; border-bottom: 1px solid var(--border-1);
}
.docs-aside .filter input {
  width: 100%; box-sizing: border-box;
  background: var(--bg-2); color: var(--fg-1);
  border: 1px solid var(--border-1); border-radius: 4px;
  padding: 6px 10px; font-family: var(--font-mono); font-size: 12px;
  outline: none; transition: border-color 140ms;
}
.docs-aside .filter input:focus { border-color: var(--accent); }

.docs-aside .nav { list-style: none; margin: 0; padding: 0; }
.docs-aside .nav .cat { margin-bottom: 18px; }
.docs-aside .nav .cat-label {
  display: block; padding: 4px 0;
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--fg-2); font-weight: 600;
}
.docs-aside .nav ul { list-style: none; margin: 4px 0 0; padding: 0; }
.docs-aside .nav ul li a {
  display: block; padding: 4px 0 4px 12px; color: var(--fg-3);
  font-size: 12.5px; border-left: 1px solid var(--border-1); text-decoration: none;
  transition: color 140ms, border-color 140ms;
}
.docs-aside .nav ul li a:hover { color: var(--fg-1); border-left-color: var(--accent); opacity: 1; }
.docs-aside .nav ul li a.active { color: var(--accent); border-left-color: var(--accent); font-weight: 500; }

.docs-main { padding: 48px 56px 96px; max-width: 920px; min-width: 0; }
@media (max-width: 880px) { .docs-main { padding: 32px 20px 64px; } }

.page-head { margin: 0 0 40px; }
.page-head .crumbs {
  font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); letter-spacing: 0.04em;
  margin-bottom: 12px;
}
.page-head .crumbs a { color: var(--fg-3); text-decoration: none; }
.page-head .crumbs a:hover { color: var(--fg-1); opacity: 1; }
.page-head .crumbs .sep { color: var(--fg-4); padding: 0 4px; }
.page-head .kind {
  display: inline-block;
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--fg-3); padding: 2px 6px; border: 1px solid var(--border-1); border-radius: 2px;
  margin-bottom: 12px;
}
.page-head h1 {
  font-size: 32px; font-weight: 600; letter-spacing: -0.022em; margin: 0 0 8px;
  font-family: var(--font-mono); color: var(--fg-1);
}
.page-head h1 .generics { color: var(--fg-3); font-weight: 400; font-size: 20px; }
.page-head .src { font-family: var(--font-mono); font-size: 11.5px; color: var(--fg-3); margin: 0; }

.block { margin: 0 0 36px; }
.block > h2 {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--fg-3); margin: 0 0 12px;
}
.snippet {
  background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 4px;
  padding: 14px 16px; margin: 0; overflow-x: auto;
}
.snippet code { font-size: 12.5px; line-height: 1.55; color: var(--fg-1); }

/* ── Per-demo cards (render area + meta bar + collapsible code) ───────── */
.block.demos { margin-bottom: 48px; }
.block.demos > h2 { margin-bottom: 16px; }
.demo {
  border: 1px solid var(--border-1); border-radius: 4px;
  background: var(--bg-1);
  margin: 0 0 20px;
  overflow: hidden;
  transition: border-color 140ms;
}
.demo:hover { border-color: var(--border-2); }
.demo-render {
  padding: 36px 32px;
  border-bottom: 1px solid var(--border-1);
  background: var(--bg-1);
  position: relative;
  min-height: 80px;
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  overflow-x: auto;
}
@media (max-width: 720px) { .demo-render { padding: 24px 16px; } }
.demo-meta {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; padding: 14px 18px;
  background: var(--bg-1);
}
@media (max-width: 720px) {
  .demo-meta { flex-direction: column; align-items: stretch; gap: 10px; padding: 12px 14px; }
}
.demo-meta-text { flex: 1; min-width: 0; }
.demo-meta-text h3 {
  margin: 0 0 2px; font-size: 13px; font-weight: 600; color: var(--fg-1);
  font-family: var(--font-sans); letter-spacing: -0.005em;
}
.demo-meta-text p { margin: 0; color: var(--fg-3); font-size: 12px; line-height: 1.5; }
.demo-meta-actions {
  display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap;
}
.demo-action {
  display: inline-flex; align-items: center; gap: 5px;
  background: transparent; color: var(--fg-3);
  border: 1px solid var(--border-1); border-radius: 4px;
  padding: 4px 10px; font-family: var(--font-mono); font-size: 11px;
  cursor: pointer; text-decoration: none;
  transition: background 140ms cubic-bezier(0.25,1,0.5,1), color 140ms, border-color 140ms;
}
.demo-action:hover {
  background: var(--bg-2); color: var(--fg-1);
  border-color: var(--border-2); opacity: 1;
}
.demo-code {
  border-top: 1px solid var(--border-1);
  background: var(--bg-2);
  padding: 16px 20px;
  overflow-x: auto;
}
.demo-code[hidden] { display: none; }
.demo-code pre { margin: 0; }
.demo-code code {
  font-family: var(--font-mono); font-size: 12.5px;
  color: var(--fg-1); line-height: 1.55; white-space: pre;
}

/* Charts: static placeholder where live preview would be, plus peer-dep list. */
.demo-render--static {
  display: flex; align-items: center; justify-content: center;
  min-height: 120px; padding: 24px;
  background: var(--bg-2);
  background-image:
    repeating-linear-gradient(
      45deg, transparent, transparent 8px,
      var(--bg-1) 8px, var(--bg-1) 9px
    );
}
.demo-static-note {
  font-family: var(--font-mono); font-size: 11px; line-height: 1.55;
  color: var(--fg-3); text-align: center; max-width: 48ch;
  background: var(--bg-1); border: 1px solid var(--border-1); border-radius: 4px;
  padding: 10px 14px;
}
.demo-static-note a { color: var(--accent); }
ul.peer-deps {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 6px;
}
ul.peer-deps li code {
  font-family: var(--font-mono); font-size: 12px; color: var(--fg-2);
  padding: 6px 10px; background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 4px;
  display: inline-block;
}

table.props { width: 100%; border-collapse: collapse; border: 1px solid var(--border-1); border-radius: 4px; overflow: hidden; }
table.props th, table.props td {
  padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border-1);
  font-size: 13px; vertical-align: top;
}
table.props thead th {
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--fg-3); font-weight: 500; background: var(--bg-2);
}
table.props tr:last-child td { border-bottom: none; }
table.props td code { font-family: var(--font-mono); font-size: 12.5px; }
table.props td:first-child { width: 38%; white-space: nowrap; }
table.props td:first-child code { color: var(--accent); }
table.props .req {
  display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 2px;
  background: var(--accent-soft); color: var(--accent);
  font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.06em; text-transform: uppercase;
}

.inherits { margin: 0 0 12px; font-family: var(--font-mono); font-size: 11.5px; color: var(--fg-3); }
.inherits code { color: var(--fg-2); }

.empty, .muted {
  color: var(--fg-3); font-size: 13px; margin: 0;
  padding: 14px 16px; background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 4px;
}

.related { margin: 48px 0 0; }
.related > h2 { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fg-3); margin: 0 0 16px; }
.type-card { margin: 0 0 16px; border: 1px solid var(--border-1); border-radius: 4px; background: var(--bg-1); overflow: hidden; }
.type-card header { padding: 10px 14px; background: var(--bg-2); border-bottom: 1px solid var(--border-1); display: flex; align-items: baseline; gap: 10px; }
.type-card header .kind {
  font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--fg-3); padding: 2px 6px; border: 1px solid var(--border-1); border-radius: 2px;
}
.type-card header h3 { margin: 0; font-size: 14px; font-weight: 600; font-family: var(--font-mono); color: var(--fg-1); }
.err { color: #FF5A5F; padding: 14px; font-family: var(--font-mono); font-size: 12px; background: var(--bg-2); border-radius: 4px; white-space: pre-wrap; }

html { scroll-behavior: smooth; }
`;
}

function renderRunner() {
  return `// Shared runtime for component live previews and the playground.
// Loaded after window.RCS (from /docs/bundle/rcs.iife.js) and Babel-standalone.
(function (global) {
  function listAllNames() {
    return Object.keys(global.RCS || {}).filter(function (n) { return n !== "default"; });
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function showError(target, msg) {
    target.innerHTML = '<div class="err">' + escapeHtml(msg) + '</div>';
  }
  function runExample(code, targetId) {
    var target = document.getElementById(targetId || "preview");
    if (!target) return;
    if (!global.RCS) return showError(target, "window.RCS not loaded");
    if (!global.Babel) return showError(target, "Babel standalone not loaded");
    var names = listAllNames();
    var wrapped =
      "(function() { var RCS = window.RCS; " +
      "var { " + names.join(", ") + " } = RCS; " +
      "return (" + code + "); " +
      "})()";
    var transformed;
    try {
      transformed = global.Babel.transform(wrapped, { presets: ["env", "react"] }).code;
    } catch (e) { return showError(target, "Compile error: " + (e && e.message || e)); }
    var result;
    try { result = (0, eval)(transformed); }
    catch (e) { return showError(target, "Runtime error: " + (e && e.message || e)); }
    try {
      var R = global.RCS;
      target.innerHTML = "";
      var mount = document.createElement("div");
      target.appendChild(mount);
      var root = R.createRoot(mount);
      root.render(R.React.createElement(R.ThemeProvider, { mode: "dark" }, result));
    } catch (e) { showError(target, "Render error: " + (e && e.message || e)); }
  }
  global.runExample = runExample;
})(typeof window !== "undefined" ? window : globalThis);
`;
}

// ─── 8. Page generators ───────────────────────────────────────────────
function htmlShell({ title, depth, active, body, head = "", tail = "" }) {
  const p = prefix(depth);
  return `<!doctype html>
<html data-theme="dark" lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${THEME_INIT_SCRIPT}
  <link rel="stylesheet" href="${p}colors_and_type.css">
  <link rel="stylesheet" href="${p}site.css">
  ${head}
</head>
<body data-page="${active}">
${renderHeader(active, depth)}
${body}
${renderFooter(depth)}
${THEME_TOGGLE_SCRIPT}
${tail}
</body>
</html>`;
}

function renderRootIndex() {
  const counts = {
    components: ALL_NAMES.filter((n) => !HOOKS.has(n)).length,
    hooks: ALL_NAMES.filter((n) => HOOKS.has(n)).length,
    tokens: tokenTypeAliases.length,
  };
  const body = `<main class="page-wrap">
  <p class="eyebrow">${escapeHtml(pkg.name)} · v${escapeHtml(pkg.version)}</p>
  <h1 class="page-h1">A strongly-typed React<br>design system.</h1>
  <p class="lede">
    ${counts.components} components, ${counts.hooks} hooks, ${counts.tokens} token unions.
    Inter on Cod Gray. Signal Red on monochrome surfaces. Built for self-hosted developer tooling.
    Zero runtime dependencies — only React peers.
  </p>
  <div class="install">
    <span class="install-prefix">$</span>
    <span>npm install ${escapeHtml(pkg.name)}</span>
  </div>

  <section class="section">
    <h2>Start here</h2>
    <p class="blurb">Four places to begin, depending on what you need.</p>
    <div class="grid lg">
      <a class="card" href="docs/">
        <div class="kind">/docs/</div>
        <div class="name">Component reference</div>
        <div class="desc">Live previews, props tables, related types, and source links for every export.</div>
      </a>
      <a class="card" href="docs/foundations/">
        <div class="kind">/docs/foundations/</div>
        <div class="name">Foundations</div>
        <div class="desc">Design tokens — color, typography, spacing, radii, shadows, motion — read live from the stylesheet.</div>
      </a>
      <a class="card" href="docs/playground/">
        <div class="kind">/docs/playground/</div>
        <div class="name">Playground</div>
        <div class="desc">Edit JSX in the browser and see it render against the real runtime.</div>
      </a>
      <a class="card" href="apps/">
        <div class="kind">/apps/</div>
        <div class="name">Sample apps</div>
        <div class="desc">Marketing, dashboard, and docs reference layouts built with the kit.</div>
      </a>
    </div>
  </section>


</main>`;
  return htmlShell({ title: `${pkg.name} — design system`, depth: 0, active: "home", body });
}

function renderAppsIndex() {
  const apps = [
    {
      slug: "marketing",
      name: "Marketing site",
      kind: "Landing page",
      desc: "Hero, nav, feature grid, CLI showcase, pricing, footer. Demonstrates surface composition with the dot-grid hero pattern, eyebrow micro-labels, and the one-accent rule.",
      stack: "React 18 · Babel-standalone · Lucide icons",
      path: "ui_kits/marketing/",
    },
    {
      slug: "app",
      name: "Self-hosted dashboard",
      kind: "Application",
      desc: "Sidebar, topbar, services grid, log tail, command menu (⌘K). The Linear/Supabase analog: dense data, restrained chrome, keyboard-first.",
      stack: "React 18 · Babel-standalone · Lucide icons",
      path: "ui_kits/app/",
    },
    {
      slug: "docs",
      name: "Docs site",
      kind: "Documentation",
      desc: "Sidebar nav, article body, code blocks, table of contents. Content-first layout with strong typographic hierarchy and the JetBrains Mono micro-label signature.",
      stack: "React 18 · Babel-standalone · Lucide icons",
      path: "ui_kits/docs/",
    },
  ];
  const cards = apps.map((a) => `
    <a class="app-card" href="../${a.path}">
      <div class="app-frame">
        <iframe src="../${a.path}" loading="lazy" sandbox="allow-scripts allow-same-origin" title="${escapeHtml(a.name)} preview"></iframe>
        <div class="app-frame-overlay">
          <span>Launch app →</span>
        </div>
      </div>
      <div class="app-meta">
        <div class="app-kind">${escapeHtml(a.kind)}</div>
        <div class="app-name">${escapeHtml(a.name)}</div>
        <div class="app-desc">${escapeHtml(a.desc)}</div>
        <div class="app-stack">${escapeHtml(a.stack)}</div>
      </div>
    </a>
  `).join("");

  const body = `<main class="page-wrap apps-page">
  <p class="eyebrow">Sample apps</p>
  <h1 class="page-h1">Whole apps,<br>built with the system.</h1>
  <p class="lede">
    Three reference layouts that exercise the design tokens, components, and motion rules end-to-end.
    Each one is a static React app loaded via Babel-standalone — open the page, view source, copy what you need.
  </p>
  <section class="apps-grid">${cards}</section>
  <p class="apps-note">
    Looking for the per-component reference instead? See the <a href="../docs/">component docs</a>.
  </p>
</main>
<style>
  .apps-page { max-width: 1200px; }
  .apps-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));
    gap: 24px; margin: 48px 0 32px;
  }
  @media (max-width: 720px) {
    .apps-grid { gap: 16px; margin: 28px 0 24px; }
    .app-frame { height: 180px; }
    .app-meta { padding: 14px 16px 16px; }
    .app-name { font-size: 16px; }
    .app-desc { font-size: 13px; }
  }
  a.app-card {
    display: block; background: var(--bg-1); border: 1px solid var(--border-1); border-radius: 6px;
    overflow: hidden; text-decoration: none; color: var(--fg-1);
    transition: border-color 220ms cubic-bezier(0.25,1,0.5,1), transform 220ms;
  }
  a.app-card:hover { border-color: var(--border-2); opacity: 1; }
  a.app-card:hover .app-frame-overlay { opacity: 1; }
  .app-frame {
    position: relative; height: 240px; overflow: hidden;
    border-bottom: 1px solid var(--border-1); background: var(--bg-2);
  }
  .app-frame iframe {
    width: 200%; height: 480px; border: none; background: var(--bg-0);
    transform: scale(0.5); transform-origin: top left; pointer-events: none;
  }
  .app-frame-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--bg-0) 68%, transparent);
    color: var(--fg-1); font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.04em;
    opacity: 0; transition: opacity 220ms cubic-bezier(0.25,1,0.5,1);
  }
  .app-frame-overlay span {
    padding: 8px 14px; background: var(--accent); color: var(--accent-fg); border-radius: 4px;
    font-weight: 500;
  }
  .app-meta { padding: 18px 22px 20px; }
  .app-kind {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--fg-3); margin-bottom: 8px;
  }
  .app-name { font-size: 18px; font-weight: 600; letter-spacing: -0.012em; margin-bottom: 8px; }
  .app-desc { color: var(--fg-2); font-size: 13.5px; line-height: 1.55; margin-bottom: 12px; }
  .app-stack { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); letter-spacing: 0.04em; }
  .apps-note { color: var(--fg-3); font-size: 13px; margin: 32px 0 0; font-family: var(--font-mono); }
  .apps-note a { color: var(--accent); }
</style>`;
  return htmlShell({ title: `Sample apps — ${pkg.name}`, depth: 1, active: "apps", body });
}

function renderDocsIndex() {
  const counts = {
    components: ALL_NAMES.filter((n) => !HOOKS.has(n)).length,
    hooks: ALL_NAMES.filter((n) => HOOKS.has(n)).length,
    tokens: tokenTypeAliases.length,
    interfaces: interfaces.length,
  };
  const cats = DOCS_CATEGORIES
    .filter((c) => exportsByCategory.get(c.id).length > 0)
    .map((cat) => {
      const items = exportsByCategory.get(cat.id);
      const srcLabel = cat.charts
        ? `src/charts/  ·  import from "${pkg.name}/charts"`
        : cat.srcFiles.map((f) => `src/components/${f}.tsx`).join(" · ");
      const cards = items.map((n) => {
        const iface = findPropsFor(n);
        const isHook = HOOKS.has(n);
        const propCount = iface ? iface.props.length : 0;
        return `<a class="card" href="${n}/">
          <div class="kind">${isHook ? "hook" : "component"}</div>
          <div class="name">${escapeHtml(n)}${escapeHtml(iface?.generics || "")}</div>
          <div class="meta">${isHook ? "—" : `${propCount} prop${propCount === 1 ? "" : "s"}`}</div>
        </a>`;
      }).join("");
      return `<section class="section" id="cat-${cat.id}">
        <h2>${escapeHtml(cat.label)}</h2>
        <p class="blurb">${escapeHtml(cat.blurb)}</p>
        <p class="src"><code>${escapeHtml(srcLabel)}</code></p>
        <div class="grid">${cards}</div>
      </section>`;
    }).join("");

  const body = `<main class="page-wrap">
  <p class="eyebrow">Components · API reference</p>
  <h1 class="page-h1">Component reference.</h1>
  <p class="lede">
    ${counts.components} components, ${counts.hooks} hooks, ${counts.tokens} tokens, ${counts.interfaces} interfaces.
    Each component has its own page with a live preview, the example code, the API table, and related types.
    Open any of them in the <a href="playground/">playground</a> to tweak interactively.
  </p>
  <div class="install">
    <span class="install-prefix">$</span>
    <span>npm install ${escapeHtml(pkg.name)}</span>
  </div>
  <section class="section">
    <h2>Foundations</h2>
    <p class="blurb">Start with the design tokens — colors, typography, spacing, radii, shadows, motion. Live values, theme-aware.</p>
    <div class="grid">
      <a class="card" href="foundations/">
        <div class="kind">/docs/foundations/</div>
        <div class="name">Design tokens</div>
        <div class="meta">${tokenTypeAliases.length} token type${tokenTypeAliases.length === 1 ? "" : "s"}</div>
      </a>
    </div>
  </section>
  ${cats}
</main>`;
  return htmlShell({ title: `Components — ${pkg.name}`, depth: 1, active: "components", body });
}

function renderSidebar(activeName) {
  const foundationsBlock = `<li class="cat">
      <a class="cat-label" href="../foundations/">Foundations</a>
      <ul><li><a href="../foundations/">Design tokens</a></li></ul>
    </li>`;
  const blocks = DOCS_CATEGORIES.map((cat) => {
    const items = exportsByCategory.get(cat.id);
    if (!items.length) return "";
    return `<li class="cat">
      <a class="cat-label" href="../#cat-${cat.id}">${escapeHtml(cat.label)}</a>
      <ul>${items.map((n) => `<li><a class="${n === activeName ? "active" : ""}" href="../${n}/">${escapeHtml(n)}</a></li>`).join("")}</ul>
    </li>`;
  }).join("");
  return `<ul class="nav">${foundationsBlock}${blocks}</ul>`;
}

function renderPropsTable(iface) {
  if (!iface || iface.props.length === 0) return '<p class="empty">No props.</p>';
  const rows = iface.props.map((p) => `<tr>
    <td><code>${escapeHtml(p.name)}</code>${p.optional ? "" : ' <span class="req">required</span>'}</td>
    <td><code>${escapeHtml(p.type)}</code></td>
  </tr>`).join("");
  return `<table class="props"><thead><tr><th>Prop</th><th>Type</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderComponentPage(name) {
  const iface = findPropsFor(name);
  const isHook = HOOKS.has(name);
  const chart = isChart(name);
  const generics = iface?.generics || "";
  const cat = categoryForExport(name);
  const srcPath = chart
    ? `src/charts/${chartExports.get(name)}.tsx`
    : `src/components/${runtimeExports.get(name)}.tsx`;
  // Charts can't run live in the IIFE bundle (peer deps live outside it),
  // so we show static code snippets instead of running them.
  const demos = chart
    ? (CHART_DEMOS[name] ? [CHART_DEMOS[name]] : [])
    : getDemos(name);
  const importLine = chart
    ? `import { ${name} } from "${pkg.name}/charts";`
    : `import { ${name} } from "${pkg.name}";`;
  const peerDeps = chart ? (CHART_PEER_DEPS[name] || []) : [];
  const inheritance = iface?.extends ? `<p class="inherits">extends ${code(iface.extends)}</p>` : "";
  const related = findRelatedTypes(iface);
  const relatedHtml = related.length === 0 ? "" : `<section class="related">
      <h2>Related types</h2>
      ${related.map((r) => `<article class="type-card">
        <header><span class="kind">interface</span><h3>${escapeHtml(r.name)}${escapeHtml(r.generics)}</h3></header>
        ${renderPropsTable(r)}
      </article>`).join("")}
    </section>`;

  const demosHtml = demos.map((d, i) => `
    <article class="demo" id="demo-${i}">
      ${chart
        ? `<div class="demo-render demo-render--static" id="demo-render-${i}">
            <div class="demo-static-note">Live render coming in the chart bundle pass. Copy the code below to try it locally.</div>
          </div>`
        : `<div class="demo-render" id="demo-render-${i}"></div>`}
      <div class="demo-meta">
        <div class="demo-meta-text">
          <h3>${escapeHtml(d.title)}</h3>
          ${d.description ? `<p>${escapeHtml(d.description)}</p>` : ""}
        </div>
        <div class="demo-meta-actions">
          <button type="button" class="demo-action" data-action="copy" data-target="${i}" title="Copy code">⎘ Copy</button>
          ${chart
            ? ""
            : `<a class="demo-action" href="../playground/?code=${encodeForUrl(d.code)}" target="_blank" rel="noopener" title="Open in playground">↗ Playground</a>`}
          <button type="button" class="demo-action demo-toggle" data-target="${i}" aria-expanded="${chart ? "true" : "false"}">‹/› ${chart ? "Hide" : "Show"} code</button>
        </div>
      </div>
      <div class="demo-code" id="demo-code-${i}"${chart ? "" : " hidden"}>
        <pre><code class="lang-tsx">${escapeHtml(d.code)}</code></pre>
      </div>
    </article>
  `).join("");

  const body = `<div class="docs-layout">
  <aside class="docs-aside" id="docs-aside">
    <div class="filter"><input type="search" placeholder="Filter components…" id="docs-filter" autocomplete="off" spellcheck="false"></div>
    ${renderSidebar(name)}
  </aside>
  <div class="docs-aside-backdrop" id="docs-aside-backdrop" aria-hidden="true"></div>
  <button type="button" class="docs-aside-toggle" id="docs-aside-toggle" aria-label="Toggle sidebar" aria-controls="docs-aside" aria-expanded="false">
    <span class="hb-stack"><span class="hb"></span><span class="hb"></span><span class="hb"></span></span>
    <span>Components</span>
  </button>
  <main class="docs-main">
    <header class="page-head">
      <div class="crumbs">
        <a href="..">Components</a><span class="sep">/</span><span>${escapeHtml(cat?.label || "Other")}</span><span class="sep">/</span><span class="crumb-now">${escapeHtml(name)}</span>
      </div>
      <span class="kind">${isHook ? "hook" : (chart ? "component (charts)" : "component")}</span>
      <h1>${escapeHtml(name)}<span class="generics">${escapeHtml(generics)}</span></h1>
      <p class="src"><code>${escapeHtml(srcPath)}</code></p>
    </header>

    <section class="block">
      <h2>Import</h2>
      <pre class="snippet"><code>${escapeHtml(importLine)}</code></pre>
    </section>

    ${chart ? `<section class="block">
      <h2>Peer dependencies</h2>
      ${peerDeps.length === 0
        ? `<p class="muted">None — pure SVG / canvas2d render path.</p>`
        : `<ul class="peer-deps">${peerDeps.map((d) => `<li><code>${escapeHtml(d)}</code></li>`).join("")}</ul>`}
    </section>` : ""}

    <section class="block demos">
      <h2>${chart ? "Example" : "Examples"}</h2>
      ${demosHtml}
    </section>

    <section class="block">
      <h2>API</h2>
      ${inheritance}
      ${isHook ? `<p class="muted">Hooks have no prop interface. Call ${code(name + "()")} from inside a component to use it.</p>` : renderPropsTable(iface)}
    </section>

    ${relatedHtml}
  </main>
</div>`;

  const head = `
  <link rel="stylesheet" href="../../dist/styles.css">
  <link rel="stylesheet" href="../docs.css">`;

  // Build a script that runs each demo and wires up copy / toggle / sidebar drawer.
  // Charts skip the live runner — they're not in the IIFE bundle.
  const runCalls = chart
    ? ""
    : demos.map((d, i) => `runExample(${JSON.stringify(d.code)}, "demo-render-${i}");`).join("\n      ");
  const codeJson = JSON.stringify(demos.map((d) => d.code));

  const tail = `
  <script src="../bundle/rcs.iife.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>
  <script src="../runner.js"></script>
  <script>
    (function () {
      var DEMO_CODES = ${codeJson};
      function runAll() {
        if (typeof runExample !== 'function') {
          document.querySelectorAll('.demo-render').forEach(function (el) {
            el.innerHTML = '<div class="err">runner.js failed to load</div>';
          });
          return;
        }
        ${runCalls}
      }
      // Toggle code panel
      document.querySelectorAll('.demo-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = btn.getAttribute('data-target');
          var panel = document.getElementById('demo-code-' + i);
          var open = !panel.hasAttribute('hidden');
          if (open) { panel.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); btn.textContent = '‹/› Show code'; }
          else { panel.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); btn.textContent = '‹/› Hide code'; }
        });
      });
      // Copy code
      document.querySelectorAll('[data-action="copy"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = btn.getAttribute('data-target');
          var code = DEMO_CODES[parseInt(i, 10)];
          if (!code) return;
          var orig = btn.textContent;
          (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(function () {
            btn.textContent = '✓ Copied';
            setTimeout(function () { btn.textContent = orig; }, 1200);
          }).catch(function () {
            try {
              var ta = document.createElement('textarea');
              ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy');
              document.body.removeChild(ta);
              btn.textContent = '✓ Copied';
              setTimeout(function () { btn.textContent = orig; }, 1200);
            } catch (e) { btn.textContent = '✕ Failed'; setTimeout(function () { btn.textContent = orig; }, 1200); }
          });
        });
      });
      // Sidebar drawer toggle (mobile) with backdrop
      var asideToggle = document.getElementById('docs-aside-toggle');
      var aside = document.getElementById('docs-aside');
      var backdrop = document.getElementById('docs-aside-backdrop');
      function setAside(open) {
        aside.classList.toggle('open', open);
        if (backdrop) backdrop.classList.toggle('open', open);
        asideToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      }
      if (asideToggle && aside) {
        asideToggle.addEventListener('click', function () { setAside(!aside.classList.contains('open')); });
        aside.addEventListener('click', function (e) { if (e.target.tagName === 'A') setAside(false); });
        if (backdrop) backdrop.addEventListener('click', function () { setAside(false); });
        window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && aside.classList.contains('open')) setAside(false); });
      }
      // Filter
      var input = document.getElementById('docs-filter');
      if (input) input.addEventListener('input', function () {
        var q = input.value.trim().toLowerCase();
        document.querySelectorAll('.docs-aside .nav ul li').forEach(function (li) {
          var t = li.textContent.toLowerCase();
          li.style.display = t.indexOf(q) >= 0 ? '' : 'none';
        });
      });
      // Run demos as soon as bundle + babel are ready.
      if (window.RCS && window.Babel) runAll();
      else window.addEventListener('load', runAll);
    })();
  </script>`;

  return htmlShell({ title: `${name} — ${pkg.name}`, depth: 2, active: "components", body, head, tail });
}

function renderPlaygroundPage() {
  const buttonDemos = getDemos("Button");
  const DEFAULT_EXAMPLE = buttonDemos[0]?.code || `<Button>Click me</Button>`;
  const body = `<div class="pg-layout">
  <section class="pg-editor">
    <header class="pg-bar">
      <span class="pg-label">JSX expression</span>
      <span id="status" class="pg-status">—</span>
    </header>
    <textarea id="code" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
  </section>
  <section class="pg-preview">
    <header class="pg-bar">
      <span class="pg-label">Preview</span>
      <a href=".." class="pg-link">Back to docs ↗</a>
    </header>
    <div class="pg-preview-area" id="preview"></div>
  </section>
</div>
<style>
  body[data-page="playground"] { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  body[data-page="playground"] > .site-footer { display: none; }
  .pg-layout { flex: 1; display: grid; grid-template-columns: 1fr 1fr; min-height: 0; }
  @media (max-width: 880px) { .pg-layout { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } }
  .pg-editor, .pg-preview { display: flex; flex-direction: column; min-height: 0; background: var(--bg-1); }
  .pg-editor { border-right: 1px solid var(--border-1); }
  .pg-bar {
    padding: 10px 16px; border-bottom: 1px solid var(--border-1);
    display: flex; justify-content: space-between; align-items: center;
    font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--fg-3);
  }
  .pg-status.ok { color: var(--fg-3); }
  .pg-status.err { color: #FF5A5F; }
  .pg-link { color: var(--fg-3); text-decoration: none; }
  .pg-link:hover { color: var(--fg-1); opacity: 1; }
  textarea#code {
    flex: 1; width: 100%; box-sizing: border-box;
    background: var(--bg-0); color: var(--fg-1);
    border: none; padding: 16px 20px;
    font-family: var(--font-mono); font-size: 13px; line-height: 1.6;
    resize: none; outline: none; tab-size: 2;
  }
  .pg-preview-area { flex: 1; padding: 32px; overflow: auto; background: var(--bg-1); }
  .err { color: #FF5A5F; padding: 14px; font-family: var(--font-mono); font-size: 12px; background: var(--bg-2); border-radius: 4px; white-space: pre-wrap; }
</style>`;
  const head = `<link rel="stylesheet" href="../../dist/styles.css">`;
  const tail = `
  <script src="../bundle/rcs.iife.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>
  <script src="../runner.js"></script>
  <script>
    (function () {
      var ta = document.getElementById('code');
      var status = document.getElementById('status');
      var DEFAULT = ${JSON.stringify(DEFAULT_EXAMPLE)};
      var initial = new URLSearchParams(location.search).get('code');
      try { ta.value = initial ? decodeURIComponent(escape(atob(decodeURIComponent(initial)))) : DEFAULT; }
      catch (e) { ta.value = DEFAULT; }

      function run() {
        try {
          runExample(ta.value, 'preview');
          status.textContent = 'OK';
          status.className = 'pg-status ok';
        } catch (e) {
          status.textContent = 'ERROR';
          status.className = 'pg-status err';
        }
      }
      var t;
      ta.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          run();
          var enc = encodeURIComponent(btoa(unescape(encodeURIComponent(ta.value))));
          history.replaceState(null, '', '?code=' + enc);
        }, 250);
      });
      run();
    })();
  </script>`;
  return htmlShell({ title: `Playground — ${pkg.name}`, depth: 2, active: "playground", body, head, tail });
}

// ─── Foundations page (live design tokens) ───────────────────────────
// Reads tokens.ts and colors_and_type.css so the page mirrors the
// system 1:1; swatch background-colors are read via getComputedStyle
// so we never duplicate hex literals in the generator.
function renderFoundationsPage() {
  const tokenList = (...names) => names.map((n) => ({ name: n }));
  const brandReds = tokenList(
    "--brand-red-50",  "--brand-red-100", "--brand-red-200", "--brand-red-300", "--brand-red-400",
    "--brand-red-500", "--brand-red-600", "--brand-red-700", "--brand-red-800", "--brand-red-900",
  );
  const brandGrays = tokenList(
    "--brand-gray-50",  "--brand-gray-100", "--brand-gray-200", "--brand-gray-300", "--brand-gray-400",
    "--brand-gray-500", "--brand-gray-600", "--brand-gray-700", "--brand-gray-800", "--brand-gray-900",
  );
  const semantic = [
    { label: "accent",       css: "--accent" },
    { label: "accent-hover", css: "--accent-hover" },
    { label: "accent-press", css: "--accent-press" },
    { label: "accent-soft",  css: "--accent-soft" },
    { label: "accent-fg",    css: "--accent-fg" },
  ];
  const surfaces = [
    { label: "bg-0", css: "--bg-0" }, { label: "bg-1", css: "--bg-1" },
    { label: "bg-2", css: "--bg-2" }, { label: "bg-3", css: "--bg-3" },
    { label: "fg-1", css: "--fg-1" }, { label: "fg-2", css: "--fg-2" },
    { label: "fg-3", css: "--fg-3" }, { label: "fg-4", css: "--fg-4" },
    { label: "border-1", css: "--border-1" }, { label: "border-2", css: "--border-2" }, { label: "border-3", css: "--border-3" },
  ];
  const typeScale = [
    { label: "display", fs: "--fs-display", lh: "--lh-display", ls: "--ls-display", weight: 600, sample: "Strongly typed UI." },
    { label: "h1",      fs: "--fs-h1",      lh: "--lh-h1",      ls: "--ls-h1",      weight: 600, sample: "Component headline" },
    { label: "h2",      fs: "--fs-h2",      lh: "--lh-h2",      ls: "--ls-h2",      weight: 600, sample: "Section heading" },
    { label: "h3",      fs: "--fs-h3",      lh: "--lh-h3",      ls: "--ls-h3",      weight: 600, sample: "Subsection title" },
    { label: "h4",      fs: "--fs-h4",      lh: "--lh-h4",      ls: "--ls-h4",      weight: 600, sample: "Inline heading" },
    { label: "body",    fs: "--fs-body",    lh: "--lh-body",    ls: "--ls-body",    weight: 400, sample: "Body copy at the default reading scale — comfortable for sustained text." },
    { label: "small",   fs: "--fs-small",   lh: "--lh-small",   ls: "--ls-small",   weight: 400, sample: "Compact metadata, secondary captions, small footers." },
    { label: "micro",   fs: "--fs-micro",   lh: "--lh-micro",   ls: "--ls-micro",   weight: 500, sample: "MICRO LABEL · MONO · UPPERCASE", mono: true, upper: true },
    { label: "code",    fs: "--fs-code",    lh: "--lh-code",    ls: "0",            weight: 400, sample: "const cx = (...c) => c.filter(Boolean).join(' ')", mono: true },
  ];
  const fontFamilies = [
    { label: "display", css: "--font-display", sample: "Bricolage Grotesque" },
    { label: "sans",    css: "--font-sans",    sample: "The quick brown fox jumps over the lazy dog. 0123456789" },
    { label: "mono",    css: "--font-mono",    sample: "function ƒ(x: T): U { return x as unknown as U; }" },
  ];
  const spaces = [
    "--space-1", "--space-1\\.5", "--space-2", "--space-2\\.5", "--space-3", "--space-4",
    "--space-5", "--space-6", "--space-8", "--space-10", "--space-12", "--space-16", "--space-20", "--space-24",
  ];
  const radii = ["--radius-xs", "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-2xl", "--radius-full"];
  const shadows = ["--shadow-xs", "--shadow-sm", "--shadow-md", "--shadow-lg"];
  const motion = [
    { dur: "--dur-instant", ease: "--ease-out-quart", label: "instant · ease-out-quart" },
    { dur: "--dur-fast",    ease: "--ease-out-expo",  label: "fast · ease-out-expo" },
    { dur: "--dur-base",    ease: "--ease-in-out",    label: "base · ease-in-out" },
    { dur: "--dur-slow",    ease: "--ease-spring",    label: "slow · ease-spring" },
  ];

  const swatchGrid = (group) => `<div class="fnd-swatch-grid">${group.map((s) => {
    const css = s.css || s.name;
    return `<div class="fnd-swatch" data-css="${escapeHtml(css)}">
      <div class="fnd-swatch-chip" style="background:var(${css.replace(/\\\./g, ".")})"></div>
      <div class="fnd-swatch-meta">
        <code class="fnd-swatch-name">${escapeHtml(s.label || css.replace(/^--/, ""))}</code>
        <code class="fnd-swatch-hex" data-hex></code>
      </div>
    </div>`;
  }).join("")}</div>`;

  const typeRows = typeScale.map((t) => `<div class="fnd-type-row">
    <div class="fnd-type-meta">
      <code>${escapeHtml(t.label)}</code>
      <span class="fnd-type-meta-detail" data-fs="${t.fs}" data-lh="${t.lh}" data-ls="${t.ls}"></span>
    </div>
    <div class="fnd-type-sample" style="font-family: var(${t.mono ? "--font-mono" : (t.label === "display" ? "--font-display" : "--font-sans")}); font-size: var(${t.fs}); line-height: var(${t.lh}); letter-spacing: var(${t.ls}); font-weight: ${t.weight}; ${t.upper ? "text-transform:uppercase;" : ""}">${escapeHtml(t.sample)}</div>
  </div>`).join("");

  const fontRows = fontFamilies.map((f) => `<div class="fnd-font-row">
    <div class="fnd-type-meta"><code>${escapeHtml(f.label)}</code><span class="fnd-type-meta-detail" data-css="${f.css}"></span></div>
    <div class="fnd-font-sample" style="font-family: var(${f.css});">${escapeHtml(f.sample)}</div>
  </div>`).join("");

  const spaceRows = spaces.map((s) => {
    const escaped = s.replace(/\\\./g, ".");
    return `<div class="fnd-space-row">
      <code class="fnd-space-name">${escapeHtml(s.replace(/\\/g, ""))}</code>
      <div class="fnd-space-bar" style="width: var(${escaped});"></div>
      <code class="fnd-space-value" data-css="${escaped}"></code>
    </div>`;
  }).join("");

  const radiiRows = radii.map((r) => `<div class="fnd-radius-row">
    <div class="fnd-radius-box" style="border-radius: var(${r});"></div>
    <code>${escapeHtml(r.replace(/^--/, ""))}</code>
    <code class="fnd-radius-value" data-css="${r}"></code>
  </div>`).join("");

  const shadowRows = shadows.map((s) => `<div class="fnd-shadow-row">
    <div class="fnd-shadow-box" style="box-shadow: var(${s});"></div>
    <code>${escapeHtml(s.replace(/^--/, ""))}</code>
  </div>`).join("");

  const motionRows = motion.map((m, i) => `<div class="fnd-motion-row">
    <div class="fnd-motion-box" data-dur="${m.dur}" data-ease="${m.ease}" data-i="${i}"></div>
    <code>${escapeHtml(m.label)}</code>
    <button type="button" class="demo-action fnd-motion-trigger" data-i="${i}">▷ Replay</button>
  </div>`).join("");

  const tokenAliasRows = tokenTypeAliases.map((t) => `<tr>
    <td><code>${escapeHtml(t.name)}</code></td>
    <td><code>${escapeHtml(t.value.length > 96 ? t.value.slice(0, 93) + "…" : t.value)}</code></td>
  </tr>`).join("");

  const body = `<main class="page-wrap fnd-page">
  <p class="eyebrow">Foundations</p>
  <h1 class="page-h1">Design tokens.</h1>
  <p class="lede">
    Every token in the system, read live from <code>colors_and_type.css</code> via CSS custom properties.
    Hex values resolve at runtime, so what you see here matches what your app gets when you import
    <code>${escapeHtml(pkg.name)}/styles.css</code>. Switch the global theme toggle to see surface tokens flip.
  </p>

  <section class="fnd-section">
    <h2 class="fnd-h2">Color · Brand red</h2>
    <p class="fnd-blurb">Signal Red is the only accent. The full red ramp is reserved for charts and edge cases — production UI should reach for <code>--accent</code>, <code>--accent-hover</code>, <code>--accent-press</code>, <code>--accent-soft</code>.</p>
    ${swatchGrid(brandReds)}
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Color · Brand gray</h2>
    <p class="fnd-blurb">Cod Gray ramp drives every neutral surface and ink shade. Pulls from <code>--bg-*</code> and <code>--fg-*</code> at runtime.</p>
    ${swatchGrid(brandGrays)}
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Accent · semantic</h2>
    <p class="fnd-blurb">Action color, hover/press states, and the soft tint behind selected items.</p>
    ${swatchGrid(semantic)}
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Surface &amp; ink</h2>
    <p class="fnd-blurb">Theme-aware tokens — these flip when <code>data-theme</code> swaps. The chips below resolve through <code>:root</code>, <code>[data-theme="light"]</code>, and <code>[data-theme="dark"]</code> blocks.</p>
    ${swatchGrid(surfaces)}
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Typography · families</h2>
    <p class="fnd-blurb">Three families. Display for impact, sans for body, mono for code &amp; micro labels.</p>
    ${fontRows}
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Typography · scale</h2>
    <p class="fnd-blurb">Each row uses its corresponding <code>--fs-*</code> + <code>--lh-*</code> + <code>--ls-*</code> custom properties.</p>
    ${typeRows}
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Spacing</h2>
    <p class="fnd-blurb">A 4px-stepped scale plus half-steps where the grain of an interface needs them. Bars below render at the literal pixel value.</p>
    <div class="fnd-space-list">${spaceRows}</div>
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Radii</h2>
    <p class="fnd-blurb">Tight by default. <code>radius-sm</code> (4px) is the system default — Linear-style.</p>
    <div class="fnd-radius-grid">${radiiRows}</div>
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Shadows</h2>
    <p class="fnd-blurb">Two-layer shadows for depth without haze. Darker, smaller layer for the edge; broader, softer layer for the diffuse halo.</p>
    <div class="fnd-shadow-grid">${shadowRows}</div>
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">Motion</h2>
    <p class="fnd-blurb">Each box loops through translate + opacity using its labeled duration and easing. Click ▷ Replay to trigger.</p>
    <div class="fnd-motion-list">${motionRows}</div>
  </section>

  <section class="fnd-section">
    <h2 class="fnd-h2">TypeScript types</h2>
    <p class="fnd-blurb">Imported from <code>${escapeHtml(pkg.name)}/tokens</code>. Use these to constrain props at compile time.</p>
    <table class="props"><thead><tr><th>Type</th><th>Value</th></tr></thead><tbody>${tokenAliasRows}</tbody></table>
  </section>
</main>
<style>
  .fnd-page { max-width: 1080px; }
  .fnd-section { margin: 0 0 56px; }
  .fnd-h2 { font-size: 22px; font-weight: 600; letter-spacing: -0.014em; margin: 0 0 6px; font-family: var(--font-sans); color: var(--fg-1); }
  .fnd-blurb { color: var(--fg-2); font-size: 13.5px; line-height: 1.55; margin: 0 0 18px; max-width: 64ch; }

  /* Swatch grid */
  .fnd-swatch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1px; background: var(--border-1); border: 1px solid var(--border-1); border-radius: 4px; overflow: hidden; }
  .fnd-swatch { background: var(--bg-1); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
  .fnd-swatch-chip { width: 100%; height: 56px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(28,28,28,0.08); }
  .fnd-swatch-meta { display: flex; flex-direction: column; gap: 2px; }
  .fnd-swatch-name { font-family: var(--font-mono); font-size: 11px; color: var(--fg-1); }
  .fnd-swatch-hex { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); letter-spacing: 0.04em; min-height: 14px; }

  /* Type rows */
  .fnd-type-row, .fnd-font-row { display: grid; grid-template-columns: 160px 1fr; gap: 24px; padding: 14px 0; border-bottom: 1px solid var(--border-1); align-items: baseline; }
  .fnd-type-row:last-child, .fnd-font-row:last-child { border-bottom: none; }
  .fnd-type-meta { display: flex; flex-direction: column; gap: 4px; }
  .fnd-type-meta code { font-family: var(--font-mono); font-size: 11px; color: var(--fg-1); }
  .fnd-type-meta-detail { font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3); letter-spacing: 0.04em; }
  .fnd-type-sample { color: var(--fg-1); }
  .fnd-font-sample { color: var(--fg-1); font-size: 18px; line-height: 1.55; }
  @media (max-width: 720px) {
    .fnd-type-row, .fnd-font-row { grid-template-columns: 1fr; gap: 8px; }
    .fnd-font-sample { font-size: 15px; }
  }

  /* Spacing scale */
  .fnd-space-list { display: flex; flex-direction: column; gap: 4px; }
  .fnd-space-row { display: grid; grid-template-columns: 80px 1fr 60px; gap: 16px; align-items: center; padding: 6px 0; }
  .fnd-space-name { font-family: var(--font-mono); font-size: 11px; color: var(--fg-2); }
  .fnd-space-bar { height: 18px; background: var(--accent); border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05); }
  .fnd-space-value { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); text-align: right; }

  /* Radii */
  .fnd-radius-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
  .fnd-radius-row { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 12px; border: 1px solid var(--border-1); border-radius: 4px; background: var(--bg-1); }
  .fnd-radius-box { width: 100%; height: 64px; background: var(--bg-2); border: 1px solid var(--border-2); }
  .fnd-radius-row code { font-family: var(--font-mono); font-size: 11px; color: var(--fg-2); }
  .fnd-radius-value { color: var(--fg-3) !important; }

  /* Shadows */
  .fnd-shadow-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 24px; padding: 16px 0; }
  .fnd-shadow-row { display: flex; flex-direction: column; gap: 12px; align-items: center; padding: 24px 0 12px; }
  .fnd-shadow-box { width: 80%; height: 64px; background: var(--bg-1); border-radius: 4px; }
  .fnd-shadow-row code { font-family: var(--font-mono); font-size: 11px; color: var(--fg-2); }

  /* Motion */
  .fnd-motion-list { display: flex; flex-direction: column; gap: 10px; }
  .fnd-motion-row { display: grid; grid-template-columns: 60px 1fr 100px; gap: 16px; align-items: center; padding: 12px 16px; border: 1px solid var(--border-1); border-radius: 4px; background: var(--bg-1); }
  .fnd-motion-box {
    width: 32px; height: 32px; background: var(--accent); border-radius: 4px;
    transform: translateX(0); opacity: 1;
  }
  .fnd-motion-box.run { animation: fnd-motion-run var(--dur, 220ms) var(--ease, ease) forwards; }
  @keyframes fnd-motion-run {
    0% { transform: translateX(0); opacity: 0.3; }
    50% { transform: translateX(180px); opacity: 1; }
    100% { transform: translateX(0); opacity: 0.3; }
  }
  .fnd-motion-row code { font-family: var(--font-mono); font-size: 11px; color: var(--fg-2); }
  .fnd-motion-trigger { width: 100%; }

  table.props { margin: 0; }
</style>`;

  const head = `<link rel="stylesheet" href="../../dist/styles.css">
  <link rel="stylesheet" href="../docs.css">`;

  const tail = `<script>
  (function () {
    var root = document.documentElement;
    function refresh() {
      var cs = getComputedStyle(root);
      // Swatch hex values
      document.querySelectorAll('.fnd-swatch').forEach(function (el) {
        var css = el.getAttribute('data-css');
        var v = cs.getPropertyValue(css.replace(/\\\\./g, '.')).trim();
        var hex = el.querySelector('[data-hex]');
        if (hex) hex.textContent = v;
      });
      // Type meta text
      document.querySelectorAll('.fnd-type-meta-detail').forEach(function (el) {
        if (el.dataset.fs) {
          var fs = cs.getPropertyValue(el.dataset.fs).trim();
          var lh = cs.getPropertyValue(el.dataset.lh).trim();
          var ls = cs.getPropertyValue(el.dataset.ls).trim();
          el.textContent = fs + ' / ' + lh + (ls && ls !== '0' ? ' / ' + ls : '');
        } else if (el.dataset.css) {
          var fam = cs.getPropertyValue(el.dataset.css).trim();
          var primary = fam.split(',')[0].replace(/['"]/g, '').trim();
          el.textContent = primary;
        }
      });
      // Space values
      document.querySelectorAll('.fnd-space-value').forEach(function (el) {
        var v = cs.getPropertyValue(el.getAttribute('data-css')).trim();
        el.textContent = v;
      });
      // Radius values
      document.querySelectorAll('.fnd-radius-value').forEach(function (el) {
        var v = cs.getPropertyValue(el.getAttribute('data-css')).trim();
        el.textContent = v;
      });
    }
    refresh();
    // Re-resolve on theme switch
    var obs = new MutationObserver(refresh);
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // Motion replay buttons
    function play(el) {
      var dur = getComputedStyle(root).getPropertyValue(el.dataset.dur).trim();
      var ease = getComputedStyle(root).getPropertyValue(el.dataset.ease).trim();
      el.style.setProperty('--dur', dur);
      el.style.setProperty('--ease', ease);
      el.classList.remove('run');
      void el.offsetWidth; // restart animation
      el.classList.add('run');
    }
    document.querySelectorAll('.fnd-motion-box').forEach(play);
    document.querySelectorAll('.fnd-motion-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var box = document.querySelector('.fnd-motion-box[data-i="' + btn.dataset.i + '"]');
        if (box) play(box);
      });
    });
  })();
</script>`;

  return htmlShell({ title: `Foundations — ${pkg.name}`, depth: 2, active: "components", body, head, tail });
}

// ─── 9. Write all output files ────────────────────────────────────────
mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, "dist"), { recursive: true });
mkdirSync(join(outDir, "apps"), { recursive: true });
mkdirSync(join(outDir, "docs"), { recursive: true });
mkdirSync(join(outDir, "docs/playground"), { recursive: true });
mkdirSync(join(outDir, "docs/foundations"), { recursive: true });

writeFileSync(join(outDir, "site.css"), renderSiteCss());
writeFileSync(join(outDir, "dist/styles.css"), colorsAndTypeCss + "\n" + componentStylesCss);

writeFileSync(join(outDir, "index.html"), renderRootIndex());
writeFileSync(join(outDir, "apps/index.html"), renderAppsIndex());

writeFileSync(join(outDir, "docs/index.html"), renderDocsIndex());
writeFileSync(join(outDir, "docs/docs.css"), renderDocsCss());
writeFileSync(join(outDir, "docs/runner.js"), renderRunner());
writeFileSync(join(outDir, "docs/playground/index.html"), renderPlaygroundPage());
writeFileSync(join(outDir, "docs/foundations/index.html"), renderFoundationsPage());

let count = 0;
for (const name of ALL_NAMES) {
  const dir = join(outDir, "docs", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), renderComponentPage(name));
  count++;
}

console.log(`Wrote site to ${outDir}`);
console.log(`  ${count} component pages (${runtimeExports.size} core + ${chartExports.size} charts), 1 foundations, 1 docs index, 1 playground, 1 apps index, 1 root`);
console.log(`  ${runtimeExports.size + chartExports.size} runtime exports across ${DOCS_CATEGORIES.filter((c) => exportsByCategory.get(c.id).length > 0).length} docs categories`);
console.log(`  ${tokenTypeAliases.length} tokens, ${interfaces.length} interfaces, ${componentTypeAliases.length} type aliases`);
