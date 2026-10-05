// All content files (pages, articles, projects) in one response, for the admin's lists
// and live preview: { head, files: { "content/home.yml": "<text>", ... } }.
const { requireUser } = require("../auth");
const { backend } = require("../repo");
const { send, fail, methods } = require("../http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET"]) || !requireUser(req, res)) return;
  try {
    const tree = await backend.tree();
    const paths = tree.files.filter((f) => /^content\/.+\.(yml|md)$/.test(f.path)).map((f) => f.path);
    const files = {};
    for (let i = 0; i < paths.length; i += 8) {   // a few at a time
      await Promise.all(paths.slice(i, i + 8).map(async (p) => {
        const f = await backend.read(p, tree.head);
        if (f) files[p] = f.content.toString("utf8");
      }));
    }
    send(res, 200, { head: tree.head, media: tree.files.filter((f) => /^assets\//.test(f.path)), files });
  } catch (e) { fail(res, 502, e.message); }
};
