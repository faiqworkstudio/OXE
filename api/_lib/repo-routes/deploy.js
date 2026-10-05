// Deployment status of a published version (from Vercel's status on GitHub).
const { requireAccess } = require("../auth");
const { backend } = require("../repo");
const { send, fail, methods } = require("../http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET"]) || !(await requireAccess(req, res, "site.read"))) return;
  const sha = String((req.query || {}).sha || "");
  if (!/^[0-9a-f]{40}$/.test(sha)) return fail(res, 400, "Invalid version");
  try { send(res, 200, await backend.deploy(sha)); } catch (e) { fail(res, 502, e.message); }
};
