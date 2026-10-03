// Deployment status of a published version (from Vercel's status on GitHub).
const { requireUser } = require("../_lib/auth");
const { backend } = require("../_lib/repo");
const { send, fail, methods } = require("../_lib/http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET"]) || !requireUser(req, res)) return;
  const sha = String((req.query || {}).sha || "");
  if (!/^[0-9a-f]{40}$/.test(sha)) return fail(res, 400, "Invalid version");
  try { send(res, 200, await backend.deploy(sha)); } catch (e) { fail(res, 502, e.message); }
};
