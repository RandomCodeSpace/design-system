#!/usr/bin/env node
/**
 * Auto-generate the component documentation page.
 *
 *   node scripts/build-docs.mjs <outDir>
 *
 * Parses three files:
 *   - src/index.tsx      — runtime export → category file map
 *   - src/components.d.ts — interfaces (incl. generic params + heritage) + supporting types
 *   - src/tokens.ts      — token type unions
 *
 * Emits a single self-contained HTML page at <outDir>/index.html with
 * a sidebar nav, sections per category, and prop tables per component.
 *
 * Pure Node built-ins. Regex-based; depends on the well-formatted
 * hand-written shape of components.d.ts. Re-validate after substantial
 * structural edits to that file.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const outDir = resolve(root, process.argv[2] || "_site/docs");
mkdirSync(outDir, { recursive: true });

const componentsDts = readFileSync(join(root, "src/components.d.ts"), "utf8");
const tokensTs = readFileSync(join(root, "src/tokens.ts"), "utf8");
const indexTsx = readFileSync(join(root, "src/index.tsx"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

// ─── 1. Runtime exports → category ────────────────────────────────────
const runtimeExports = new Map(); // exportName → categoryFile
const exportRe = /export\s*\{\s*([\s\S]+?)\s*\}\s*from\s*"\.\/components\/([^"]+)"/g;
let m;
while ((m = exportRe.exec(indexTsx))) {
  const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  for (const name of names) runtimeExports.set(name, m[2]);
}

const CATEGORY_LABEL = {
  buttons: "Buttons",
  inputs: "Inputs",
  selects: "Selects",
  "form-controls": "Form controls",
  badges: "Badges",
  layout: "Layout",
  navigation: "Navigation",
  feedback: "Feedback",
  "data-display": "Data display",
  chat: "Chat",
  code: "Code",
  page: "Page",
  theme: "Theme",
};

// ─── 2. Walk components.d.ts → interfaces, type aliases ───────────────
function tokenizeStatementsAtTopLevel(src) {
  // Yield text segments split on top-level `;` outside <>, (), {}, [], and strings.
  const out = [];
  let depth = 0, buf = "", inStr = null, lineComment = false, blockComment = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (lineComment) { buf += c; if (c === "\n") lineComment = false; continue; }
    if (blockComment) { buf += c; if (c === "*" && n === "/") { buf += "/"; i++; blockComment = false; } continue; }
    if (inStr) { buf += c; if (c === inStr && src[i - 1] !== "\\") inStr = null; continue; }
    if (c === "/" && n === "/") { lineComment = true; buf += c; continue; }
    if (c === "/" && n === "*") { blockComment = true; buf += c; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; buf += c; continue; }
    if ("<({[".includes(c)) depth++;
    else if (">)}]".includes(c)) depth--;
    if (c === ";" && depth === 0) {
      out.push(buf.trim());
      buf = "";
    } else {
      buf += c;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").trim();
}

// Find `export interface NAME[<GEN>] [extends BASES] { ... }` blocks.
function extractInterfaces(src) {
  const interfaces = [];
  const re = /export\s+interface\s+(\w+)(\s*<[^{>]*(?:>[^{]*)*>)?\s*(?:extends\s+([^{]+?))?\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const start = re.lastIndex;
    let depth = 1, i = start;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      i++;
    }
    const body = src.slice(start, i - 1);
    interfaces.push({
      name: m[1],
      generics: (m[2] || "").trim(),
      extends: (m[3] || "").trim(),
      body,
      props: parseInterfaceMembers(body),
    });
    re.lastIndex = i;
  }
  return interfaces;
}

function parseInterfaceMembers(body) {
  const stmts = tokenizeStatementsAtTopLevel(body);
  const props = [];
  for (const raw of stmts) {
    const stmt = stripComments(raw);
    if (!stmt) continue;
    const m = stmt.match(/^(readonly\s+)?(\[[^\]]+\]|"[^"]+"|'[^']+'|\w+)(\?)?\s*:\s*([\s\S]+)$/);
    if (!m) continue;
    let name = m[2];
    if (name.startsWith('"') || name.startsWith("'")) name = name.slice(1, -1);
    props.push({
      readonly: !!m[1],
      name,
      optional: !!m[3],
      type: m[4].trim().replace(/\s+/g, " "),
    });
  }
  return props;
}

function extractTypeAliases(src) {
  const out = [];
  const re = /export\s+type\s+(\w+)(\s*<[^=]*>)?\s*=\s*([\s\S]+?);/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({
      name: m[1],
      generics: (m[2] || "").trim(),
      value: m[3].trim().replace(/\s+/g, " "),
    });
  }
  return out;
}

const interfaces = extractInterfaces(componentsDts);
const componentTypeAliases = extractTypeAliases(componentsDts);
const tokenTypeAliases = extractTypeAliases(tokensTs);

const interfaceByName = new Map(interfaces.map((i) => [i.name, i]));

// ─── 3. Group runtime exports by category ─────────────────────────────
const grouped = new Map();
for (const [name, cat] of runtimeExports) {
  if (!grouped.has(cat)) grouped.set(cat, []);
  grouped.get(cat).push(name);
}

// Special: `useTheme` is a hook, not a component. Mark it.
const HOOKS = new Set(["useTheme", "toast"]);

// Map runtime export → its props interface (heuristic: exportName + "Props")
function findPropsFor(exportName) {
  return interfaceByName.get(exportName + "Props") || null;
}

// ─── 4. Render HTML ───────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function code(s) {
  return `<code>${escapeHtml(s)}</code>`;
}

function renderToken(t) {
  return `
    <article class="type" id="token-${t.name}">
      <header><span class="kind">type</span><h3>${escapeHtml(t.name)}${escapeHtml(t.generics)}</h3></header>
      <pre><code>= ${escapeHtml(t.value)}</code></pre>
    </article>
  `;
}

function renderPropsTable(iface) {
  if (!iface || iface.props.length === 0) {
    return '<p class="empty">No props.</p>';
  }
  const rows = iface.props
    .map(
      (p) => `
      <tr>
        <td><code>${escapeHtml(p.name)}</code>${p.optional ? "" : ' <span class="req">required</span>'}</td>
        <td><code>${escapeHtml(p.type)}</code></td>
      </tr>`
    )
    .join("");
  return `
    <table class="props">
      <thead><tr><th>Prop</th><th>Type</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderInheritance(iface) {
  if (!iface || !iface.extends) return "";
  return `<p class="inherits">extends ${code(iface.extends)}</p>`;
}

function renderComponent(name, categoryFile) {
  const isHook = HOOKS.has(name);
  const iface = findPropsFor(name);
  const generics = iface?.generics || "";
  const importLine = `import { ${name} } from "${pkg.name}";`;
  return `
    <article class="component" id="${name}">
      <header>
        <span class="kind">${isHook ? "hook" : "component"}</span>
        <h3>${escapeHtml(name)}${escapeHtml(generics)}</h3>
        <span class="src">src/components/${categoryFile}.tsx</span>
      </header>
      <pre class="import"><code>${escapeHtml(importLine)}</code></pre>
      ${renderInheritance(iface)}
      ${isHook ? "" : renderPropsTable(iface)}
    </article>
  `;
}

const sidebarOrder = [
  "buttons", "inputs", "selects", "form-controls", "badges",
  "layout", "navigation", "feedback", "data-display",
  "chat", "code", "page", "theme",
];

const categoryHtml = sidebarOrder
  .filter((cat) => grouped.has(cat))
  .map((cat) => {
    const exports = grouped.get(cat);
    return `
    <section class="category" id="cat-${cat}">
      <h2>${escapeHtml(CATEGORY_LABEL[cat] || cat)}</h2>
      <p class="src">src/components/${cat}.tsx</p>
      ${exports.map((n) => renderComponent(n, cat)).join("")}
    </section>
  `;
  })
  .join("");

const tokensHtml = `
  <section class="category" id="cat-tokens">
    <h2>Tokens</h2>
    <p class="src">src/tokens.ts</p>
    ${tokenTypeAliases.map(renderToken).join("")}
  </section>
`;

// Supporting types from components.d.ts that aren't `*Props` interfaces
const supportingInterfaces = interfaces.filter((i) => !i.name.endsWith("Props") && i.name !== "BaseProps");

function renderSupportingInterface(iface) {
  return `
    <article class="component support" id="type-${iface.name}">
      <header><span class="kind">interface</span><h3>${escapeHtml(iface.name)}${escapeHtml(iface.generics)}</h3></header>
      ${renderInheritance(iface)}
      ${renderPropsTable(iface)}
    </article>
  `;
}

const supportingHtml = `
  <section class="category" id="cat-types">
    <h2>Supporting types</h2>
    <p class="src">src/components.d.ts</p>
    <article class="component" id="type-BaseProps">
      <header><span class="kind">interface</span><h3>BaseProps</h3></header>
      <p class="muted">Every component prop interface extends <code>BaseProps</code>.</p>
      ${renderPropsTable(interfaceByName.get("BaseProps"))}
    </article>
    ${componentTypeAliases.map(renderToken).join("")}
    ${supportingInterfaces.map(renderSupportingInterface).join("")}
  </section>
`;

const sidebarLinks = [
  `<li><a href="#cat-tokens">Tokens</a><ul>${tokenTypeAliases.map((t) => `<li><a href="#token-${t.name}">${escapeHtml(t.name)}</a></li>`).join("")}</ul></li>`,
  ...sidebarOrder
    .filter((cat) => grouped.has(cat))
    .map((cat) => {
      const exports = grouped.get(cat);
      return `<li><a href="#cat-${cat}">${escapeHtml(CATEGORY_LABEL[cat] || cat)}</a><ul>${exports.map((n) => `<li><a href="#${n}">${escapeHtml(n)}</a></li>`).join("")}</ul></li>`;
    }),
  `<li><a href="#cat-types">Supporting types</a></li>`,
].join("");

const counts = {
  components: [...runtimeExports.entries()].filter(([n]) => !HOOKS.has(n)).length,
  hooks: [...runtimeExports.entries()].filter(([n]) => HOOKS.has(n)).length,
  tokens: tokenTypeAliases.length,
  interfaces: interfaces.length,
};

const html = `<!doctype html>
<html data-theme="dark" lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(pkg.name)} — components</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="../colors_and_type.css">
  <style>
    body { margin: 0; background: var(--bg-0); color: var(--fg-1); font-family: var(--font-sans); }
    .layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 100vh; }
    @media (max-width: 880px) { .layout { grid-template-columns: 1fr; } aside { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border-1); } }

    aside {
      position: sticky; top: 0; height: 100vh; overflow-y: auto;
      border-right: 1px solid var(--border-1); padding: 32px 20px 64px;
      font-size: 13px;
    }
    aside .head { padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--border-1); }
    aside .head .name { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg-3); }
    aside .head .stats { color: var(--fg-3); font-size: 12px; margin-top: 6px; }
    aside .back { display: block; margin-bottom: 18px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--fg-3); text-decoration: none; }
    aside .back:hover { color: var(--fg-1); }
    aside ul { list-style: none; margin: 0; padding: 0; }
    aside > ul > li { margin-bottom: 14px; }
    aside > ul > li > a {
      display: block;
      font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--fg-2); text-decoration: none; padding: 4px 0; font-weight: 500;
    }
    aside > ul > li > a:hover { color: var(--fg-1); }
    aside ul ul { margin: 4px 0 0 0; padding-left: 0; }
    aside ul ul li a {
      display: block; padding: 3px 0 3px 12px;
      color: var(--fg-3); text-decoration: none; font-size: 12.5px;
      border-left: 1px solid var(--border-1);
    }
    aside ul ul li a:hover { color: var(--accent); border-left-color: var(--accent); }

    main { padding: 56px 56px 96px; max-width: 980px; }
    @media (max-width: 880px) { main { padding: 32px 20px 64px; } }

    .hero .eyebrow {
      font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--fg-3); margin: 0 0 12px; display: inline-flex; align-items: center; gap: 10px;
    }
    .hero .eyebrow::before { content: ""; width: 20px; height: 1px; background: var(--border-2); }
    .hero h1 { font-size: 44px; font-weight: 600; letter-spacing: -0.028em; margin: 0 0 16px; line-height: 1.06; }
    .hero p { color: var(--fg-2); font-size: 15px; line-height: 1.55; margin: 0 0 8px; max-width: 60ch; }
    .hero .install { background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 4px; padding: 14px 16px; margin: 24px 0 56px; }
    .hero .install code { font-family: var(--font-mono); font-size: 13px; color: var(--fg-1); }

    .category { margin: 64px 0 0; }
    .category > h2 {
      font-size: 22px; font-weight: 600; letter-spacing: -0.014em; margin: 0 0 4px;
      padding-bottom: 12px; border-bottom: 1px solid var(--border-2);
    }
    .category > p.src { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); letter-spacing: 0.04em; margin: 0 0 24px; }

    .component, .type {
      margin: 0 0 28px; border: 1px solid var(--border-1); border-radius: 4px; background: var(--bg-1);
      overflow: hidden;
    }
    .component header, .type header {
      display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
      padding: 14px 18px; background: var(--bg-2); border-bottom: 1px solid var(--border-1);
    }
    .component header .kind, .type header .kind {
      font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--fg-3); padding: 2px 6px; border: 1px solid var(--border-1); border-radius: 2px;
    }
    .component header h3, .type header h3 {
      margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.008em; font-family: var(--font-mono); color: var(--fg-1);
    }
    .component header .src { margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); }

    pre { margin: 0; padding: 14px 18px; background: var(--bg-1); overflow-x: auto; }
    pre code { font-family: var(--font-mono); font-size: 12.5px; color: var(--fg-1); }
    pre.import { background: var(--bg-1); border-bottom: 1px solid var(--border-1); }
    .type pre { border-top: 1px solid var(--border-1); }

    .inherits { margin: 0; padding: 10px 18px; font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); border-bottom: 1px solid var(--border-1); }
    .inherits code { color: var(--fg-2); }

    table.props { width: 100%; border-collapse: collapse; }
    table.props th, table.props td {
      padding: 10px 18px; text-align: left; border-bottom: 1px solid var(--border-1);
      font-size: 13px; vertical-align: top;
    }
    table.props thead th {
      font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--fg-3); font-weight: 500; background: var(--bg-1);
    }
    table.props tr:last-child td { border-bottom: none; }
    table.props td code { font-family: var(--font-mono); font-size: 12.5px; }
    table.props td:first-child { width: 36%; white-space: nowrap; }
    table.props td:first-child code { color: var(--accent); }
    table.props .req {
      display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 2px;
      background: var(--accent-soft); color: var(--accent); font-family: var(--font-mono);
      font-size: 9.5px; letter-spacing: 0.06em; text-transform: uppercase;
    }

    .empty { padding: 14px 18px; color: var(--fg-3); font-size: 13px; margin: 0; }
    .muted { padding: 10px 18px; color: var(--fg-3); font-size: 13px; margin: 0; border-bottom: 1px solid var(--border-1); }
    .muted code { color: var(--fg-2); }

    /* Smooth anchor scroll */
    html { scroll-behavior: smooth; scroll-padding-top: 16px; }
  </style>
</head>
<body>
  <div class="layout">
    <aside>
      <a class="back" href="../">← Index</a>
      <div class="head">
        <div class="name">${escapeHtml(pkg.name)}</div>
        <div class="stats">${counts.components} components · ${counts.hooks} hooks · ${counts.tokens} tokens · ${counts.interfaces} interfaces</div>
      </div>
      <ul>${sidebarLinks}</ul>
    </aside>
    <main>
      <section class="hero">
        <p class="eyebrow">Components · API reference</p>
        <h1>Components</h1>
        <p>Auto-generated reference for every export of <code>${escapeHtml(pkg.name)}</code>. Source of truth: <code>src/components.d.ts</code> + <code>src/tokens.ts</code> + <code>src/index.tsx</code>. Regenerated on every push.</p>
        <div class="install"><code>npm install ${escapeHtml(pkg.name)}</code></div>
      </section>
      ${tokensHtml}
      ${categoryHtml}
      ${supportingHtml}
    </main>
  </div>
</body>
</html>
`;

writeFileSync(join(outDir, "index.html"), html);
console.log(
  `Wrote ${join(outDir, "index.html")}  (${counts.components} components, ${counts.hooks} hooks, ${counts.tokens} tokens, ${counts.interfaces} interfaces)`
);
