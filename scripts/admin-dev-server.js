#!/usr/bin/env node
// Run the site + admin locally, like Vercel does, against a local git checkout.
//   ADMIN_LOCAL_REPO=/path/to/clone ADMIN_USERNAME=me ADMIN_PASSWORD=secret SESSION_SECRET=<32+ chars> \
//     node scripts/admin-dev-server.js [port]
// Serves public/ (run scripts/vercel-build.sh first) with clean URLs, and the api/ functions.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public");
const PORT = Number(process.argv[2]) || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".yml": "text/yaml; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".py": "text/plain; charset=utf-8", ".xml": "application/xml", ".txt": "text/plain" };

function api(req, res, url) {
  const file = path.join(ROOT, url.pathname.replace(/\/$/, "") + ".js");
  if (!file.startsWith(path.join(ROOT, "api")) || !fs.existsSync(file)) { res.statusCode = 404; return res.end("{}"); }
  req.query = Object.fromEntries(url.searchParams);
  let raw = "";
  req.on("data", (c) => { raw += c; });
  req.on("end", async () => {
    try { req.body = raw ? JSON.parse(raw) : {}; } catch (e) { req.body = {}; }
    try { await require(file)(req, res); } catch (e) { console.error(e); res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) return api(req, res, url);
  let p = decodeURIComponent(url.pathname);
  let f = path.join(PUB, p);
  if (!f.startsWith(PUB)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  else if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
  if (!fs.existsSync(f)) { res.statusCode = 404; f = path.join(PUB, "404.html"); }
  res.setHeader("Content-Type", TYPES[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`Admin dev server on http://localhost:${PORT}/admin (repo: ${process.env.ADMIN_LOCAL_REPO || "GitHub"})`));
