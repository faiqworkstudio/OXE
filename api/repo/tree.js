// Every content file and media file in the repository, plus the current version (head).
const { requireUser } = require("../_lib/auth");
const { backend } = require("../_lib/repo");
const { send, fail, methods } = require("../_lib/http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET"]) || !requireUser(req, res)) return;
  try { send(res, 200, await backend.tree()); } catch (e) { fail(res, 502, e.message); }
};
