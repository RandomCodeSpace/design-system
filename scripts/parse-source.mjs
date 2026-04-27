/**
 * Reusable parsers for `src/components.ts`, `src/tokens.ts`, and
 * `src/index.tsx`. Used by both `build-docs.mjs` and `build-llms.mjs`.
 *
 * Pure regex — depends on the well-formatted hand-written shape of
 * components.ts (one `;`-terminated member per line; interface header
 * on a single line; `readonly`/`?` markers).
 */

export function tokenizeStatementsAtTopLevel(src) {
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
    if (c === ";" && depth === 0) { out.push(buf.trim()); buf = ""; }
    else buf += c;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").trim();
}

export function parseInterfaceMembers(body) {
  const stmts = tokenizeStatementsAtTopLevel(body);
  const props = [];
  for (const raw of stmts) {
    const stmt = stripComments(raw);
    if (!stmt) continue;
    const m = stmt.match(/^(readonly\s+)?(\[[^\]]+\]|"[^"]+"|'[^']+'|\w+)(\?)?\s*:\s*([\s\S]+)$/);
    if (!m) continue;
    let name = m[2];
    if (name.startsWith('"') || name.startsWith("'")) name = name.slice(1, -1);
    props.push({ readonly: !!m[1], name, optional: !!m[3], type: m[4].trim().replace(/\s+/g, " ") });
  }
  return props;
}

export function extractInterfaces(src) {
  const out = [];
  const re = /export\s+interface\s+(\w+)(\s*<[^{>]*(?:>[^{]*)*>)?\s*(?:extends\s+([^{]+?))?\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const start = re.lastIndex;
    let depth = 1, i = start;
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") depth--;
      i++;
    }
    out.push({
      name: m[1],
      generics: (m[2] || "").trim(),
      extends: (m[3] || "").trim(),
      props: parseInterfaceMembers(src.slice(start, i - 1)),
    });
    re.lastIndex = i;
  }
  return out;
}

export function extractTypeAliases(src) {
  const out = [];
  const re = /export\s+type\s+(\w+)(\s*<[^=]*>)?\s*=\s*([\s\S]+?);/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({ name: m[1], generics: (m[2] || "").trim(), value: m[3].trim().replace(/\s+/g, " ") });
  }
  return out;
}

export function parseRuntimeExports(indexTsxSrc) {
  const map = new Map();
  const re = /export\s*\{\s*([\s\S]+?)\s*\}\s*from\s*"\.\/components\/([^"]+)"/g;
  let m;
  while ((m = re.exec(indexTsxSrc))) {
    for (const name of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
      map.set(name, m[2]);
    }
  }
  return map;
}
