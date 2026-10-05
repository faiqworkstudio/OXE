// Upload one media file (base64) into the repository's storage. It becomes part of the
// site when the change that uses it is published.
const { requireUser } = require("../auth");
const { backend, checkPath } = require("../repo");
const { send, fail, body, methods } = require("../http");

const MAX = 3.3 * 1024 * 1024;   // Vercel accepts request bodies up to 4.5 MB (base64 adds a third)

module.exports = async (req, res) => {
  if (!methods(req, res, ["POST"]) || !requireUser(req, res)) return;
  const { path, content } = body(req);
  const bad = checkPath(path, false);
  if (bad) return fail(res, 400, bad);
  const buffer = Buffer.from(String(content || ""), "base64");
  if (!buffer.length) return fail(res, 400, "Empty file");
  if (buffer.length > MAX) return fail(res, 413, "This file is larger than 3.3 MB. Large videos are uploaded to Vercel Blob storage instead.");
  try { send(res, 200, { path, sha: await backend.blob(buffer), size: buffer.length }); } catch (e) { fail(res, 502, e.message); }
};
