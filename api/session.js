// GET: who is logged in · POST: log in with username + password · DELETE: log out
const auth = require("./_lib/auth");
const { send, fail, body, methods } = require("./_lib/http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET", "POST", "DELETE"])) return;
  if (req.method === "GET") {
    let user = null;
    try { user = auth.readSession(req); } catch (e) { /* not configured */ }
    return user ? send(res, 200, { user: user.name, expires: user.expires }) : send(res, 401, { configured: auth.configured() });
  }
  if (req.method === "DELETE") {
    auth.setCookie(req, res, "", 0);
    return send(res, 200, { ok: true });
  }
  if (!auth.configured()) {
    return fail(res, 503, "The admin login is not set up yet: add ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET in Vercel → Settings → Environment Variables, then redeploy.");
  }
  const wait = auth.locked(req);
  if (wait) return fail(res, 429, `Too many attempts. Try again in ${wait} minute${wait > 1 ? "s" : ""}.`);
  const { username, password } = body(req);
  const user = await auth.verifyCredentials(username, password);
  if (!user) {
    auth.recordFailure(req);
    await new Promise((r) => setTimeout(r, 400));
    return fail(res, 401, "That username and password don't match.");
  }
  auth.clearFailures(req);
  auth.setCookie(req, res, auth.createSession(user), auth.SESSION_HOURS * 3600);
  send(res, 200, { user: user.name });
};
