// Admin login with Supabase.
//   GET     who is logged in (401 + { configured } when not)
//   POST    { email, password }                     log in
//   POST    { action: "recover", email }            email a password-reset link
//   POST    { action: "reset", access_token, password }  set a new password from that link
//   DELETE  log out
const auth = require("./_lib/auth");
const { send, fail, body, methods } = require("./_lib/http");

const NOT_SET_UP = "The admin login isn't set up yet: add SUPABASE_URL, SUPABASE_ANON_KEY and SESSION_SECRET in Vercel → Settings → Environment Variables, then redeploy.";

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET", "POST", "DELETE"])) return;
  if (req.method === "GET") {
    let user = null;
    try { user = auth.readSession(req); } catch (e) { /* not configured */ }
    return user ? send(res, 200, { user: user.name, email: user.email, expires: user.expires }) : send(res, 401, { configured: auth.configured() });
  }
  if (req.method === "DELETE") {
    auth.setCookie(req, res, "", 0);
    return send(res, 200, { ok: true });
  }
  if (!auth.configured()) return fail(res, 503, NOT_SET_UP);
  const data = body(req);
  try {
    if (data.action === "recover") {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const proto = req.headers["x-forwarded-proto"] || (/^localhost|^127\./.test(host) ? "http" : "https");
      await auth.sendReset(data.email, `${proto}://${host}/admin`);
      return send(res, 200, { ok: true, message: "If that email has an admin account, a reset link is on its way." });
    }
    if (data.action === "reset") {
      await auth.resetPassword(data.access_token, data.password);
      return send(res, 200, { ok: true, message: "Your password has been changed. You can log in now." });
    }
    const user = await auth.verifyCredentials(data.email || data.username, data.password);
    auth.setCookie(req, res, auth.createSession(user), auth.SESSION_HOURS * 3600);
    send(res, 200, { user: user.name, email: user.email });
  } catch (e) {
    if (e instanceof auth.AuthError) {
      if (e.status === 401) await new Promise((r) => setTimeout(r, 300));
      return fail(res, e.status, e.message);
    }
    fail(res, 502, "The login service couldn't be reached. Please try again.");
  }
};
