#!/usr/bin/env node
/**
 * Generate `llms.txt` and `llms-full.txt` for the design system.
 *
 *   node scripts/build-llms.mjs <outDir>
 *
 * Spec: https://llmstxt.org — concise machine-readable index of project
 * docs, intended to land on its own URL so AI agents can fetch it
 * directly. We produce two files:
 *
 *   <outDir>/llms.txt        Concise: import line, component list,
 *                            categories, link to the full reference.
 *   <outDir>/llms-full.txt   Exhaustive: every component with its
 *                            prop signature and one canonical example.
 *
 * Source of truth is the same as build-docs.mjs:
 *   src/components.ts    → prop interfaces
 *   src/tokens.ts        → token unions
 *   src/index.tsx        → runtime exports → category file
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { extractInterfaces, extractTypeAliases, parseRuntimeExports, parseChartsExports } from "./parse-source.mjs";
import { generateDemos } from "./component-examples.mjs";

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
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const SITE_BASE = "https://randomcodespace.github.io/design-system";
const PKG_NPM = pkg.name; // @ossrandom/design-system
const PKG_GHP = "@randomcodespace/design-system";

const runtimeExports = parseRuntimeExports(indexTsx);
const chartExports = parseChartsExports(chartsIndexTs);
const interfaces = extractInterfaces(componentsDts);
const componentTypeAliases = extractTypeAliases(componentsDts);
const tokenTypeAliases = extractTypeAliases(tokensTs);
const interfaceByName = new Map(interfaces.map((i) => [i.name, i]));
const TYPE_ALIASES = new Map([
  ...componentTypeAliases.map((a) => [a.name, a.value]),
  ...tokenTypeAliases.map((a) => [a.name, a.value]),
]);

const HOOKS = new Set(["useTheme"]);
const CATEGORIES = [
  { id: "theme",      label: "Theme",             srcFiles: ["theme"] },
  { id: "layout",     label: "Layout",            srcFiles: ["layout", "page"] },
  { id: "actions",    label: "Buttons & actions", srcFiles: ["buttons"] },
  { id: "forms",      label: "Forms & inputs",    srcFiles: ["inputs", "selects", "form-controls"] },
  { id: "data",       label: "Data display",      srcFiles: ["data-display", "badges"] },
  { id: "navigation", label: "Navigation",        srcFiles: ["navigation"] },
  { id: "feedback",   label: "Feedback",          srcFiles: ["feedback"] },
  { id: "content",    label: "Content",           srcFiles: ["code", "chat"] },
  { id: "charts",     label: "Charts (subpath)",  charts: true },
];

// Chart peer-deps surface in llms-full so AI agents know what to install.
const CHART_PEER_DEPS = {
  Chart:       ["uplot (canvas, default)", "@deck.gl/core + @deck.gl/layers (webgl/webgpu)"],
  Sparkline:   [],
  Donut:       [],
  RadialGauge: [],
  UptimeBar:   [],
  Treemap:     ["d3-hierarchy"],
  ServiceMap:  ["cytoscape + cytoscape-cose-bilkent (canvas)", "@deck.gl/core + @deck.gl/layers + d3-force (webgl)"],
};

function isChart(name) { return chartExports.has(name); }
function categoryForExport(name) {
  if (isChart(name)) return CATEGORIES.find((c) => c.id === "charts");
  const f = runtimeExports.get(name);
  return f ? CATEGORIES.find((c) => !c.charts && c.srcFiles?.includes(f)) : null;
}

const exportsByCategory = new Map(CATEGORIES.map((c) => [c.id, []]));
for (const [name] of runtimeExports) {
  const cat = categoryForExport(name);
  if (cat) exportsByCategory.get(cat.id).push(name);
}
for (const [name] of chartExports) {
  exportsByCategory.get("charts").push(name);
}

function findPropsFor(name) {
  return interfaceByName.get(name + "Props") || null;
}

// ─── llms.txt — concise per spec ──────────────────────────────────────
function renderLlmsTxt() {
  const total = runtimeExports.size + chartExports.size;
  const cats = CATEGORIES.filter((c) => exportsByCategory.get(c.id).length > 0);

  let out = "";
  out += `# RandomCodeSpace Design System\n\n`;
  out += `> Strongly-typed React component library — ${total} components across ${cats.length} categories `;
  out += `(${runtimeExports.size} core + ${chartExports.size} charts). `;
  out += `Bricolage Grotesque on Cod Gray, Signal Red accent, single CSS file, zero core runtime deps. `;
  out += `Built for self-hosted developer tooling.\n\n`;

  out += `## Install\n\n`;
  out += `\`\`\`bash\n`;
  out += `npm install ${PKG_NPM}\n`;
  out += `# or, from GitHub Packages mirror (different scope):\n`;
  out += `npm install ${PKG_GHP}\n`;
  out += `\`\`\`\n\n`;
  out += `Charts ship at the \`${PKG_NPM}/charts\` subpath and pull heavier peer deps `;
  out += `(\`uplot\`, \`d3-hierarchy\`, \`cytoscape\`, \`@deck.gl/core\` + \`@deck.gl/layers\`). `;
  out += `Install only the ones the charts you render require — see the Charts section below.\n\n`;

  out += `## Usage\n\n`;
  out += `\`\`\`tsx\n`;
  out += `import { ThemeProvider, Button, toast } from "${PKG_NPM}";\n`;
  out += `import { Chart, ServiceMap } from "${PKG_NPM}/charts";\n`;
  out += `import "${PKG_NPM}/styles.css";\n\n`;
  out += `<ThemeProvider mode="light">\n`;
  out += `  <Button onClick={() => toast.show({ title: "Saved" })}>Save</Button>\n`;
  out += `</ThemeProvider>\n`;
  out += `\`\`\`\n\n`;

  out += `## Components\n\n`;
  for (const cat of cats) {
    const items = exportsByCategory.get(cat.id);
    out += `### ${cat.label}\n\n`;
    if (cat.charts) {
      out += `Subpath: \`${PKG_NPM}/charts\`\n\n`;
    }
    for (const name of items) {
      const iface = findPropsFor(name);
      const isHook = HOOKS.has(name);
      const generics = iface?.generics || "";
      const propCount = iface ? iface.props.length : 0;
      const meta = isHook
        ? "hook"
        : `${propCount} prop${propCount === 1 ? "" : "s"}`;
      out += `- [${name}${generics}](${SITE_BASE}/docs/${name}/) — ${meta}\n`;
    }
    out += "\n";
  }

  out += `## Tokens\n\n`;
  out += `Strongly-typed unions exposed as TypeScript types and CSS custom properties:\n\n`;
  for (const t of tokenTypeAliases) {
    const truncated = t.value.length > 80 ? t.value.slice(0, 77) + "…" : t.value;
    out += `- \`${t.name}\` = ${truncated}\n`;
  }
  out += "\n";

  out += `## Optional\n\n`;
  out += `- [Full API reference (every prop signature + example)](${SITE_BASE}/llms-full.txt)\n`;
  out += `- [Live docs with previews](${SITE_BASE}/docs/)\n`;
  out += `- [Playground](${SITE_BASE}/docs/playground/)\n`;
  out += `- [Source code](https://github.com/RandomCodeSpace/design-system)\n`;

  return out;
}

// ─── llms-full.txt — exhaustive ───────────────────────────────────────
function renderLlmsFullTxt() {
  let out = "";
  out += `# RandomCodeSpace Design System — Full reference\n\n`;
  out += `> Every component with its prop signature and one canonical example. `;
  out += `Auto-generated from src/components.ts on every Pages build.\n\n`;
  out += `Package: \`${PKG_NPM}\` (npm) · \`${PKG_GHP}\` (GitHub Packages)\n`;
  out += `Live docs: ${SITE_BASE}/docs/\n\n`;

  out += `## Boilerplate\n\n`;
  out += `\`\`\`tsx\n`;
  out += `import { ThemeProvider, ToastRegion } from "${PKG_NPM}";\n`;
  out += `import "${PKG_NPM}/styles.css";\n\n`;
  out += `function App() {\n`;
  out += `  return (\n`;
  out += `    <ThemeProvider mode="light">\n`;
  out += `      {/* your UI */}\n`;
  out += `      <ToastRegion />\n`;
  out += `    </ThemeProvider>\n`;
  out += `  );\n`;
  out += `}\n`;
  out += `\`\`\`\n\n`;

  out += `## Tokens\n\n`;
  for (const t of tokenTypeAliases) {
    out += `- **${t.name}** = ${t.value}\n`;
  }
  out += "\n";

  for (const cat of CATEGORIES) {
    const items = exportsByCategory.get(cat.id);
    if (!items.length) continue;
    out += `## ${cat.label}\n\n`;
    for (const name of items) {
      out += renderComponent(name);
    }
  }

  return out;
}

function renderComponent(name) {
  const iface = findPropsFor(name);
  const isHook = HOOKS.has(name);
  const chart = isChart(name);
  const srcPath = chart
    ? `src/charts/${chartExports.get(name)}.tsx`
    : `src/components/${runtimeExports.get(name)}.tsx`;
  const importPath = chart ? `${PKG_NPM}/charts` : PKG_NPM;
  let out = "";
  out += `### ${name}${iface?.generics || ""}\n`;
  out += `Source: \`${srcPath}\` · ${isHook ? "hook" : "component"}\n`;
  out += `Import: \`import { ${name} } from "${importPath}";\`\n`;
  if (chart) {
    const deps = CHART_PEER_DEPS[name] || [];
    if (deps.length === 0) {
      out += `Peer deps: none (zero-dep render path)\n`;
    } else {
      out += `Peer deps (install on demand): ${deps.map((d) => `\`${d}\``).join(", ")}\n`;
    }
  }
  out += `\n`;

  if (iface) {
    if (iface.extends) {
      out += `Extends: \`${iface.extends}\`\n\n`;
    }
    if (iface.props.length === 0) {
      out += `No props.\n\n`;
    } else {
      out += `Props:\n\n`;
      for (const p of iface.props) {
        const req = p.optional ? "" : " (required)";
        out += `- \`${p.name}${p.optional ? "?" : ""}: ${p.type}\`${req}\n`;
      }
      out += "\n";
    }
  } else if (isHook) {
    out += `Returns the current theme context: \`{ mode, setMode, toggle }\`.\n\n`;
  }

  // Canonical example via the same generator the docs use.
  const demos = generateDemos(name, iface, { typeAliases: TYPE_ALIASES });
  if (demos.length > 0) {
    out += `Example:\n\n`;
    out += "```tsx\n";
    out += demos[0].code + "\n";
    out += "```\n\n";
  }

  out += `Docs: ${SITE_BASE}/docs/${name}/\n\n`;
  return out;
}

const llmsTxt = renderLlmsTxt();
const llmsFull = renderLlmsFullTxt();
writeFileSync(join(outDir, "llms.txt"), llmsTxt);
writeFileSync(join(outDir, "llms-full.txt"), llmsFull);
console.log(`build-llms ✓ ${outDir}/llms.txt (${llmsTxt.length}b), llms-full.txt (${llmsFull.length}b)`);
