// One file's content (base64), at the latest version or at an older one (?ref=<commit>).
const { requireUser } = require("../auth");
const { backend } = require("../repo");
const { send, fail, methods } = require("../http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET"]) || !requireUser(req, res)) return;
  const { path, ref } = req.query || {};
  if (!path || !/^(content|assets\/img|assets\/video)\//.test(path) || path.includes("..")) return fail(res, 400, "Invalid path");
  try {
    const f = await backend.read(path, ref);
    if (!f) return fail(res, 404, "File not found");
    send(res, 200, { path, sha: f.sha, content: f.content.toString("base64") });
  } catch (e) { fail(res, 502, e.message); }
};
