// Recent versions of one file (or of the whole site when no path is given).
const { requireUser } = require("../_lib/auth");
const { backend } = require("../_lib/repo");
const { send, fail, methods } = require("../_lib/http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET"]) || !requireUser(req, res)) return;
  const { path } = req.query || {};
  const limit = Math.min(50, Math.max(1, Number((req.query || {}).limit) || 20));
  if (path && (!/^(content|assets)\//.test(path) || path.includes(".."))) return fail(res, 400, "Invalid path");
  try { send(res, 200, { commits: await backend.history(path, limit) }); } catch (e) { fail(res, 502, e.message); }
};
