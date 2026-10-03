// Publish: all pending changes in one commit. Vercel then rebuilds the site.
// changes: [{ path, text }] | [{ path, sha }] (uploaded media) | [{ path, delete: true }]
const { requireUser } = require("../_lib/auth");
const { backend, checkPath, Conflict } = require("../_lib/repo");
const { send, fail, body, methods } = require("../_lib/http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["POST"])) return;
  const user = requireUser(req, res);
  if (!user) return;
  const { message, base, changes } = body(req);
  if (!Array.isArray(changes) || !changes.length) return fail(res, 400, "Nothing to publish");
  if (changes.length > 200) return fail(res, 400, "Too many changes in one publish (max 200)");
  const seen = new Set();
  const list = [];
  for (const c of changes) {
    const bad = checkPath(c.path, !!c.delete);
    if (bad) return fail(res, 400, bad);
    if (seen.has(c.path)) return fail(res, 400, `Duplicate change for ${c.path}`);
    seen.add(c.path);
    if (c.delete) list.push({ path: c.path, delete: true });
    else if (typeof c.text === "string") list.push({ path: c.path, buffer: Buffer.from(c.text, "utf8") });
    else if (/^[0-9a-f]{40}$/.test(c.sha || "")) list.push({ path: c.path, sha: c.sha });
    else return fail(res, 400, `No content for ${c.path}`);
  }
  const msg = String(message || "").trim().slice(0, 200) || `Update ${list.length} item${list.length > 1 ? "s" : ""}`;
  try {
    const r = await backend.commit({ message: `Admin: ${msg}`, base, changes: list, author: user.name });
    send(res, 200, { sha: r.sha });
  } catch (e) {
    if (e instanceof Conflict) return fail(res, 409, "Someone else published changes to the same content while you were editing.", { paths: e.paths });
    fail(res, 502, e.message);
  }
};
