#!/usr/bin/env node
/**
 * Tiny static file server for the built `_site/` artifact.
 * Used by `playwright.config.ts` via the webServer config so e2e tests
 * run against the exact same files Pages will deploy.
 *
 *   node scripts/serve-site.mjs [rootDir]   # default: _site
 *
 * Env: PORT (default 4173).
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, normalize, join, sep } from "node:path";

const root = resolve(process.argv[2] || "_site");
const port = parseInt(process.env.PORT || "4173", 10);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    let p = decodeURIComponent(url.pathname);
    p = normalize(p).replace(/^\/+/, "");
    if (p.includes("..")) return res.writeHead(403).end();
    let abs = p === "" ? root : join(root, p);
    if (abs !== root && !abs.startsWith(root + sep)) return res.writeHead(403).end();
    let s;
    try { s = await stat(abs); } catch { return res.writeHead(404).end("Not found"); }
    if (s.isDirectory()) abs = join(abs, "index.html");
    try { s = await stat(abs); } catch { return res.writeHead(404).end("Not found"); }
    const data = await readFile(abs);
    res.writeHead(200, {
      "content-type": TYPES[extname(abs)] || "application/octet-stream",
      "cache-control": "no-cache",
    });
    res.end(data);
  } catch (e) {
    res.writeHead(500).end(String((e && e.message) || e));
  }
});
server.listen(port, () => {
  console.log(`serve-site → http://localhost:${port}  (root: ${root})`);
});
