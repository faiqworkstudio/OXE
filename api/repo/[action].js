// One function for all the admin's content endpoints (/api/repo/tree, file, blob, commit,
// history, deploy, bundle), so the site stays within the Vercel Hobby plan's limit of
// 12 functions per deployment. Each endpoint lives in api/_lib/repo-routes/.
const { fail } = require("../_lib/http");

const ROUTES = {
  blob: require("../_lib/repo-routes/blob"),
  bundle: require("../_lib/repo-routes/bundle"),
  commit: require("../_lib/repo-routes/commit"),
  deploy: require("../_lib/repo-routes/deploy"),
  file: require("../_lib/repo-routes/file"),
  history: require("../_lib/repo-routes/history"),
  tree: require("../_lib/repo-routes/tree"),
};

module.exports = (req, res) => {
  const action = String((req.query && req.query.action) || "");
  const route = Object.prototype.hasOwnProperty.call(ROUTES, action) ? ROUTES[action] : null;
  if (!route) return fail(res, 404, "Not found");
  return route(req, res);
};
