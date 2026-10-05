// A photo or video straight from the repository, for the admin while the website hasn't been
// rebuilt with it yet (just published, or the admin is open on an older deployment).
//   GET ?path=assets/img/work/photo.webp
const { requireUser } = require("../auth");
const { backend } = require("../repo");
const { fail, methods } = require("../http");

const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif", svg: "image/svg+xml", ico: "image/x-icon", mp4: "video/mp4", webm: "video/webm" };

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET"]) || !requireUser(req, res)) return;
  const path = String((req.query && req.query.path) || "").replace(/^\/+/, "");
  const ext = (path.match(/\.([a-z0-9]+)$/i) || [])[1];
  if (!/^assets\/(img|video)\//.test(path) || path.includes("..") || !TYPES[String(ext).toLowerCase()]) return fail(res, 400, "Invalid path");
  try {
    const f = await backend.read(path);
    if (!f) return fail(res, 404, "File not found");
    res.statusCode = 200;
    res.setHeader("Content-Type", TYPES[ext.toLowerCase()]);
    res.setHeader("Cache-Control", "private, max-age=600");
    res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");   // an uploaded SVG can't run scripts
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(f.content);
  } catch (e) { fail(res, 502, e.message); }
};
