// Every content file and media file in the repository, plus the current version (head).
const { requireUser } = require("../auth");
const { backend } = require("../repo");
const { send, fail, methods } = require("../http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET"]) || !requireUser(req, res)) return;
  try { send(res, 200, await backend.tree()); } catch (e) { fail(res, 502, e.message); }
};
