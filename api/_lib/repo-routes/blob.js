// Upload one media file (base64) into the repository's storage. It becomes part of the
// site when the change that uses it is published.
const { requireUser } = require("../auth");
const { backend, checkPath } = require("../repo");
const { send, fail, body, methods } = require("../http");

const MAX = 3.3 * 1024 * 1024;   // Vercel accepts request bodies up to 4.5 MB (base64 adds a third)

// The file must really be what its name says (checked by its first bytes), so nothing else can be
// slipped into the site's files under an image or video name.
function matchesType(path, b) {
  const ext = (path.match(/\.([a-z0-9]+)$/i) || [])[1].toLowerCase();
  const head = b.subarray(0, 16), ascii = head.toString("latin1");
  switch (ext) {
    case "jpg": case "jpeg": return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "png": return ascii.startsWith("\x89PNG");
    case "gif": return ascii.startsWith("GIF8");
    case "webp": return ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP";
    case "avif": case "mp4": return ascii.slice(4, 8) === "ftyp";
    case "webm": return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
    case "ico": return b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0;
    case "svg": { const t = b.subarray(0, 2048).toString("utf8").replace(/^\uFEFF/, "").trimStart(); return /^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(t); }
    default: return false;
  }
}

module.exports = async (req, res) => {
  if (!methods(req, res, ["POST"]) || !requireUser(req, res)) return;
  const { path, content } = body(req);
  const bad = checkPath(path, false);
  if (bad) return fail(res, 400, bad);
  const buffer = Buffer.from(String(content || ""), "base64");
  if (!buffer.length) return fail(res, 400, "Empty file");
  if (buffer.length > MAX) return fail(res, 413, "This file is larger than 3.3 MB. Large videos are uploaded to Vercel Blob storage instead.");
  if (!matchesType(path, buffer)) return fail(res, 400, "This file's contents don't match its type. Please upload a real JPG, PNG, WebP, GIF, SVG or MP4 file.");
  if (/\.svg$/i.test(path) && /<script|\son[a-z]+\s*=|javascript:|<foreignObject|<iframe|<embed|<object/i.test(buffer.toString("utf8"))) return fail(res, 400, "This SVG contains scripts or embedded content, which isn't allowed. Export it again as a plain SVG, or use PNG.");
  try { send(res, 200, { path, sha: await backend.blob(buffer), size: buffer.length }); } catch (e) { fail(res, 502, e.message); }
};
